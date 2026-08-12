import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runRAGPipeline } from "@/lib/ai/rag-pipeline";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, knowledgeBaseId, message } = await req.json();

    if (!knowledgeBaseId || !message || !message.trim()) {
      return NextResponse.json(
        { error: "knowledgeBaseId and message are required" },
        { status: 400 }
      );
    }

    let activeConversationId = conversationId;

    // Create conversation if new
    if (!activeConversationId) {
      const truncatedTitle =
        message.trim().length > 30
          ? message.trim().substring(0, 30) + "..."
          : message.trim();

      const newConv = await db.conversation.create({
        data: {
          userId: session.user.id,
          knowledgeBaseId,
          title: truncatedTitle,
        },
      });
      activeConversationId = newConv.id;
    }

    // Save User message
    await db.message.create({
      data: {
        conversationId: activeConversationId,
        role: "user",
        content: message.trim(),
      },
    });

    // Run RAG Engine Pipeline
    const ragResult = await runRAGPipeline(
      session.user.id,
      knowledgeBaseId,
      message.trim()
    );

    // Save Assistant message with Citations JSON
    const assistantMsg = await db.message.create({
      data: {
        conversationId: activeConversationId,
        role: "assistant",
        content: ragResult.answer,
        citations: JSON.parse(JSON.stringify(ragResult.sources)),
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: activeConversationId,
      userMessage: message.trim(),
      assistantMessage: assistantMsg,
      sources: ragResult.sources,
      retrievedChunksCount: ragResult.retrievedChunksCount,
      responseTimeMs: ragResult.responseTimeMs,
    });
  } catch (error) {
    console.error("RAG Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
