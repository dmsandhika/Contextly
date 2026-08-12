import { performHybridSearch } from "../search/hybrid-search";
import { generateRAGAnswer, RAGAnswerResponse } from "./llm";
import { db } from "@/lib/db";

export interface RAGPipelineResult extends RAGAnswerResponse {
  retrievedChunksCount: number;
  topScore: number;
  responseTimeMs: number;
}

export async function runRAGPipeline(
  userId: string,
  knowledgeBaseId: string,
  question: string
): Promise<RAGPipelineResult> {
  const startTime = Date.now();

  // 1. Perform Hybrid Search to retrieve top relevant chunks
  const chunks = await performHybridSearch(knowledgeBaseId, question, 5);

  // 2. Generate Grounded AI Answer with Citations
  const ragResult = await generateRAGAnswer(question, chunks);

  const responseTimeMs = Date.now() - startTime;
  const topScore = chunks.length > 0 ? chunks[0].finalScore : 0;

  // 3. Save search log for analytics
  try {
    await db.searchLog.create({
      data: {
        userId,
        knowledgeBaseId,
        query: question,
        resultsCount: chunks.length,
        topScore,
        responseTimeMs,
      },
    });
  } catch (err) {
    console.warn("Failed to save search log:", err);
  }

  return {
    ...ragResult,
    retrievedChunksCount: chunks.length,
    topScore,
    responseTimeMs,
  };
}
