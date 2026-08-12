import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { FileText, FolderKanban, CheckCircle2, Loader2, AlertCircle, Eye } from "lucide-react";

export default async function DocumentsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let documents: Array<{
    id: string;
    name: string;
    mimeType: string;
    fileSize: number;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
    knowledgeBase: { id: string; name: string };
    _count: { chunks: number };
  }> = [];

  if (userId) {
    documents = await db.document.findMany({
      where: { knowledgeBase: { userId } },
      orderBy: { createdAt: "desc" },
      include: {
        knowledgeBase: { select: { id: true, name: true } },
        _count: { select: { chunks: true } },
      },
    });
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-indigo-400" />
          All Documents
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          View all uploaded files across your knowledge bases
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        {documents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl p-6">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-200">No Documents Uploaded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Go to your Knowledge Bases to upload PDF, DOCX, TXT, or Markdown documents.
            </p>
            <Link
              href="/knowledge-bases"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Go to Knowledge Bases</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/50 mt-0.5">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-semibold text-slate-100 hover:text-indigo-300 transition-colors text-sm flex items-center gap-1.5"
                    >
                      <span>{doc.name}</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <Link
                        href={`/knowledge-bases/${doc.knowledgeBase.id}`}
                        className="text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <FolderKanban className="w-3 h-3" />
                        {doc.knowledgeBase.name}
                      </Link>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{doc._count.chunks} Chunks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                      doc.status === "INDEXED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : doc.status === "PROCESSING"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : doc.status === "FAILED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {doc.status === "INDEXED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {doc.status === "PROCESSING" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {doc.status === "FAILED" && <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{doc.status}</span>
                  </span>

                  <Link
                    href={`/documents/${doc.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
