import { db } from "@/lib/db";

export interface SaveChunkInput {
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export async function saveDocumentChunk(input: SaveChunkInput) {
  const embeddingString = `[${input.embedding.join(",")}]`;
  const metadataJson = JSON.stringify(input.metadata || {});

  // Raw SQL query to insert chunk with pgvector casting ($1::vector)
  await db.$executeRawUnsafe(
    `
    INSERT INTO "document_chunks" (
      "id",
      "document_id",
      "chunk_index",
      "content",
      "embedding",
      "metadata",
      "created_at",
      "updated_at"
    ) VALUES (
      $1, $2, $3, $4, $5::vector, $6::jsonb, NOW(), NOW()
    )
  `,
    `chunk_${Date.now()}_${input.chunkIndex}`,
    input.documentId,
    input.chunkIndex,
    input.content,
    embeddingString,
    metadataJson
  );
}

export interface SimilaritySearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  documentName?: string;
}

export async function searchSimilarChunks(
  knowledgeBaseId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<SimilaritySearchResult[]> {
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  // Cosine Similarity using pgvector <=> operator (1 - cosine_distance)
  const results = await db.$queryRawUnsafe<
    Array<{
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      similarity: number;
      metadata: Record<string, unknown>;
      document_name: string;
    }>
  >(
    `
    SELECT 
      c.id,
      c.document_id,
      c.chunk_index,
      c.content,
      (1 - (c.embedding <=> $1::vector)) as similarity,
      c.metadata,
      d.name as document_name
    FROM "document_chunks" c
    JOIN "documents" d ON c.document_id = d.id
    WHERE d.knowledge_base_id = $2
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $1::vector ASC
    LIMIT $3
  `,
    embeddingString,
    knowledgeBaseId,
    topK
  );

  return results.map((r) => ({
    id: r.id,
    documentId: r.document_id,
    chunkIndex: r.chunk_index,
    content: r.content,
    similarity: Number(r.similarity.toFixed(4)),
    metadata: r.metadata || {},
    documentName: r.document_name,
  }));
}
