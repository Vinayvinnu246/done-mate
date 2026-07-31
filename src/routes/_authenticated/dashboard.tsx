import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PROVIDER_HOME, PROVIDER_SETUP, providerNeedsSetup } from "@/lib/role-routing";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Badge } from "@/components/ui/badge";
import { getAvailableJobs, getMyJobs } from "@/lib/jobs.functions";
import { getMyProviderProfile } from "@/lib/onboarding.functions";
import { ClipboardList, ShieldCheck, Star, Plus, Wrench, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, roles, isLoading } = useAuth();
  const isProvider = profile?.type === "provider";
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const navigate = useNavigate();

  // Providers belong in the provider portal, never the customer dashboard.
  useEffect(() => {
    if (isLoading || !isProvider) return;
    navigate({ to: providerNeedsSetup(profile) ? PROVIDER_SETUP : PROVIDER_HOME, replace: true });
  }, [isLoading, isProvider, profile, navigate]);

  const myJobsQuery = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => getMyJobs(),
    enabled: !isProvider,
  });

  const availableJobsQuery = useQuery({
    queryKey: ["available-jobs"],
    queryFn: () => getAvailableJobs(),
    enabled: isProvider,
  });

  const providerProfileQuery = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => getMyProviderProfile(),
    enabled: isProvider,
  });

  if (isLoading || isProvider) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  const jobs = isProvider ? availableJobsQuery.data ?? [] : myJobsQuery.data ?? [];
  const pendingQuotes = !isProvider
    ? jobs.reduce((acc, job) => acc + (job.quotes?.filter((q) => q.status === "pending").length ?? 0), 0)
    : 0;

  const verificationStatus = providerProfileQuery.data?.verification_status ?? "unverified";

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <BackButton className="mb-4" />
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2e4053]">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-2 text-[#6b7b8c]">
            {isProvider
              ? "Manage your quotes, verification, and availability."
              : "Track your jobs and compare quotes from verified professionals."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">{isProvider ? "Available jobs" : "Active jobs"}</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{jobs.length}</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">{isProvider ? "Quotes sent" : "Pending quotes"}</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053]">
                {isProvider
                  ? providerProfileQuery.data?.provider_categories?.length ?? 0
                  : pendingQuotes}
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Verification</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-semibold text-[#2e4053] capitalize">
                  {isProvider ? verificationStatus : "Verified"}
                </span>
                {isProvider && verificationStatus === "verified" && (
                  <ShieldCheck className="h-5 w-5 text-[#59914c]" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="text-sm text-[#6b7b8c]">Account</div>
              <div className="mt-1 text-2xl font-semibold text-[#2e4053] truncate">{user?.email}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#E5E7EB]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  {isProvider ? "Available jobs" : "My jobs"}
                </CardTitle>
                <CardDescription>
                  {isProvider ? "Jobs you can quote on right now" : "Your recent job postings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    to="/jobs/$jobId"
                    params={{ jobId: job.id }}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 hover:bg-[#FAFAF8] transition"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#2e4053] truncate">{job.title}</p>
                      <p className="text-sm text-[#6b7b8c]">{job.category?.name ?? "General"}</p>
                    </div>
                    <Badge className="bg-[#2e4053] text-white">{job.status.replace("_", " ")}</Badge>
                  </Link>
                ))}
                {jobs.length === 0 && (
                  <p className="text-sm text-[#6b7b8c]">
                    {isProvider
                      ? "No jobs available right now. Check back later."
                      : "You haven't posted any jobs yet."}
                  </p>
                )}
                <Button variant="outline" className="w-full rounded-full" asChild>
                  <Link to="/jobs">View all jobs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-[#E5E7EB]">
              <CardHeader>
                <CardTitle className="text-base">Quick actions</CardTitle>
                <CardDescription>Get started with DoneMate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isProvider && (
                  <Button className="w-full justify-start rounded-full" asChild>
                    <Link to="/post-job">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Post a job
                    </Link>
                  </Button>
                )}
                {isProvider && verificationStatus === "unverified" && (
                  <Button className="w-full justify-start rounded-full" asChild>
                    <Link to="/onboarding">
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      Complete verification
                    </Link>
                  </Button>
                )}
                {isProvider && (
                  <Button variant="outline" className="w-full justify-start rounded-full" asChild>
                    <Link to="/wallet">
                      <WalletIcon className="h-4 w-4 mr-1.5" />
                      Wallet & payouts
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start rounded-full" asChild>
                  <Link to="/profile">
                    <Wrench className="h-4 w-4 mr-1.5" />
                    Edit profile
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full justify-start rounded-full" asChild>
                    <Link to="/admin">
                      <Star className="h-4 w-4 mr-1.5" />
                      Admin dashboard
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
