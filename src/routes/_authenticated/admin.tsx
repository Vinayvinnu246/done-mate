import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/ui/back-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getAdminStats,
  getAdminVerifications,
  getAdminJobs,
  getAdminUsers,
  updateVerificationStatus,
  updateJobStatus,
  addUserRole,
  getAdminPayouts,
  updatePayoutStatus,
  creditJobEarnings,
  addWalletAdjustment,
  setPayoutHold,
  releasePayoutHold,
} from "@/lib/admin.functions";
import { Shield, Wallet as WalletIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

const verificationStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-[#59914c] text-white",
  rejected: "bg-red-100 text-red-700",
};

const jobStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  posted: "bg-emerald-100 text-emerald-700",
  quoting: "bg-blue-100 text-blue-700",
  accepted: "bg-amber-100 text-amber-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-[#59914c] text-white",
  cancelled: "bg-red-100 text-red-700",
  disputed: "bg-rose-100 text-rose-700",
};

const payoutStatusColors: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  paid: "bg-[#59914c] text-white",
  failed: "bg-red-100 text-red-700",
  reversed: "bg-red-100 text-red-700",
  on_hold: "bg-rose-100 text-rose-700",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [jobStatus, setJobStatus] = useState<Record<string, string>>({});
  const [roleSelections, setRoleSelections] = useState<Record<string, string>>({});
  const [payoutFail, setPayoutFail] = useState<Record<string, string>>({});
  const [creditForm, setCreditForm] = useState({ provider_id: "", gross_amount: "" });
  const [holdForm, setHoldForm] = useState({ provider_id: "", reason: "" });

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getAdminStats(),
    enabled: isAdmin,
  });

  const verificationsQuery = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () => getAdminVerifications(),
    enabled: isAdmin,
  });

  const jobsQuery = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => getAdminJobs(),
    enabled: isAdmin,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
    enabled: isAdmin,
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => getAdminPayouts(),
    enabled: isAdmin,
  });

  const verificationMutation = useMutation({
    mutationFn: updateVerificationStatus,
    onSuccess: () => {
      toast.success("Verification updated");
      verificationsQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const jobStatusMutation = useMutation({
    mutationFn: updateJobStatus,
    onSuccess: () => {
      toast.success("Job status updated");
      jobsQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const roleMutation = useMutation({
    mutationFn: addUserRole,
    onSuccess: () => {
      toast.success("Role added");
      usersQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const payoutMutation = useMutation({
    mutationFn: updatePayoutStatus,
    onSuccess: () => {
      toast.success("Payout updated");
      payoutsQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const creditMutation = useMutation({
    mutationFn: creditJobEarnings,
    onSuccess: () => {
      toast.success("Earnings credited");
      setCreditForm({ provider_id: "", gross_amount: "" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const adjustmentMutation = useMutation({
    mutationFn: addWalletAdjustment,
    onSuccess: () => toast.success("Adjustment added"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const holdMutation = useMutation({
    mutationFn: setPayoutHold,
    onSuccess: () => {
      toast.success("Hold placed");
      setHoldForm({ provider_id: "", reason: "" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  const releaseHoldMutation = useMutation({
    mutationFn: releasePayoutHold,
    onSuccess: () => toast.success("Hold released"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed"),
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Shield className="h-10 w-10 text-[#2e4053] mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold text-[#2e4053]">Access denied</h1>
            <p className="text-[#6b7b8c] mt-2">You don't have admin permissions.</p>
            <Button className="mt-4 rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    statsQuery.isLoading ||
    verificationsQuery.isLoading ||
    jobsQuery.isLoading ||
    usersQuery.isLoading
  ) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  const stats = statsQuery.data;
  const verifications = verificationsQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <BackButton className="mb-4" />
        <h1 className="font-display text-3xl font-semibold text-[#2e4053] mb-8">Admin dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Total users</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{stats?.profiles ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Total jobs</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{stats?.jobs ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Total quotes</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{stats?.quotes ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Verifications</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{stats?.verifications ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verifications" className="w-full">
          <TabsList className="mb-4 bg-white border border-[#E5E7EB]">
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="space-y-3">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2e4053]">
                      {v.provider?.display_name ?? "Unknown provider"}
                    </span>
                    <Badge className={verificationStatusColors[v.status] ?? verificationStatusColors.pending}>
                      {v.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#6b7b8c] mt-1 capitalize">
                    {v.document_type.replace("_", " ")}
                  </p>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#59914c] underline mt-1 inline-block"
                  >
                    View document
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      verificationMutation.mutate({ data: { verification_id: v.id, status: "approved" } })
                    }
                    disabled={v.status !== "pending"}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() =>
                      verificationMutation.mutate({ data: { verification_id: v.id, status: "rejected" } })
                    }
                    disabled={v.status !== "pending"}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {verifications.length === 0 && <p className="text-[#6b7b8c]">No verifications submitted yet.</p>}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2e4053] truncate">{job.title}</span>
                    <Badge className={jobStatusColors[job.status] ?? jobStatusColors.draft}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#6b7b8c] mt-1">{job.category?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                    value={jobStatus[job.id] ?? job.status}
                    onChange={(e) => setJobStatus((prev) => ({ ...prev, [job.id]: e.target.value }))}
                  >
                    <option value="posted">Posted</option>
                    <option value="quoting">Quoting</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="disputed">Disputed</option>
                  </select>
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      jobStatusMutation.mutate({ data: { job_id: job.id, status: jobStatus[job.id] as any } })
                    }
                    disabled={!jobStatus[job.id] || jobStatus[job.id] === job.status}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-[#6b7b8c]">No jobs yet.</p>}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="font-medium text-[#2e4053]">{user.display_name ?? "Unnamed"}</span>
                  <p className="text-sm text-[#6b7b8c] mt-1">
                    {user.type} • {user.roles.join(", ") || "no roles"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                    value={roleSelections[user.id] ?? ""}
                    onChange={(e) => setRoleSelections((prev) => ({ ...prev, [user.id]: e.target.value }))}
                  >
                    <option value="" disabled>
                      Add role
                    </option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                    <option value="support">Support</option>
                    <option value="finance">Finance</option>
                    <option value="verification">Verification</option>
                  </select>
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      roleMutation.mutate({ data: { user_id: user.id, role: roleSelections[user.id] as any } })
                    }
                    disabled={!roleSelections[user.id]}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-[#6b7b8c]">No users yet.</p>}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-3">
            {(payoutsQuery.data ?? []).map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#2e4053]">
                      £{Number(p.amount).toFixed(2)} · {p.bank?.bank_name ?? "—"} •••• {p.bank?.account_last4 ?? "—"}
                    </p>
                    <p className="text-xs text-[#6b7b8c]">
                      Provider {p.provider_id.slice(0, 8)} · Requested {new Date(p.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Badge className={payoutStatusColors[p.status] ?? payoutStatusColors.requested}>{p.status.replace("_", " ")}</Badge>
                </div>
                {p.failure_reason && <p className="text-xs text-[#c0392b]">Reason: {p.failure_reason}</p>}
                <div className="flex flex-wrap gap-2">
                  {["processing", "paid", "failed", "on_hold", "reversed"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      className="rounded-full capitalize"
                      onClick={() =>
                        payoutMutation.mutate({
                          data: {
                            payout_id: p.id,
                            status: s as any,
                            failure_reason: (s === "failed" || s === "reversed") ? (payoutFail[p.id] || undefined) : undefined,
                          },
                        })
                      }
                    >
                      Mark {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Failure reason (if marking failed/reversed)"
                  value={payoutFail[p.id] ?? ""}
                  onChange={(e) => setPayoutFail((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
              </div>
            ))}
            {(payoutsQuery.data ?? []).length === 0 && <p className="text-[#6b7b8c]">No payout requests yet.</p>}
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <h3 className="font-medium text-[#2e4053] flex items-center gap-2">
                <WalletIcon className="h-4 w-4" /> Simulate customer payment
              </h3>
              <p className="text-xs text-[#6b7b8c]">
                Credits a provider's wallet with 85% (15% platform commission). Net enters the 3-day pending hold.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Provider user id</Label>
                  <Input value={creditForm.provider_id} onChange={(e) => setCreditForm({ ...creditForm, provider_id: e.target.value })} placeholder="uuid" />
                </div>
                <div>
                  <Label>Gross amount (£)</Label>
                  <Input type="number" value={creditForm.gross_amount} onChange={(e) => setCreditForm({ ...creditForm, gross_amount: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button
                    className="rounded-full w-full"
                    onClick={() =>
                      creditMutation.mutate({
                        data: { provider_id: creditForm.provider_id, gross_amount: Number(creditForm.gross_amount) },
                      })
                    }
                    disabled={!creditForm.provider_id || !creditForm.gross_amount}
                  >
                    Credit earnings
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <h3 className="font-medium text-[#2e4053]">Place payout hold</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Provider user id</Label>
                  <Input value={holdForm.provider_id} onChange={(e) => setHoldForm({ ...holdForm, provider_id: e.target.value })} placeholder="uuid" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Reason</Label>
                  <Input value={holdForm.reason} onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })} />
                </div>
              </div>
              <Button
                className="rounded-full"
                variant="outline"
                onClick={() => holdMutation.mutate({ data: holdForm })}
                disabled={!holdForm.provider_id || !holdForm.reason}
              >
                Place hold
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <h3 className="font-medium text-[#2e4053]">Manual adjustment</h3>
              <p className="text-xs text-[#6b7b8c]">Positive amount credits the provider; negative amount debits.</p>
              <AdjustmentForm onSubmit={(v) => adjustmentMutation.mutate({ data: v })} pending={adjustmentMutation.isPending} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AdjustmentForm({
  onSubmit,
  pending,
}: {
  onSubmit: (v: { provider_id: string; type: "adjustment" | "bonus" | "refund" | "cancellation_fee"; amount: number; description: string }) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({ provider_id: "", type: "adjustment" as const, amount: "", description: "" });
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Input placeholder="Provider user id" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })} />
      <select
        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value as any })}
      >
        <option value="adjustment">Adjustment</option>
        <option value="bonus">Bonus</option>
        <option value="refund">Refund</option>
        <option value="cancellation_fee">Cancellation fee</option>
      </select>
      <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Button
        className="rounded-full sm:col-span-4"
        onClick={() =>
          onSubmit({
            provider_id: form.provider_id,
            type: form.type,
            amount: Number(form.amount),
            description: form.description,
          })
        }
        disabled={pending || !form.provider_id || !form.amount || !form.description}
      >
        {pending ? "Saving…" : "Add adjustment"}
      </Button>
    </div>
  );
}
