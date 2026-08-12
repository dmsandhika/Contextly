"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  FolderKanban,
  UploadCloud,
  FileText,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  fileSize: number;
  status: "UPLOADED" | "PROCESSING" | "INDEXED" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

interface KnowledgeBaseDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  documents: DocumentItem[];
}

export default function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [kb, setKb] = useState<KnowledgeBaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/knowledge-bases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setKb(data);
      }
    } catch (err) {
      console.error("Error fetching KB detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Auto-refresh when documents are processing
  useEffect(() => {
    if (!kb) return;
    const hasProcessing = kb.documents.some(
      (doc) => doc.status === "PROCESSING" || doc.status === "UPLOADED"
    );
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDetail();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [kb, fetchDetail]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledgeBaseId", id);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Failed to upload document.");
      } else {
        fetchDetail();
      }
    } catch {
      setUploadError("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        fetchDetail();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
        <p className="text-sm">Loading knowledge base...</p>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-white">Knowledge Base Not Found</h2>
        <Link href="/knowledge-bases" className="text-indigo-400 text-sm hover:underline mt-2 inline-block">
          Return to Knowledge Bases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div>
        <Link
          href="/knowledge-bases"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Knowledge Bases</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{kb.name}</h1>
            </div>
            {kb.description && (
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                {kb.description}
              </p>
            )}
          </div>

          <Button variant="outline" onClick={fetchDetail} className="self-start flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-semibold text-white mb-3">Upload Document</h2>

        {uploadError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            {isUploading ? (
              <div className="py-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">Processing file upload...</p>
                <p className="text-xs text-slate-400 mt-1">Extracting text & generating vector embeddings</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  <span className="text-indigo-400 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported files: PDF, DOCX, TXT, Markdown (Max 15MB)
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-semibold text-white">Indexed Documents ({kb.documents.length})</h2>
        </div>

        {kb.documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800/80 rounded-xl p-6">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-medium">No documents in this Knowledge Base</p>
            <p className="text-xs text-slate-500 mt-1">Upload a document above to begin chunking & vector indexing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {kb.documents.map((doc) => (
              <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/50 mt-0.5">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-semibold text-slate-200 hover:text-indigo-300 transition-colors text-sm flex items-center gap-1.5"
                    >
                      <span>{doc.name}</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{doc._count.chunks} Chunks</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {doc.errorMessage && (
                      <p className="text-xs text-rose-400 mt-1">Error: {doc.errorMessage}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
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

                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    title="Delete Document"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
