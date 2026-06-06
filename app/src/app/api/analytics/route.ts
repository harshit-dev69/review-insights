import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";

export async function GET() {
  try {
    const result = await getAnyWorkspace();
    if (!result) {
      return NextResponse.json({
        totalReviews: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0,
        avgConfidence: 0, topCategories: [], trendData: [], complaintStats: []
      });
    }

    const { workspace } = result;

    const reviews = await prisma.review.findMany({
      where: { workspaceId: workspace.id },
      include: { aiAnalysis: true },
      orderBy: { reviewDate: "asc" },
    });

    
    const trendMap: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};
    let posCount = 0;
    let negCount = 0;
    let neuCount = 0;
    let confSum = 0;
    let confCount = 0;

    for (const r of reviews) {
      const date = (r.reviewDate || r.createdAt).toISOString().split("T")[0];
      if (!trendMap[date]) trendMap[date] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      trendMap[date].total++;

      const s = r.aiAnalysis?.sentiment?.toUpperCase();
      switch (s) {
        case "POSITIVE":
          trendMap[date].positive++;
          posCount++;
          break;
        case "NEGATIVE":
          trendMap[date].negative++;
          negCount++;
          break;
        case "NEUTRAL":
          trendMap[date].neutral++;
          neuCount++;
          break;
        default:
          
          trendMap[date].neutral++;
          neuCount++;
          console.warn(`Review ${r.id} has unexpected sentiment: "${s}" — counting as NEUTRAL`);
          break;
      }

      if (r.aiAnalysis?.confidence != null) {
        confSum += r.aiAnalysis.confidence;
        confCount++;
      }
    }

    const totalClassified = posCount + negCount + neuCount;
    const posPct = totalClassified > 0 ? (posCount / totalClassified) * 100 : 0;
    const negPct = totalClassified > 0 ? (negCount / totalClassified) * 100 : 0;
    const neuPct = totalClassified > 0 ? (neuCount / totalClassified) * 100 : 0;
    const avgConf = confCount > 0 ? confSum / confCount : 0;

    const trendData = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    
    let topCategories = [];
    const cache = await prisma.analyticsCache.findUnique({
      where: { workspaceId: workspace.id }
    });

    if (cache && cache.topCategories && Array.isArray(cache.topCategories) && cache.topCategories.length > 0) {
      topCategories = cache.topCategories;
    } else {
      const categories = await prisma.aiAnalysis.groupBy({
        by: ["category"],
        where: { review: { workspaceId: workspace.id } },
        _count: true,
        orderBy: { _count: { category: "desc" } },
      });
      topCategories = categories.map((c) => ({ category: c.category, count: c._count }));
    }

    
    const complaintStats = await prisma.complaint.groupBy({
      by: ["status"],
      where: { workspaceId: workspace.id },
      _count: true,
    });

    return NextResponse.json({
      totalReviews: reviews.length,
      positivePercent: posPct,
      negativePercent: negPct,
      neutralPercent: neuPct,
      avgConfidence: avgConf,
      topCategories,
      trendData,
      complaintStats: complaintStats.map((c) => ({ status: c.status, count: c._count })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({
      totalReviews: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0,
      avgConfidence: 0, topCategories: [], trendData: [], complaintStats: []
    });
  }
}
