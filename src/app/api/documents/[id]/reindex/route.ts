import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocumentPipeline } from "@/lib/documents/processor";

export async function POST(
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

  // Trigger re-indexing pipeline non-blocking
  processDocumentPipeline(id).catch((err) => {
    console.error("Re-indexing error:", err);
  });

  return NextResponse.json({
    message: "Re-indexing started successfully.",
    documentId: id,
  });
}
