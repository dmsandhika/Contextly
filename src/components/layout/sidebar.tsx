"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Knowledge Bases", href: "/knowledge-bases", icon: FolderKanban },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Semantic Search", href: "/search", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">Contextly</h1>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              RAG Engine v1.0
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="p-4 m-4 rounded-xl glass-card border border-indigo-500/20 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>pgvector Active</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          PostgreSQL vector embedding search engine enabled.
        </p>
      </div>
    </aside>
  );
}
