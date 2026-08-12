"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Database } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Postgres + pgvector</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">
                {session.user.name || "User"}
              </span>
              <span className="text-xs text-slate-400">{session.user.email}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-sm">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
