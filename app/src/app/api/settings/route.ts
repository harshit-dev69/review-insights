import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyWorkspace } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspace } = result;
    const body = await req.json();
    const { llmApiKey, llmProvider, hfApiKey, sentimentProvider } = body;

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        llmApiKey: llmApiKey !== undefined ? llmApiKey : workspace.llmApiKey,
        llmProvider: llmProvider !== undefined ? llmProvider : workspace.llmProvider,
        hfApiKey: hfApiKey !== undefined ? hfApiKey : workspace.hfApiKey,
        sentimentProvider: sentimentProvider !== undefined ? sentimentProvider : workspace.sentimentProvider,
      },
    });

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getAnyWorkspace();
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    return NextResponse.json({
      llmApiKey: result.workspace.llmApiKey || "",
      llmProvider: result.workspace.llmProvider || "openai",
      hfApiKey: result.workspace.hfApiKey || "",
      sentimentProvider: result.workspace.sentimentProvider || "huggingface",
    });
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
