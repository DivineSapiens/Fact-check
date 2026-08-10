/**
 * Gemini 3.5 / 2.5 / 1.5 Flash Service with Google Search Grounding
 */

export async function checkClaimWithGemini(claimText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }

  const TRUSTED_SOURCES = `
TRUSTED SOURCES (prioritize these domains when relevant):
- Health Global: World Health Organization — who.int
- Health US: CDC — cdc.gov
- UN: United Nations — un.org
- UN: UNESCO — unesco.org
- Fact Check: AFP Fact Check — factcheck.afp.com
- Fact Check: Reuters Fact Check — reuters.com/fact-check
- Fact Check: Snopes — snopes.com
- Fact Check: Google Fact Check Tools — toolbox.google.com/factcheck
- News: Associated Press — apnews.com
- News: BBC News — bbc.com/news
`.trim();

  const prompt = `You are an expert fact-checker. Analyze the following claim carefully:
"${claimText}"

When fact-checking this claim using Search grounding, prioritize finding evidence from the following trusted, authoritative sources where applicable:
${TRUSTED_SOURCES}
If none of these sources have relevant coverage of this specific claim, fall back to other reputable, verifiable sources instead.

Evaluate the factual accuracy of this claim using Google Search.
Return your evaluation strictly in raw JSON format (no markdown code blocks, no trailing comments) with the following structure:
{
  "claim": "${claimText.replace(/"/g, '\\"')}",
  "trustScore": <integer between 0 and 100>,
  "status": "<Verified True | Needs Context | Likely False>",
  "explanation": "<concise explanation, max 50 words>",
  "correctedText": "<State the actual verified factual correction explaining why the claim is inaccurate/false or what context is missing. DO NOT repeat or echo the claim itself.>"
}

Rules for trustScore and status:
- trustScore 80-100 -> status MUST be "Verified True"
- trustScore 40-79 -> status MUST be "Needs Context"
- trustScore 0-39 -> status MUST be "Likely False"
- explanation MUST be strictly 50 words or fewer.
- correctedText MUST provide the verified factual correction. DO NOT return the original claim.
`;

  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash"
  ];

  let lastApiError = null;
  let data = null;

  for (const modelName of modelsToTry) {
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    };
    if (apiKey.startsWith("AQ.")) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      tools: [
        {
          googleSearch: {},
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        data = await res.json();
        console.log(`[gemini.js] Successfully generated content using model: ${modelName}`);
        break;
      }

      const errText = await res.text();
      console.warn(`Gemini API Model [${modelName}] returned [${res.status}]:`, errText);
      lastApiError = new Error(`Gemini API request failed [${res.status}]: ${errText}`);
    } catch (err) {
      lastApiError = err;
    }
  }

  if (!data) {
    throw lastApiError || new Error("Failed to call Gemini API across all model endpoints");
  }
  console.log("Raw Gemini API Response:", JSON.stringify(data, null, 2));

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error("No candidates returned from Gemini API");
  }

  const rawText = candidate.content?.parts?.[0]?.text || "";
  
  // Clean markdown formatting
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }

  let parsed = {};
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText);
    parsed = {
      claim: claimText,
      trustScore: 50,
      status: "Needs Context",
      explanation: rawText.substring(0, 200) || "Fact-check evaluation completed.",
      correctedText: "",
    };
  }

  // Extract grounding sources STRICTLY from candidate.groundingMetadata
  const sources = [];
  const groundingMetadata = candidate.groundingMetadata;

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

  // Deduplicate sources by URL
  const uniqueSources = Array.from(
    new Map(sources.map((item) => [item.url, item])).values()
  );

  // Normalize score & status mapping
  let trustScore = typeof parsed.trustScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.trustScore))) : 50;
  let status = parsed.status;

  if (trustScore >= 80) {
    status = "Verified True";
  } else if (trustScore >= 40) {
    status = "Needs Context";
  } else {
    status = "Likely False";
  }

  // Sanitize correctedText: Ensure it NEVER equals the original claim
  let correctedText = (parsed.correctedText || "").trim();
  const normalizedClaim = claimText.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedCorrection = correctedText.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!correctedText || normalizedCorrection === normalizedClaim || normalizedCorrection.includes(normalizedClaim)) {
    if (trustScore < 80) {
      correctedText = `Factual Correction: ${parsed.explanation || "This claim is unverified or inaccurate based on ground-truth search citations."}`;
    } else {
      correctedText = `Verified Summary: ${parsed.explanation || "This statement is accurate according to ground-truth search sources."}`;
    }
  }

  return {
    claim: parsed.claim || claimText,
    trustScore: trustScore,
    status: status,
    explanation: parsed.explanation || "Fact-check completed.",
    sources: uniqueSources,
    correctedText: correctedText,
  };
}
