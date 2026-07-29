import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyProviderProfile } from "@/lib/onboarding.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/verification")({
  component: VerificationPage,
  head: () => ({
    meta: [
      { title: "Verification · DoneToday" },
      { name: "description", content: "Track your DoneToday provider verification status." },
    ],
  }),
});

const LABELS: Record<string, string> = {
  id: "Proof of identity",
  selfie: "Selfie",
  address_proof: "Proof of address",
  insurance: "Public liability insurance",
  dbs: "DBS certificate",
  trade_licence: "Trade qualifications",
  company_docs: "Company documents",
};

function VerificationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => getMyProviderProfile(),
  });

  if (isLoading) return <LoadingScreen />;

  const status = data?.verification_status ?? "unverified";
  const docs = (data?.provider_verifications ?? []) as Array<{
    id: string;
    document_type: string;
    status: string;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
  }>;

  return (
    <ProviderShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">Verification</h1>
          <p className="text-[#6b7b8c] mt-1">Track and manage your identity and business documents.</p>
        </header>

        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex items-center gap-4">
          <div
            className={`h-12 w-12 rounded-full grid place-items-center ${
              status === "verified"
                ? "bg-[#59914c]/10 text-[#59914c]"
                : status === "pending"
                ? "bg-amber-100 text-amber-700"
                : status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-[#F3F4F6] text-[#6b7b8c]"
            }`}
          >
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#2e4053] capitalize">{status}</p>
            <p className="text-sm text-[#6b7b8c]">
              {status === "verified" && "You're verified. The trust badge is visible on your profile."}
              {status === "pending" && "Documents are being reviewed. This usually takes 1–2 business days."}
              {status === "rejected" && "Some documents were rejected. Please re-upload."}
              {status === "unverified" && "Complete onboarding to submit your verification documents."}
            </p>
          </div>
          {status === "unverified" && (
            <Button asChild className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]">
              <Link to="/onboarding">Start</Link>
            </Button>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="font-semibold text-[#2e4053]">Documents</h2>
            <span className="text-xs text-[#6b7b8c]">{docs.length} submitted</span>
          </div>
          {docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6b7b8c]">
              No documents uploaded yet. Complete onboarding to submit them.
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {docs.map((d) => (
                <li key={d.id} className="px-6 py-4 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#6b7b8c] mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2e4053]">{LABELS[d.document_type] ?? d.document_type}</p>
                    <p className="text-xs text-[#6b7b8c]">
                      Uploaded {new Date(d.created_at).toLocaleDateString()}
                      {d.expiry_date && ` · Expires ${new Date(d.expiry_date).toLocaleDateString()}`}
                    </p>
                    {d.notes && <p className="text-xs text-red-600 mt-1">{d.notes}</p>}
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProviderShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#59914c]/10 text-[#59914c] px-2.5 py-1 text-xs font-medium">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-medium">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 text-xs font-medium">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}