import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listMessages, sendMessage } from "@/lib/messages.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Props {
  jobId: string;
  providerId: string;
  currentUserId: string;
  otherName: string;
}

export function MessageThread({ jobId, providerId, currentUserId, otherName }: Props) {
  const qc = useQueryClient();
  const key = ["messages", jobId, providerId];
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listMessages({ data: { job_id: jobId, provider_id: providerId } }),
  });

  const send = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send"),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${jobId}:${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const row = payload.new as { provider_id: string };
          if (row.provider_id === providerId) {
            qc.invalidateQueries({ queryKey: key });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, providerId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    send.mutate({ data: { job_id: jobId, provider_id: providerId, body: trimmed } });
  }

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAF8]">
        <p className="text-sm font-medium text-[#2e4053]">Chat with {otherName}</p>
        <p className="text-xs text-[#6b7b8c]">
          Do not share phone numbers or off-platform payment details.
        </p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-[#6b7b8c]">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#6b7b8c]">
            No messages yet. Say hello to get started.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-[#2e4053] text-white rounded-br-sm"
                      : "bg-[#F1F2F4] text-[#2e4053] rounded-bl-sm"
                  }`}
                >
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-[#6b7b8c]"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[#E5E7EB] p-3 flex gap-2 items-end">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          className="rounded-full"
          disabled={send.isPending || !body.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}