"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  FolderKanban,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KnowledgeBaseItem {
  id: string;
  name: string;
}

interface SearchResultItem {
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

export default function SearchPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const res = await fetch("/api/knowledge-bases");
      if (res.ok) {
        const data: KnowledgeBaseItem[] = await res.json();
        setKnowledgeBases(data);
        if (data.length > 0) {
          setSelectedKbId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch knowledge bases:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedKbId) return;

    setIsLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledgeBaseId: selectedKbId,
          query: query.trim(),
          topK: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setResponseTime(data.responseTimeMs || 0);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hybrid Vector Search Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Semantic Search</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search your indexed documents by meaning, context, and exact keywords
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* KB Selector Dropdown */}
            <div className="relative shrink-0 md:w-64">
              <FolderKanban className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400 pointer-events-none z-10" />
              <select
                value={selectedKbId}
                onChange={(e) => setSelectedKbId(e.target.value)}
                className="w-full h-10 glass-input rounded-xl pl-10 pr-8 text-sm text-slate-100 appearance-none bg-slate-900/80 cursor-pointer"
              >
                {knowledgeBases.length === 0 ? (
                  <option value="">No Knowledge Bases</option>
                ) : (
                  knowledgeBases.map((kb) => (
                    <option key={kb.id} value={kb.id} className="bg-slate-900 text-slate-100">
                      {kb.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Query Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 z-10" />
              <Input
                type="text"
                required
                placeholder='e.g. "Bagaimana cara authentication API?"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Search Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !selectedKbId || !query.trim()}
              className="h-10 px-6 shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Results Header / Stats */}
      {searched && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found {results.length} relevant results</span>
          {responseTime !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Search executed in {responseTime}ms
            </span>
          )}
        </div>
      )}

      {/* Results List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-sm">Running pgvector hybrid cosine search...</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Matching Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query keywords or uploading more documents to this Knowledge Base.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-6 border border-slate-800/90 hover:border-indigo-500/40 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <Link
                      href={`/documents/${item.documentId}`}
                      className="font-bold text-white hover:text-indigo-300 transition-colors text-sm flex items-center gap-1.5"
                    >
                      <span>{item.documentName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Chunk #{item.chunkIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Relevance Score Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                      item.matchPercentage >= 80
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : item.matchPercentage >= 50
                        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {item.matchPercentage}% Relevance Match
                  </span>
                </div>
              </div>

              {/* Text Preview */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
