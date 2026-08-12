import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await db.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      knowledgeBase: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { knowledgeBaseId, title } = await req.json();

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "knowledgeBaseId is required" },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        knowledgeBaseId,
        title: title?.trim() || "New Chat",
      },
      include: {
        knowledgeBase: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
