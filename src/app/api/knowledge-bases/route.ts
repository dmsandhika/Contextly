import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledgeBases = await db.knowledgeBase.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  });

  return NextResponse.json(knowledgeBases);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Knowledge base name is required" },
        { status: 400 }
      );
    }

    const newKb = await db.knowledgeBase.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(newKb, { status: 201 });
  } catch (error) {
    console.error("Create Knowledge Base Error:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    );
  }
}
