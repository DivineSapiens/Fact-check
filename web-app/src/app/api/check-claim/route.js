import { NextResponse } from "next/server";
import { checkClaimWithGemini } from "@/lib/gemini";
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
      // Mock Mode: Match against mockResponses.json
      const normalizedInput = claimText.toLowerCase();
      const match = mockResponses.find((item) => {
        const itemClaim = item.claim.toLowerCase();
        return (
          itemClaim === normalizedInput ||
          itemClaim.includes(normalizedInput) ||
          normalizedInput.includes(itemClaim)
        );
      });

      if (match) {
        console.log(`[API /api/check-claim] Mock Match Found:`, match);
        return NextResponse.json(match, { headers: corsHeaders() });
      }

      // Fall through to clear "not in demo set" response
      const fallbackMock = {
        claim: claimText,
        trustScore: 0,
        status: "Needs Context",
        explanation:
          "Claim not found in pre-captured demo dataset. Toggle USE_MOCK=false to perform live Gemini AI fact-checking.",
        sources: [],
        correctedText: `Factual Correction required: The claim "${claimText}" is not in the pre-captured mock set. Toggle USE_MOCK=false for live verification.`,
      };
      console.log(`[API /api/check-claim] Mock Fallback Response:`, fallbackMock);
      return NextResponse.json(fallbackMock, { headers: corsHeaders() });
    }

    // Live Mode: Call Gemini Flash API with Search Grounding
    const result = await checkClaimWithGemini(claimText);
    console.log(`[API /api/check-claim] Live Gemini Result:`, result);
    return NextResponse.json(result, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error in /api/check-claim:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to check claim",
        claim: "",
        trustScore: 0,
        status: "Likely False",
        explanation: "An error occurred while evaluating the claim.",
        sources: [],
        correctedText: "An error occurred while evaluating the claim.",
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
