import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";
import OpenAI from "openai";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST() {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspace } = result;

    if (!workspace.llmApiKey) {
      return NextResponse.json({ error: "No LLM API key configured. Please set your API key in Settings to generate AI categories." }, { status: 400 });
    }

    
    const reviews = await prisma.review.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { reviewText: true }
    });

    if (reviews.length === 0) {
      return NextResponse.json({ success: true, topCategories: [] });
    }

    
    const categoryCounts: Record<string, number> = {};

    
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      batches.push(reviews.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const reviewTexts = batch.map((r, idx) => `[${idx+1}] ${r.reviewText.slice(0, 500)}`).join("\n");
      
      const prompt = `Analyze the following customer reviews. Group them into distinct, meaningful categories (like "Customer Support", "Battery Life", "Pricing", "Software Bugs", etc. - avoiding generic ones like "Other" or "General"). 
Return ONLY a valid JSON array of objects, where each object has "category" (string) and "count" (number of reviews that fit this category).

Reviews:
${reviewTexts}`;

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
          if (res.status === 429) { await delay(5000); } 
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          generatedJsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        } else if (workspace.llmProvider === "huggingface") {
          const openai = new OpenAI({ baseURL: "https://router.huggingface.co/v1", apiKey: workspace.llmApiKey });
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/Llama-3.1-8B-Instruct",
            max_tokens: 1000
          });
          generatedJsonStr = completion.choices[0].message.content || "[]";
        } else if (workspace.llmProvider === "others") {
          const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: workspace.llmApiKey });
          const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/llama-3-8b-instruct:free",
          });
          generatedJsonStr = completion.choices[0].message.content || "[]";
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
        console.error(`Batch ${i+1} LLM Generation error:`, llmError);
        
      }

      
      generatedJsonStr = generatedJsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
      const firstBracket = generatedJsonStr.indexOf("[");
      const lastBracket = generatedJsonStr.lastIndexOf("]");
      const firstBrace = generatedJsonStr.indexOf("{");
      const lastBrace = generatedJsonStr.lastIndexOf("}");
      
      let parsed: { category: string; count: number }[] = [];
      try {
        if (firstBracket !== -1 && lastBracket >= firstBracket && (firstBracket < firstBrace || firstBrace === -1)) {
          parsed = JSON.parse(generatedJsonStr.substring(firstBracket, lastBracket + 1));
        } else if (firstBrace !== -1 && lastBrace >= firstBrace) {
          const obj = JSON.parse(generatedJsonStr.substring(firstBrace, lastBrace + 1));
          if (obj.categories && Array.isArray(obj.categories)) {
            parsed = obj.categories;
          } else {
            parsed = Object.entries(obj).map(([k, v]) => ({ category: k, count: Number(v) || 0 }));
          }
        }
      } catch (parseErr) {
        console.error("Failed to parse batch JSON:", parseErr, "Raw output:", generatedJsonStr);
      }

      
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.category && typeof item.count === "number") {
            
            const catName = item.category.trim();
            const normalized = catName.charAt(0).toUpperCase() + catName.slice(1);
            categoryCounts[normalized] = (categoryCounts[normalized] || 0) + item.count;
          }
        }
      }

      
      if (i < batches.length - 1) {
        await delay(2000); 
      }
    }

    
    const sortedCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const top5 = sortedCategories.slice(0, 5);

    
    await prisma.analyticsCache.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        topCategories: top5,
      },
      update: {
        topCategories: top5,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, topCategories: top5 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("AI Category generation error:", errMsg);
    return NextResponse.json({ error: errMsg || "Failed to generate AI categories" }, { status: 500 });
  }
}
