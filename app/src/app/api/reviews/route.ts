import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ reviews: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });

    const { workspace } = result;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const sentiment = url.searchParams.get("sentiment");
    const search = url.searchParams.get("search");
    const category = url.searchParams.get("category");
    const date = url.searchParams.get("date");

    const where: Record<string, any> = { workspaceId: workspace.id };

    if (sentiment) {
      where.aiAnalysis = { ...(where.aiAnalysis || {}), sentiment: sentiment.toUpperCase() };
    }
    if (category) {
      where.aiAnalysis = { ...(where.aiAnalysis || {}), category: category };
    }
    if (search) {
      where.reviewText = { contains: search, mode: "insensitive" };
    }
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      where.reviewDate = { gte: startOfDay, lt: endOfDay };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { aiAnalysis: true, complaint: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Reviews error:", error);
    return NextResponse.json({ reviews: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspace } = result;
    const url = new URL(req.url);
    const reviewId = url.searchParams.get("id");
    const clearAll = url.searchParams.get("all") === "true";

    if (clearAll) {
      
      await prisma.complaint.deleteMany({ where: { workspaceId: workspace.id } });
      
      const deleted = await prisma.review.deleteMany({ where: { workspaceId: workspace.id } });
      
      await prisma.analyticsCache.deleteMany({ where: { workspaceId: workspace.id } });
      return NextResponse.json({ success: true, deleted: deleted.count });
    }

    if (reviewId) {
      
      await prisma.complaint.deleteMany({ where: { reviewId } });
      
      await prisma.review.delete({ where: { id: reviewId, workspaceId: workspace.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide ?id=<reviewId> or ?all=true" }, { status: 400 });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
