import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { performHybridSearch } from "@/lib/search/hybrid-search";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { knowledgeBaseId, query, topK = 5 } = await req.json();

    if (!knowledgeBaseId || !query) {
      return NextResponse.json(
        { error: "knowledgeBaseId and query are required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = await performHybridSearch(knowledgeBaseId, query, topK);
    const responseTimeMs = Date.now() - startTime;

    // Log search analytics
    try {
      await db.searchLog.create({
        data: {
          userId: session.user.id,
          knowledgeBaseId,
          query,
          resultsCount: results.length,
          topScore: results.length > 0 ? results[0].finalScore : 0,
          responseTimeMs,
        },
      });
    } catch (logErr) {
      console.warn("Could not save search log:", logErr);
    }

    return NextResponse.json({
      query,
      resultsCount: results.length,
      responseTimeMs,
      results,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Failed to execute search query" },
      { status: 500 }
    );
  }
}
