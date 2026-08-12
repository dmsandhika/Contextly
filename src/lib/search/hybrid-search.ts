import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embedding";

export interface HybridSearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  vectorSimilarity: number;
  keywordScore: number;
  finalScore: number;
  matchPercentage: number;
  documentName: string;
  metadata: Record<string, unknown>;
}

export async function performHybridSearch(
  knowledgeBaseId: string,
  query: string,
  topK: number = 5
): Promise<HybridSearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const trimmedQuery = query.trim();

  // Step 1: Generate Embedding for the query
  const queryEmbedding = await generateEmbedding(trimmedQuery);
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  // Step 2: Query pgvector for Vector Similarity & Keyword Match Score using raw SQL
  const rawResults = await db.$queryRawUnsafe<
    Array<{
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      vector_similarity: number;
      keyword_score: number;
      document_name: string;
      metadata: Record<string, unknown>;
    }>
  >(
    `
    SELECT 
      c.id,
      c.document_id,
      c.chunk_index,
      c.content,
      (1 - (c.embedding <=> $1::vector)) as vector_similarity,
      CASE 
        WHEN LOWER(c.content) LIKE LOWER($2) THEN 1.0
        WHEN LOWER(c.content) LIKE LOWER($3) THEN 0.6
        ELSE 0.1
      END as keyword_score,
      d.name as document_name,
      c.metadata
    FROM "document_chunks" c
    JOIN "documents" d ON c.document_id = d.id
    WHERE d.knowledge_base_id = $4
      AND c.embedding IS NOT NULL
    ORDER BY ( (1 - (c.embedding <=> $1::vector)) * 0.7 + 
      (CASE 
        WHEN LOWER(c.content) LIKE LOWER($2) THEN 1.0
        WHEN LOWER(c.content) LIKE LOWER($3) THEN 0.6
        ELSE 0.1
       END) * 0.3 ) DESC
    LIMIT $5
  `,
    embeddingString,
    `%${trimmedQuery}%`,
    `%${trimmedQuery.split(" ")[0]}%`,
    knowledgeBaseId,
    topK
  );

  return rawResults.map((r) => {
    const vectorSim = Math.max(0, Math.min(1, Number(r.vector_similarity)));
    const keyScore = Number(r.keyword_score);
    // Weighted final relevance score (70% Vector + 30% Keyword)
    const finalScore = Number((vectorSim * 0.7 + keyScore * 0.3).toFixed(4));
    const matchPercentage = Math.round(finalScore * 100);

    return {
      id: r.id,
      documentId: r.document_id,
      chunkIndex: r.chunk_index,
      content: r.content,
      vectorSimilarity: Number(vectorSim.toFixed(4)),
      keywordScore: keyScore,
      finalScore,
      matchPercentage,
      documentName: r.document_name,
      metadata: r.metadata || {},
    };
  });
}
