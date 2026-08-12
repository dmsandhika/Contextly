import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  FolderKanban,
  FileText,
  CheckCircle2,
  HelpCircle,
  Plus,
  ArrowRight,
  MessageSquare,
  Search,
  Sparkles,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let knowledgeBaseCount = 0;
  let documentCount = 0;
  let indexedCount = 0;
  let queryCount = 0;
  let recentDocuments: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    knowledgeBase: { name: string };
  }> = [];

  if (userId) {
    const kbCountRes = await db.knowledgeBase.count({
      where: { userId },
    });
    knowledgeBaseCount = kbCountRes;

    const docCountRes = await db.document.count({
      where: { knowledgeBase: { userId } },
    });
    documentCount = docCountRes;

    const indexedCountRes = await db.document.count({
      where: { knowledgeBase: { userId }, status: "INDEXED" },
    });
    indexedCount = indexedCountRes;

    const queryCountRes = await db.searchLog.count({
      where: { userId },
    });
    queryCount = queryCountRes;

    recentDocuments = await db.document.findMany({
      where: { knowledgeBase: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        knowledgeBase: {
          select: { name: true },
        },
      },
    });
  }

  const statCards = [
    {
      title: "Knowledge Bases",
      value: knowledgeBaseCount,
      icon: FolderKanban,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Total Documents",
      value: documentCount,
      icon: FileText,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Indexed Chunks",
      value: indexedCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Total Queries",
      value: queryCount,
      icon: HelpCircle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="glass-card rounded-2xl p-8 relative overflow-hidden border border-indigo-500/20">
        <div className="glow-purple -top-10 -right-10 opacity-50"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Knowledge Base Ready</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {session?.user?.name || "User"} 👋
          </h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Manage your knowledge bases, upload PDF & text documents, and query your indexed knowledge with AI semantic search.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              href="/knowledge-bases"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Knowledge Base</span>
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2.5 glass-panel hover:bg-slate-800 text-slate-200 font-medium text-sm rounded-xl transition-all border border-slate-700 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Start AI Chat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 border border-slate-800/80 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-2xl border ${stat.bgColor} ${stat.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Quick Actions & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Documents */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
              <p className="text-xs text-slate-400">Latest uploaded documents in your workspace</p>
            </div>
            <Link
              href="/documents"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl p-6">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No documents uploaded yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a knowledge base and upload your PDF, TXT, or Markdown documents to start indexing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{doc.name}</p>
                      <p className="text-xs text-slate-400">
                        {doc.knowledgeBase.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        doc.status === "INDEXED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : doc.status === "PROCESSING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {doc.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/search"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-sm group"
              >
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">Semantic Search</p>
                  <p className="text-xs text-slate-400">Find documents by meaning & context</p>
                </div>
              </Link>

              <Link
                href="/chat"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-sm group"
              >
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">RAG AI Assistant</p>
                  <p className="text-xs text-slate-400">Ask questions with source citations</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
