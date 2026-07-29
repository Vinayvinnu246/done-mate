import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
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
} from "@/lib/admin.functions";
import { Shield, Users, Briefcase, FileCheck } from "lucide-react";

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

function AdminDashboard() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [jobStatus, setJobStatus] = useState<Record<string, string>>({});
  const [roleSelections, setRoleSelections] = useState<Record<string, string>>({});

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
                  <p className="text-sm text-[#6b7b8c] mt-1">
                    {job.customer?.display_name ?? job.customer?.email} • {job.category?.name}
                  </p>
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
                  <span className="font-medium text-[#2e4053]">{user.display_name ?? user.email}</span>
                  <p className="text-sm text-[#6b7b8c] mt-1">
                    {user.email} • {user.type} • {user.user_roles.map((r: any) => r.role).join(", ") || "no roles"}
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
        </Tabs>
      </main>
    </div>
  );
}
