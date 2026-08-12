import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { performHybridSearch } from "@/lib/search/hybrid-search";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { conversationId, knowledgeBaseId, message } = await req.json();

    if (!knowledgeBaseId || !message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "knowledgeBaseId and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const truncatedTitle =
        message.trim().length > 30
          ? message.trim().substring(0, 30) + "..."
          : message.trim();

      const newConv = await db.conversation.create({
        data: {
          userId: session.user.id,
          knowledgeBaseId,
          title: truncatedTitle,
        },
      });
      activeConversationId = newConv.id;
    }

    // Save User Message
    await db.message.create({
      data: {
        conversationId: activeConversationId,
        role: "user",
        content: message.trim(),
      },
    });

    // 1. Perform Hybrid Vector Search
    const chunks = await performHybridSearch(knowledgeBaseId, message.trim(), 5);

    const sources = chunks.map((c) => ({
      documentName: c.documentName,
      chunkIndex: c.chunkIndex,
      preview:
        c.content.length > 150 ? c.content.substring(0, 150) + "..." : c.content,
      similarity: c.matchPercentage,
    }));

    const contextText = chunks
      .map(
        (c, idx) =>
          `[Dokumen ${idx + 1}: "${c.documentName}" (Chunk #${c.chunkIndex + 1})]\n${c.content}`
      )
      .join("\n\n---\n\n");

    const systemPrompt = `Anda adalah asisten AI cerdas untuk aplikasi Contextly.
Tugas Anda adalah menjawab pertanyaan pengguna HANYA berdasarkan konteks dokumen yang diberikan.
Aturan:
1. Jawablah secara jelas, akurat, dan terstruktur.
2. Dilarang mengarang informasi di luar konteks yang diberikan.
3. Sebutkan sumber dokumen rujukan dalam jawaban Anda jika relevan.
4. Gunakan bahasa Indonesia yang sopan dan profesional.

Konteks Dokumen:
${contextText}`;

    // Prepare ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullAnswer = "";

        // Send conversationId first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "meta", conversationId: activeConversationId })}\n\n`
          )
        );

        if (chunks.length === 0) {
          fullAnswer =
            "Maaf, tidak ditemukan informasi atau dokumen yang relevan di dalam Knowledge Base ini untuk menjawab pertanyaan Anda.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "token", text: fullAnswer })}\n\n`
            )
          );
        } else if (ai) {
          try {
            const streamResult = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: `${systemPrompt}\n\nPertanyaan Pengguna: ${message.trim()}` },
                  ],
                },
              ],
            });

            for await (const chunk of streamResult) {
              if (chunk.text) {
                fullAnswer += chunk.text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "token", text: chunk.text })}\n\n`
                  )
                );
              }
            }
          } catch (err) {
            console.warn("Gemini Stream Error, using fallback:", err);
            const topDoc = chunks[0];
            fullAnswer = `Berdasarkan dokumen **"${topDoc.documentName}"** (Kecocokan: ${topDoc.matchPercentage}%):\n\n${topDoc.content.substring(
              0,
              450
            )}...`;

            // Stream fallback word by word
            const words = fullAnswer.split(" ");
            for (const word of words) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "token", text: word + " " })}\n\n`
                )
              );
              await new Promise((r) => setTimeout(r, 20));
            }
          }
        } else {
          // Grounded fallback stream when GEMINI_API_KEY is not configured
          const topDoc = chunks[0];
          fullAnswer = `Berdasarkan pengetahuan yang tersedia di dokumen **"${topDoc.documentName}"** (Kecocokan: ${topDoc.matchPercentage}%):\n\n${topDoc.content.substring(
            0,
            450
          )}...\n\n*Catatan: Informasi ini diambil langsung dari potongan dokumen ter-index di Knowledge Base.*`;

          const words = fullAnswer.split(" ");
          for (const word of words) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", text: word + " " })}\n\n`
              )
            );
            await new Promise((r) => setTimeout(r, 20));
          }
        }

        // Save Assistant Message to database
        await db.message.create({
          data: {
            conversationId: activeConversationId,
            role: "assistant",
            content: fullAnswer,
            citations: JSON.parse(JSON.stringify(sources)),
          },
        });

        // Send sources and done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", citations: sources })}\n\n`
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat Stream API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
