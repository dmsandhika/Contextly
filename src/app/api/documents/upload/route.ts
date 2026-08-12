import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocumentPipeline } from "@/lib/documents/processor";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string | null;

    if (!file || !knowledgeBaseId) {
      return NextResponse.json(
        { error: "File and knowledgeBaseId are required" },
        { status: 400 }
      );
    }

    // Verify KB ownership
    const kb = await db.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, userId: session.user.id },
    });

    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    // Validate size (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 15MB" },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const timeStamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timeStamp}_${sanitizedFileName}`;
    const storagePath = path.join(UPLOAD_DIR, filename);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(storagePath, buffer);

    // Create Document record
    const document = await db.document.create({
      data: {
        knowledgeBaseId,
        name: file.name,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        storagePath,
        status: "UPLOADED",
      },
    });

    // Trigger async processing pipeline (non-blocking)
    processDocumentPipeline(document.id).catch((err) => {
      console.error("Async document processing trigger failed:", err);
    });

    return NextResponse.json(
      {
        message: "File uploaded successfully. Processing started.",
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
