import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await db.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      knowledgeBase: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(conversation);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await db.conversation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  await db.conversation.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Conversation deleted successfully" });
}
