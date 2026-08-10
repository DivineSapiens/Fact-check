import { NextResponse } from "next/server";
import { verifyClaimUniversal } from "@/lib/factchecker";
import mockResponses from "../../../../data/mockResponses.json";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const claimText = (body.text || body.claim || "").trim();

    if (!claimText) {
      return NextResponse.json(
        { error: "Claim text is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const useMock = process.env.USE_MOCK === "true";
    console.log(`[API /api/check-claim] Checking claim (USE_MOCK=${useMock}): "${claimText}"`);

    if (useMock) {
      const normalizedInput = claimText.toLowerCase();
      const match = mockResponses.find((item) => {
        const itemClaim = item.claim.toLowerCase();
        return itemClaim === normalizedInput || itemClaim.includes(normalizedInput) || normalizedInput.includes(itemClaim);
      });
      if (match) {
        return NextResponse.json(match, { headers: corsHeaders() });
      }
    }

    // Universal Fact-Checking Engine (Groq / OpenRouter / Gemini / Zero-Key Live Search)
    const result = await verifyClaimUniversal(claimText);
    console.log(`[API /api/check-claim] Fact-Check Result:`, result);
    return NextResponse.json(result, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error in /api/check-claim:", error);
    return NextResponse.json(
      {
        claim: "",
        trustScore: 0,
        status: "Likely False",
        explanation: error.message || "An error occurred while evaluating the claim.",
        sources: [],
        correctedText: error.message || "An error occurred while evaluating the claim.",
      },
      { status: 200, headers: corsHeaders() }
    );
  }
}
