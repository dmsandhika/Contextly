import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generate 768-dimensional text embedding vector using Google Gemini text-embedding-004.
 * Falls back to deterministic mock embedding if GEMINI_API_KEY is not set.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return new Array(768).fill(0);
  }

  if (ai) {
    try {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      // Handle response structure from @google/genai SDK
      const resObj = response as unknown as {
        embedding?: { values?: number[] };
        embeddings?: Array<{ values?: number[] }>;
      };

      const values = resObj.embedding?.values || resObj.embeddings?.[0]?.values;

      if (values && values.length === 768) {
        return values;
      }
    } catch (error) {
      console.warn("Gemini Embedding API call failed, using fallback vector:", error);
    }
  }

  // Deterministic 768-dim vector fallback based on text hash when API key is unconfigured
  return generateFallbackEmbedding(text);
}

function generateFallbackEmbedding(text: string): number[] {
  const vector: number[] = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < 768; i++) {
    const val = Math.sin(hash + i) * 0.5;
    vector[i] = Number(val.toFixed(6));
  }

  return vector;
}
