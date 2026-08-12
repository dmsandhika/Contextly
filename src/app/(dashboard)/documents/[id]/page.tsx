import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  FolderKanban,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileCode,
  HardDrive,
} from "lucide-react";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await params;

  if (!userId) {
    notFound();
  }

  const doc = await db.document.findFirst({
    where: {
      id,
      knowledgeBase: { userId },
    },
    include: {
      knowledgeBase: true,
      chunks: {
        orderBy: { chunkIndex: "asc" },
      },
    },
  });

  if (!doc) {
    notFound();
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div>
        <Link
          href={`/knowledge-bases/${doc.knowledgeBase.id}`}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {doc.knowledgeBase.name}</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{doc.name}</h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Knowledge Base:</span>
                <span className="text-indigo-400 font-medium">{doc.knowledgeBase.name}</span>
              </p>
            </div>
          </div>

          <span
            className={`self-start md:self-center text-xs px-3.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${
              doc.status === "INDEXED"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : doc.status === "PROCESSING"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : doc.status === "FAILED"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {doc.status === "INDEXED" && <CheckCircle2 className="w-4 h-4" />}
            {doc.status === "FAILED" && <AlertCircle className="w-4 h-4" />}
            <span>Status: {doc.status}</span>
          </span>
        </div>
      </div>

      {doc.errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-200">Processing Error</h4>
            <p className="text-xs text-rose-300/90 mt-1">{doc.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Metadata Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            File Size
          </p>
          <p className="text-lg font-bold text-white mt-1">{formatFileSize(doc.fileSize)}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Total Chunks
          </p>
          <p className="text-lg font-bold text-white mt-1">{doc.chunks.length}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            File Type
          </p>
          <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{doc.mimeType}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
            Pages / Pages Count
          </p>
          <p className="text-lg font-bold text-white mt-1">{doc.pageCount || 1}</p>
        </div>
      </div>

      {/* Chunks List */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Extracted Text Chunks</h2>
            <p className="text-xs text-slate-400">
              Text fragments with 768-dimensional vector embeddings stored in pgvector
            </p>
          </div>
        </div>

        {doc.chunks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl p-6">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No Chunks Extracted Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Document is being processed or failed text extraction.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {doc.chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Chunk #{chunk.chunkIndex + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {chunk.content.length} characters • Vector 768-dim
                  </span>
                </div>

                <p className="text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/50">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
