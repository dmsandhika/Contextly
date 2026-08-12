"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  FileText,
  Trash2,
  ArrowRight,
  Loader2,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    documents: number;
  };
}

export default function KnowledgeBasesPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbDesc, setNewKbDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/knowledge-bases");
      if (res.ok) {
        const data = await res.json();
        setKnowledgeBases(data);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge bases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKbName, description: newKbDesc }),
      });

      if (res.ok) {
        setNewKbName("");
        setNewKbDesc("");
        setIsModalOpen(false);
        fetchKnowledgeBases();
      }
    } catch (err) {
      console.error("Error creating Knowledge Base:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this Knowledge Base and all its documents?")) {
      return;
    }

    try {
      const res = await fetch(`/api/knowledge-bases/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete Knowledge Base:", err);
    }
  };

  const filteredKbs = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kb.description && kb.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-indigo-400" />
            Knowledge Bases
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize documents into topic-specific vector knowledge spaces
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Knowledge Base</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 z-10" />
        <Input
          type="text"
          placeholder="Search Knowledge Bases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
          <p className="text-sm">Loading knowledge bases...</p>
        </div>
      ) : filteredKbs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white">No Knowledge Bases Found</h3>
            <p className="text-sm text-slate-400 mt-1">
              Create your first Knowledge Base to start uploading and indexing documents.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            <Plus className="w-4 h-4" />
            <span>Create Knowledge Base</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKbs.map((kb) => (
            <Link
              key={kb.id}
              href={`/knowledge-bases/${kb.id}`}
              className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(kb.id, e)}
                    title="Delete Knowledge Base"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {kb.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {kb.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{kb._count.documents} Documents</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Dialog for New Knowledge Base */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Knowledge Base</h3>
                <p className="text-xs text-slate-400">Add a new collection space for documents</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Laravel SOPs or Company FAQ"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description
                </label>

                <textarea
                  rows={3}
                  placeholder="Short summary of documents stored in this knowledge base..."
                  value={newKbDesc}
                  onChange={(e) => setNewKbDesc(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Workspace</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
