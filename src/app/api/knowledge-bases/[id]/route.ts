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

  const kb = await db.knowledgeBase.findFirst({
    where: { id, userId: session.user.id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      },
    },
  });

  if (!kb) {
    return NextResponse.json(
      { error: "Knowledge Base not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(kb);
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

  const kb = await db.knowledgeBase.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!kb) {
    return NextResponse.json(
      { error: "Knowledge Base not found" },
      { status: 404 }
    );
  }

  await db.knowledgeBase.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Knowledge Base deleted successfully" });
}
