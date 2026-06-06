import { NextRequest, NextResponse } from "next/server";
import { getAnyWorkspace } from "@/lib/auth";
import { analyzeReview, SentimentProvider } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspace } = result;

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    
    const provider = (workspace.sentimentProvider || "huggingface") as SentimentProvider;
    const apiKey = (provider === "huggingface" 
      ? (workspace.hfApiKey || process.env.HUGGINGFACE_API_KEY) 
      : (provider === "gemini" ? (workspace.llmApiKey || process.env.GEMINI_API_KEY) : workspace.llmApiKey)) || undefined;

    try {
      const prediction = await analyzeReview(text, provider, apiKey);
      return NextResponse.json(prediction);
    } catch (aiError) {
      const errMsg = aiError instanceof Error ? aiError.message : String(aiError);
      console.error("AI analysis failed:", errMsg);
      return NextResponse.json(
        { error: `AI analysis failed: ${errMsg}` },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
