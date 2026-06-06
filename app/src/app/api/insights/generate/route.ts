import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";
import OpenAI from "openai";
export async function POST() {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspace } = result;

    if (!workspace.llmApiKey) {
      return NextResponse.json({ error: "No API key configured. Please set your API key in Settings." }, { status: 400 });
    }

    
    const totalReviews = await prisma.review.count({ where: { workspaceId: workspace.id } });
    const sentiments = await prisma.aiAnalysis.groupBy({
      by: ["sentiment"],
      where: { review: { workspaceId: workspace.id } },
      _count: true,
    });
    const sentimentMap: Record<string, number> = {};
    sentiments.forEach((s) => { sentimentMap[s.sentiment] = s._count; });
    const positivePercent = totalReviews ? ((sentimentMap["POSITIVE"] || 0) / totalReviews) * 100 : 0;
    const negativePercent = totalReviews ? ((sentimentMap["NEGATIVE"] || 0) / totalReviews) * 100 : 0;

    const topCats = await prisma.aiAnalysis.groupBy({
      by: ["category"],
      where: { review: { workspaceId: workspace.id } },
      _count: true,
      orderBy: { _count: { category: "desc" } },
      take: 5,
    });

    
    const recentComplaints = await prisma.complaint.findMany({
      where: { workspaceId: workspace.id, status: "OPEN" },
      include: { review: { include: { aiAnalysis: true } } },
      take: 10,
      orderBy: { createdAt: "desc" }
    });

    const contextData = {
      totalReviews,
      positivePercent: positivePercent.toFixed(1),
      negativePercent: negativePercent.toFixed(1),
      topCategories: topCats.map(c => ({ category: c.category, count: c._count })),
      recentComplaints: recentComplaints.map(c => ({
        issue: c.review?.aiAnalysis?.category,
        text: c.review?.reviewText?.slice(0, 200)
      }))
    };

    const prompt = `You are an AI business analyst for a company. 
Analyze the following latest data from our customer reviews system and generate an executive summary.
Return ONLY a valid JSON object with the following exact keys:
"summary": A high-level executive summary (2-3 sentences),
"keyIssues": An array of strings representing the major complaint trends,
"positiveHighlights": An array of strings representing what customers love,
"recommendations": An array of strings representing actionable business recommendations.

Data:
${JSON.stringify(contextData, null, 2)}`;

    let generatedJsonStr = "";

    try {
      if (workspace.llmProvider === "gemini") {
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${workspace.llmApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        generatedJsonStr = data.candidates[0].content.parts[0].text;
      } else if (workspace.llmProvider === "huggingface") {
        const openai = new OpenAI({ 
          baseURL: "https://router.huggingface.co/v1",
          apiKey: workspace.llmApiKey 
        });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "meta-llama/Llama-3.1-8B-Instruct", 
          max_tokens: 1000
        });
        generatedJsonStr = completion.choices[0].message.content || "{}";
      } else if (workspace.llmProvider === "others") {
        
        const openai = new OpenAI({ 
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: workspace.llmApiKey 
        });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "meta-llama/llama-3-8b-instruct:free", 
        });
        generatedJsonStr = completion.choices[0].message.content || "{}";
      } else {
        const openai = new OpenAI({ apiKey: workspace.llmApiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini",
          response_format: { type: "json_object" }
        });
        generatedJsonStr = completion.choices[0].message.content || "{}";
      }
    } catch (llmError) {
      const errMsg = llmError instanceof Error ? llmError.message : String(llmError);
      console.error("LLM Generation error:", errMsg);
      return NextResponse.json({ error: `AI Generation failed: ${errMsg}` }, { status: 500 });
    }

    generatedJsonStr = generatedJsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const firstBrace = generatedJsonStr.indexOf("{");
    const lastBrace = generatedJsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
       generatedJsonStr = generatedJsonStr.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(generatedJsonStr);

    const insight = await prisma.insight.create({
      data: {
        workspaceId: workspace.id,
        summary: parsed.summary || "No summary generated.",
        keyIssues: parsed.keyIssues || [],
        positiveHighlights: parsed.positiveHighlights || [],
        recommendations: parsed.recommendations || []
      }
    });

    return NextResponse.json({ success: true, insight });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Insights generation error:", errMsg);
    return NextResponse.json({ error: errMsg || "Failed to generate insights" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const insights = await prisma.insight.findMany({
      where: { workspaceId: result.workspace.id },
      orderBy: { generatedAt: "desc" },
      take: 5
    });

    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
