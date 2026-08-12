"use client";

import { useState } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ReindexButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isReindexing, setIsReindexing] = useState(false);
  const [done, setDone] = useState(false);

  const handleReindex = async () => {
    setIsReindexing(true);
    setDone(false);

    try {
      const res = await fetch(`/api/documents/${documentId}/reindex`, {
        method: "POST",
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => {
          setDone(false);
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to re-index document:", err);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleReindex}
      disabled={isReindexing}
      className="flex items-center gap-2"
    >
      {isReindexing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Re-indexing...</span>
        </>
      ) : done ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400">Pipeline Started</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Re-index Document</span>
        </>
      )}
    </Button>
  );
}
