import { NextRequest, NextResponse } from "next/server";
import { getAnyWorkspace } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, actionNote } = body;

    const complaint = await prisma.complaint.findFirst({
      where: { reviewId: id },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: status || complaint.status,
        actionNote: actionNote !== undefined ? actionNote : complaint.actionNote,
        resolvedAt: status === "RESOLVED" ? new Date() : complaint.resolvedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Resolve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
