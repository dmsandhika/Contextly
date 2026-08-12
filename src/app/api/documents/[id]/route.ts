import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs/promises";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await db.document.findFirst({
    where: {
      id,
      knowledgeBase: { userId: session.user.id },
    },
    include: {
      knowledgeBase: true,
      chunks: {
        orderBy: { chunkIndex: "asc" },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(doc);
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

  const doc = await db.document.findFirst({
    where: {
      id,
      knowledgeBase: { userId: session.user.id },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Attempt to delete physical file
  try {
    await fs.unlink(doc.storagePath);
  } catch (err) {
    console.warn("Could not delete physical file:", doc.storagePath, err);
  }

  // Delete document (cascade deletes chunks)
  await db.document.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Document deleted successfully" });
}
