import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    const { claim, score, status, reporterId, sourceUrl, sources } = body;

    if (!claim) {
      return NextResponse.json(
        { error: "Claim text is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const reportData = {
      claim: claim,
      score: typeof score === "number" ? score : 0,
      status: status || "Reported",
      reporterId: reporterId || `user_${Math.random().toString(36).substring(2, 7)}`,
      sourceUrl: sourceUrl || "",
      sources: Array.isArray(sources) ? sources : [],
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "reports"), reportData);

    return NextResponse.json(
      { success: true, id: docRef.id, report: reportData },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Error writing to Firestore reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record rumor report" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
