import { auth } from "@/lib/auth";
import { Settings as SettingsIcon, Shield, Database, Sparkles, Key, User } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          Settings & Configuration
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage system preferences, AI provider abstraction, and account profile
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            User Account Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Full Name</span>
              <span className="font-medium text-white text-base mt-1 block">
                {session?.user?.name || "User"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Email Address</span>
              <span className="font-medium text-white text-base mt-1 block">
                {session?.user?.email || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Provider Config */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Model & Provider Abstraction
          </h2>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="font-medium text-slate-200">Google Gemini API Key (`GEMINI_API_KEY`)</span>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  hasGeminiKey
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {hasGeminiKey ? "Configured & Active" : "Fallback Engine Active"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Model aktif: <code className="text-indigo-300">text-embedding-004</code> (Embeddings) & <code className="text-indigo-300">gemini-2.5-flash</code> (RAG Answers).
              {hasGeminiKey
                ? " API Key terdeteksi dan aktif."
                : " API Key belum dikonfigurasi di .env. Fallback engine deterministik aktif untuk keperluan testing lokal."}
            </p>
          </div>
        </div>

        {/* Database & Security */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Database & Vector Search Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Database Engine</span>
              <span className="font-semibold text-white text-sm">PostgreSQL 17 (Homebrew)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Vector Search Extension</span>
              <span className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                pgvector (768-dim Enabled)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
