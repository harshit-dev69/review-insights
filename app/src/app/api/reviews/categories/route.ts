import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";

export async function GET() {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ categories: [] });

    const { workspace } = result;

    const categories = await prisma.aiAnalysis.groupBy({
      by: ["category"],
      where: { review: { workspaceId: workspace.id } },
      _count: true,
      orderBy: { _count: { category: "desc" } },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({ category: c.category, count: c._count })),
    });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ categories: [] });
  }
}
