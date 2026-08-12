import { GoogleGenAI } from "@google/genai";
import { HybridSearchResult } from "../search/hybrid-search";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface RAGAnswerResponse {
  answer: string;
  sources: Array<{
    documentName: string;
    chunkIndex: number;
    preview: string;
    similarity: number;
  }>;
}

export async function generateRAGAnswer(
  question: string,
  contextChunks: HybridSearchResult[]
): Promise<RAGAnswerResponse> {
  const sources = contextChunks.map((chunk) => ({
    documentName: chunk.documentName,
    chunkIndex: chunk.chunkIndex,
    preview:
      chunk.content.length > 150
        ? chunk.content.substring(0, 150) + "..."
        : chunk.content,
    similarity: chunk.matchPercentage,
  }));

  if (contextChunks.length === 0) {
    return {
      answer:
        "Maaf, tidak ditemukan informasi atau dokumen yang relevan di dalam Knowledge Base ini untuk menjawab pertanyaan Anda.",
      sources: [],
    };
  }

  // Format context text for LLM
  const contextText = contextChunks
    .map(
      (c, idx) =>
        `[Dokumen ${idx + 1}: "${c.documentName}" (Chunk #${c.chunkIndex + 1})]\n${c.content}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `Anda adalah asisten AI cerdas untuk aplikasi Contextly.
Tugas Anda adalah menjawab pertanyaan pengguna HANYA berdasarkan konteks dokumen yang diberikan di bawah ini.

Aturan Ketat:
1. Jawablah secara jelas, akurat, dan terstruktur (gunakan bullet point atau format markdown jika sesuai).
2. Dilarang mengarang informasi di luar konteks yang diberikan.
3. Sebutkan sumber dokumen rujukan dalam jawaban Anda jika relevan (misal: "Berdasarkan dokumen [Nama Dokumen]...").
4. Gunakan bahasa Indonesia yang sopan dan profesional.

Konteks Dokumen:
${contextText}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nPertanyaan Pengguna: ${question}` }] },
        ],
      });

      if (response.text) {
        return {
          answer: response.text,
          sources,
        };
      }
    } catch (error) {
      console.warn("Gemini LLM API call failed, falling back to grounded RAG generator:", error);
    }
  }

  // Grounded Synthesizer Fallback when GEMINI_API_KEY is unconfigured or call fails
  const topDoc = contextChunks[0];
  const fallbackAnswer = `Berdasarkan pengetahuan yang tersedia di dokumen **"${topDoc.documentName}"** (Kecocokan: ${topDoc.matchPercentage}%):\n\n${topDoc.content.substring(
    0,
    450
  )}...\n\n*Catatan: Informasi ini diambil langsung dari potongan dokumen ter-index di Knowledge Base.*`;

  return {
    answer: fallbackAnswer,
    sources,
  };
}
