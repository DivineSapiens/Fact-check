/**
 * Hackathon Mock Data Pre-Capture Script
 * 
 * Runs the live Gemini Flash pipeline with Google Search Grounding enabled
 * against a curated set of real claims and writes output to web-app/data/mockResponses.json.
 * 
 * Usage:
 *   node scripts/capture-mock-data.js
 */

const fs = require("fs");
const path = require("path");

// Load .env.local if present
const envPath = path.join(__dirname, "../web-app/.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  });
}

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const curatedClaims = [
  "The Great Wall of China is visible from the Moon with the naked eye.",
  "Bananas grow on trees.",
  "Water boils at 100 degrees Celsius at sea level.",
  "Humans only use 10 percent of their brain.",
  "5G mobile towers cause viral infections and disease."
];

async function checkClaim(claimText) {
  console.log(`🔍 Processing live grounding for claim: "${claimText}"...`);

  const TRUSTED_SOURCES = `
- World Health Organization: who.int
- CDC (US Centers for Disease Control and Prevention): cdc.gov
- United Nations: un.org
- UNESCO: unesco.org
- AFP Fact Check: factcheck.afp.com
- Reuters Fact Check: reuters.com/fact-check
- Snopes: snopes.com
- Google Fact Check Tools: toolbox.google.com/factcheck
- Associated Press: apnews.com
- BBC News: bbc.com/news
`.trim();

  const prompt = `You are an expert fact-checker. Analyze the following claim carefully:
"${claimText}"

When fact-checking this claim using Search grounding, prioritize finding evidence from the following trusted, authoritative sources where applicable:
${TRUSTED_SOURCES}
If none of these sources have relevant coverage of this specific claim, fall back to other reputable, verifiable sources instead.

Evaluate the factual accuracy of this claim using Google Search.
Return your evaluation strictly in raw JSON format (no markdown code blocks) with the following structure:
{
  "claim": "${claimText.replace(/"/g, '\\"')}",
  "trustScore": <integer between 0 and 100>,
  "status": "<Verified True | Needs Context | Likely False>",
  "explanation": "<concise explanation, max 50 words>",
  "correctedText": "<State the actual verified factual correction explaining why the claim is inaccurate/false or what context is missing. DO NOT repeat or echo the claim itself.>"
}
`;

  // Support both API keys (AIza...) and OAuth tokens (AQ...)
  let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
  const headers = { "Content-Type": "application/json" };

  if (API_KEY.startsWith("AQ.")) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  } else {
    url += `?key=${API_KEY}`;
    headers["x-goog-api-key"] = API_KEY;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.1 }
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error [${res.status}]: ${text}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const rawText = candidate?.content?.parts?.[0]?.text || "";

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "").trim();

  let parsed = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    parsed = {
      claim: claimText,
      trustScore: 50,
      status: "Needs Context",
      explanation: rawText.substring(0, 150),
      correctedText: claimText
    };
  }

  // Extract grounding citations ONLY from groundingMetadata
  const sources = [];
  const groundingMetadata = candidate?.groundingMetadata;
  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || new URL(chunk.web.uri).hostname,
          url: chunk.web.uri,
        });
      }
    }
  }

  const uniqueSources = Array.from(
    new Map(sources.map((item) => [item.url, item])).values()
  );

  let trustScore = typeof parsed.trustScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.trustScore))) : 50;
  let status = parsed.status;
  if (trustScore >= 80) status = "Verified True";
  else if (trustScore >= 40) status = "Needs Context";
  else status = "Likely False";

  return {
    claim: parsed.claim || claimText,
    trustScore: trustScore,
    status: status,
    explanation: parsed.explanation || "Fact check completed.",
    sources: uniqueSources,
    correctedText: parsed.correctedText || claimText,
  };
}

async function main() {
  const results = [];
  for (const claim of curatedClaims) {
    try {
      const res = await checkClaim(claim);
      results.push(res);
      console.log(`  ✓ Success (${res.status}, Trust Score: ${res.trustScore}, Grounded Sources: ${res.sources.length})`);
    } catch (err) {
      console.error(`  ❌ Failed for claim "${claim}":`, err.message);
    }
  }

  if (results.length > 0) {
    const outputPath = path.join(__dirname, "../web-app/data/mockResponses.json");
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n🎉 Mock data successfully captured (${results.length} items) and saved to ${outputPath}`);
  } else {
    console.log("\n⚠️ No live responses captured; pre-existing mockResponses.json preserved.");
  }
}

main();
