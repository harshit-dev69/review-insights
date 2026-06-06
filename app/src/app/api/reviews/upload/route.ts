import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";
import { analyzeReviewsBatch, SentimentProvider } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const { workspace } = result;
    const body = await req.json();
    const { reviews } = body;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: "No reviews provided" }, { status: 400 });
    }

    
    const provider = (workspace.sentimentProvider || "huggingface") as SentimentProvider;
    const apiKey = provider === "huggingface" 
      ? (workspace.hfApiKey || process.env.HUGGINGFACE_API_KEY) 
      : (provider === "gemini" ? (workspace.llmApiKey || process.env.GEMINI_API_KEY) : workspace.llmApiKey);

    if (!apiKey) {
      const providerLabel = provider === "huggingface" ? "HuggingFace" : provider === "gemini" ? "Gemini" : "OpenAI";
      return NextResponse.json(
        { error: `No ${providerLabel} API key configured in Settings. Please add one to process uploads.` },
        { status: 400 }
      );
    }

    const texts = reviews.map((r: { text: string }) => r.text);
    const aiResults = await analyzeReviewsBatch(texts, provider, apiKey);

    const createdReviews = [];

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const aiResult = aiResults[i];

      const created = await prisma.review.create({
        data: {
          workspaceId: workspace.id,
          reviewText: review.text,
          source: review.source || "manual",
          rating: review.rating ? parseInt(review.rating) : null,
          reviewDate: review.date ? new Date(review.date) : new Date(),
          aiAnalysis: {
            create: {
              sentiment: aiResult.sentiment,
              confidence: aiResult.confidence,
              category: aiResult.category,
            },
          },
          ...(aiResult.sentiment === "NEGATIVE"
            ? {
                complaint: {
                  create: {
                    workspaceId: workspace.id,
                    status: "OPEN",
                    severity: aiResult.confidence > 80 ? "HIGH" : aiResult.confidence > 60 ? "MEDIUM" : "LOW",
                  },
                },
              }
            : {}),
        },
        include: { aiAnalysis: true },
      });
      createdReviews.push(created);
    }

    

    return NextResponse.json({ success: true, count: createdReviews.length, message: `${createdReviews.length} reviews processed` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" }, 
      { status: 500 }
    );
  }
}
