"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  FolderKanban,
  FileText,
  Copy,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KnowledgeBaseItem {
  id: string;
  name: string;
}

interface SourceCitation {
  documentName: string;
  chunkIndex: number;
  preview: string;
  similarity: number;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: SourceCitation[] | null;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  title: string;
  knowledgeBase: { id: string; name: string };
  createdAt: string;
}

export function ChatInterface({
  conversationId,
}: {
  conversationId?: string;
}) {
  const router = useRouter();

  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchKnowledgeBases();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchConversationMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const fetchKnowledgeBases = async () => {
    try {
      const res = await fetch("/api/knowledge-bases");
      if (res.ok) {
        const data: KnowledgeBaseItem[] = await res.json();
        setKnowledgeBases(data);
        if (data.length > 0 && !selectedKbId) {
          setSelectedKbId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch KBs:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const fetchConversationMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.knowledgeBaseId) {
          setSelectedKbId(data.knowledgeBaseId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedKbId || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Optimistic User Message
    const tempUserMsg: MessageItem = {
      id: `temp_user_${Date.now()}`,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          knowledgeBaseId: selectedKbId,
          message: userText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!conversationId && data.conversationId) {
          router.push(`/chat/${data.conversationId}`);
        } else {
          setMessages((prev) => [...prev, data.assistantMessage]);
          fetchConversations();
        }
      }
    } catch (err) {
      console.error("Chat send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation history?")) return;

    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          router.push("/chat");
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-2xl glass-card border border-slate-800 overflow-hidden">
      {/* Left Conversations Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-4 border-b border-slate-800">
            <Link href="/chat">
              <Button className="w-full justify-start gap-2 shadow-lg shadow-indigo-600/25">
                <Plus className="w-4 h-4" />
                <span>New AI Chat</span>
              </Button>
            </Link>
          </div>

          <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            History
          </div>

          <div className="px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No previous chats</p>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className="group relative flex items-center">
                  <Link
                    href={`/chat/${conv.id}`}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      conversationId === conv.id
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </Link>

                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    title="Delete Chat"
                    className="absolute right-2 p-1 rounded text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
        {/* Chat Header Bar */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Contextly RAG Assistant</h2>
              <p className="text-[11px] text-slate-400">Grounded AI with Source Citations</p>
            </div>
          </div>

          {/* KB Selection Dropdown */}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <select
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
              className="glass-input h-9 rounded-xl pl-3 pr-8 text-xs text-slate-200 bg-slate-900/90 border border-slate-700 cursor-pointer"
            >
              {knowledgeBases.length === 0 ? (
                <option value="">No KB available</option>
              ) : (
                knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id} className="bg-slate-900 text-slate-100">
                    KB: {kb.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-12">
              <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Sparkles className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ask Anything About Your Knowledge Base</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Select a Knowledge Base above, type your question below, and AI will answer strictly based on indexed document chunks with verified citations.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-lg text-sm space-y-3 ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "glass-card border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <div className="leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Source Citations Section */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Sources ({msg.citations.length})</span>
                          {expandedSources[msg.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="space-y-2 pt-1">
                            {msg.citations.map((src, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between font-medium text-slate-300">
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                                    [{idx + 1}] {src.documentName} (Chunk #{src.chunkIndex + 1})
                                  </span>
                                  <span className="text-emerald-400 font-semibold">
                                    {src.similarity}% Match
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                                  &quot;{src.preview}&quot;
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Copy Action */}
                    {!isUser && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span className="animate-pulse">Retrieving relevant chunks & generating answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <Input
              type="text"
              required
              disabled={isSending || !selectedKbId}
              placeholder="Ask a question based on your Knowledge Base..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 h-11 text-sm"
            />
            <Button
              type="submit"
              disabled={isSending || !inputMessage.trim() || !selectedKbId}
              className="h-11 px-5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
