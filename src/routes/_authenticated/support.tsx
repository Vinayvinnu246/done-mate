import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupportTicket, getMyTickets } from "@/lib/support.functions";
import { getMyDisputes } from "@/lib/disputes.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LifeBuoy, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support · DoneMate" },
      { name: "description", content: "Contact DoneMate support, open tickets, and track disputes." },
    ],
  }),
});

const CATEGORIES = [
  { v: "general", l: "General" },
  { v: "payment", l: "Payment" },
  { v: "account", l: "Account" },
  { v: "dispute", l: "Dispute" },
  { v: "bug", l: "Bug" },
  { v: "other", l: "Other" },
] as const;

function SupportPage() {
  const { profile } = useAuth();
  const isProvider = profile?.type === "provider";
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ["my-tickets"], queryFn: () => getMyTickets() });
  const disputes = useQuery({ queryKey: ["my-disputes"], queryFn: () => getMyDisputes() });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["v"]>("general");

  const submit = useMutation({
    mutationFn: () => createSupportTicket({ data: { subject, message, category } }),
    onSuccess: () => {
      toast.success("Ticket submitted — we'll be in touch.");
      setSubject(""); setMessage(""); setCategory("general");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (tickets.isLoading || disputes.isLoading) return <LoadingScreen />;

  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Support</h1>
        <p className="text-[#6b7b8c] mt-1">Get help, browse FAQs and track your disputes.</p>
      </header>

      <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <LifeBuoy className="h-5 w-5 text-[#59914c]" />
          <h2 className="font-semibold text-[#2e4053]">Contact support</h2>
        </div>
        <div className="grid gap-4">
          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCategory(c.v)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    category === c.v ? "bg-[#2e4053] text-white border-[#2e4053]" : "bg-white text-[#4a5563] border-[#E5E7EB] hover:border-[#2e4053]"
                  }`}
                >
                  {c.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Tell us what happened…" />
          </div>
          <div className="flex justify-end">
            <Button
              className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]"
              disabled={submit.isPending || subject.trim().length < 3 || message.trim().length < 10}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Sending…" : "Submit ticket"}
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="font-semibold text-[#2e4053] mb-3">Your tickets ({tickets.data?.length ?? 0})</h2>
        <div className="space-y-3">
          {(tickets.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6b7b8c]">
              You haven't opened any tickets.
            </div>
          ) : (
            tickets.data!.map((t: any) => (
              <div key={t.id} className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[#2e4053]">{t.subject}</div>
                    <div className="text-xs text-[#6b7b8c] mt-0.5 uppercase">{t.category}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#2e4053] shrink-0">{t.status}</span>
                </div>
                <p className="text-sm text-[#4a5563] mt-2 whitespace-pre-wrap">{t.message}</p>
                {t.admin_reply && (
                  <div className="mt-3 rounded-lg bg-[#F7F9F5] border border-[#E5E7EB] p-3 text-sm text-[#2e4053]">
                    <div className="text-xs font-semibold mb-1">DoneMate support</div>
                    {t.admin_reply}
                  </div>
                )}
                <p className="text-xs text-[#6b7b8c] mt-2">{new Date(t.created_at).toLocaleString("en-GB")}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-[#2e4053] mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#F5B301]" />
          Disputes ({disputes.data?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(disputes.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#6b7b8c]">
              No active disputes. You can open a dispute from a booking's detail page.
            </div>
          ) : (
            disputes.data!.map((d: any) => (
              <div key={d.id} className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#2e4053]">{d.job?.title ?? "Job"}</div>
                    <div className="text-xs text-[#6b7b8c] mt-0.5">Reason: {d.reason}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] shrink-0">{d.status}</span>
                </div>
                {d.description && <p className="text-sm text-[#4a5563] mt-2 whitespace-pre-wrap">{d.description}</p>}
                {d.resolution && (
                  <div className="mt-3 rounded-lg bg-[#F7F9F5] border border-[#E5E7EB] p-3 text-sm text-[#2e4053]">
                    <div className="text-xs font-semibold mb-1">Resolution</div>
                    {d.resolution}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  return isProvider ? <ProviderShell>{content}</ProviderShell> : <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">{content}</div>;
}