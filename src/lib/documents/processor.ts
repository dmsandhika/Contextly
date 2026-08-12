import { db } from "@/lib/db";
import { extractTextFromFile } from "./extractor";
import { splitTextIntoChunks } from "./chunker";
import { generateEmbedding } from "@/lib/ai/embedding";
import { saveDocumentChunk } from "./vector-store";

export async function processDocumentPipeline(documentId: string): Promise<void> {
  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Step 1: Update status to PROCESSING
    await db.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING", errorMessage: null },
    });

    // Step 2: Extract Text
    const extracted = await extractTextFromFile(
      document.storagePath,
      document.mimeType
    );

    if (!extracted.text || extracted.text.length === 0) {
      throw new Error("No readable text found in document.");
    }

    // Step 3: Split into Chunks
    const chunks = splitTextIntoChunks(extracted.text);

    if (chunks.length === 0) {
      throw new Error("Document text chunking produced 0 chunks.");
    }

    // Step 4: Delete old chunks if re-indexing
    await db.documentChunk.deleteMany({
      where: { documentId },
    });

    // Step 5: Generate Embeddings & Save to Vector DB
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      await saveDocumentChunk({
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding,
        metadata: {
          charCount: chunk.charCount,
          documentName: document.name,
        },
      });
    }

    // Step 6: Mark Document as INDEXED
    await db.document.update({
      where: { id: documentId },
      data: {
        status: "INDEXED",
        pageCount: extracted.pageCount || 1,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error during processing";
    console.error(`Document Processing Error [ID: ${documentId}]:`, errorMsg);

    await db.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
      },
    });
  }
}
