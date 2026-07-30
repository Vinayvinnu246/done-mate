import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  User,
  Wallet as WalletIcon,
} from "lucide-react";

import { ProviderShell } from "@/components/layout/ProviderShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useProviderOnly } from "@/hooks/use-role-guard";
import { getMyProviderProfile } from "@/lib/onboarding.functions";
import { getMyBookings, getMyProviderQuotes } from "@/lib/jobs.functions";
import { getWalletData } from "@/lib/wallet.functions";
import { getMyReviews } from "@/lib/reviews.functions";
import { providerCompletionFields, providerCompletionPercent, PROVIDER_SETUP } from "@/lib/role-routing";

export const Route = createFileRoute("/_authenticated/provider/dashboard")({
  component: ProviderDashboard,
});

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  verified: { label: "Approved", tone: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pending review", tone: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", tone: "bg-red-100 text-red-700" },
  unverified: { label: "Not submitted", tone: "bg-[#F1F2F4] text-[#4a5563]" },
};

function ProviderDashboard() {
  const navigate = useNavigate();
  const { isProvider, isLoading: authLoading, redirecting } = useProviderOnly();

  const profileQuery = useQuery({
    queryKey: ["provider-profile"],
    queryFn: () => getMyProviderProfile(),
    enabled: isProvider,
  });
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => getMyBookings(),
    enabled: isProvider,
  });
  const quotesQuery = useQuery({
    queryKey: ["my-quotes"],
    queryFn: () => getMyProviderQuotes(),
    enabled: isProvider,
  });
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWalletData(),
    enabled: isProvider,
  });
  const reviewsQuery = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => getMyReviews(),
    enabled: isProvider,
  });

  const profile = profileQuery.data as Record<string, any> | undefined;
  const completion = providerCompletionPercent(profile);
  const fields = providerCompletionFields(profile);
  const setupIncomplete = !!profile && profile.onboarding_status !== "complete";

  if (authLoading || redirecting || profileQuery.isLoading) {
    return (
      <ProviderShell>
        <LoadingScreen />
      </ProviderShell>
    );
  }

  const verification = (profile?.verification_status as string) ?? "unverified";
  const status = STATUS_LABELS[verification] ?? STATUS_LABELS.unverified;
  const bookings = (bookingsQuery.data?.providerJobs ?? []) as any[];
  const upcoming = bookings.filter((b) =>
    ["accepted", "scheduled", "in_progress", "on_the_way", "arrived"].includes(b.status),
  );
  const balances = walletQuery.data?.balances;
  const reviews = (reviewsQuery.data ?? []) as Array<{ rating: number; comment: string | null }>;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const payoutsEnabled = !!walletQuery.data?.banks?.length;

  return (
    <ProviderShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-[#2e4053]">
          {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Provider dashboard"}
        </h1>
        <p className="mt-1 text-[#6b7b8c]">Your business at a glance.</p>
      </div>

      {verification !== "verified" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            Your profile has been submitted for review. Customers will be able to find and book you
            once your account has been approved.
          </div>
        </div>
      )}

      {completion < 100 && (
        <Card className="mb-6 border-[#E5E7EB]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile completion: {completion}%</CardTitle>
            <CardDescription>Complete your profile to appear higher in customer searches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F2F4]">
              <div className="h-full rounded-full bg-[#59914c]" style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {fields
                .filter((f) => !f.done)
                .map((f) => (
                  <Badge key={f.label} variant="secondary" className="bg-[#F1F2F4] font-normal text-[#4a5563]">
                    {f.label}
                  </Badge>
                ))}
            </div>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/onboarding">Finish setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profile status" value={completion === 100 ? "Complete" : `${completion}%`} icon={User} />
        <StatCard
          label="Verification"
          value={status.label}
          icon={ShieldCheck}
          badgeClass={status.tone}
        />
        <StatCard
          label="Admin approval"
          value={verification === "verified" ? "Approved" : "Awaiting approval"}
          icon={BadgeCheck}
        />
        <StatCard label="Upcoming jobs" value={String(upcoming.length)} icon={CalendarCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" /> Upcoming jobs
              </CardTitle>
              <CardDescription>Bookings scheduled with your customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.slice(0, 5).map((job: any) => (
                <Link
                  key={job.id}
                  to="/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4 transition hover:bg-[#FAFAF8]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#2e4053]">{job.title}</p>
                    <p className="text-sm text-[#6b7b8c]">
                      {job.scheduled_date
                        ? new Date(job.scheduled_date).toLocaleDateString("en-GB")
                        : "Date to confirm"}
                    </p>
                  </div>
                  <Badge className="bg-[#2e4053] text-white">{String(job.status).replace(/_/g, " ")}</Badge>
                </Link>
              ))}
              {upcoming.length === 0 && (
                <p className="text-sm text-[#6b7b8c]">No upcoming jobs yet. Quote on new jobs to win work.</p>
              )}
              <Button variant="outline" className="w-full rounded-full" asChild>
                <Link to="/bookings">View all bookings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" /> Reviews
              </CardTitle>
              <CardDescription>Average rating {avgRating} from {reviews.length} review(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-[#6b7b8c]">{r.comment}</p>}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-[#6b7b8c]">No reviews yet.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletIcon className="h-4 w-4" /> Earnings
              </CardTitle>
              <CardDescription>Stripe payout status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Available" value={`£${(balances?.available ?? 0).toFixed(2)}`} />
              <Row label="Pending" value={`£${(balances?.pending ?? 0).toFixed(2)}`} />
              <Row label="Withdrawn" value={`£${(balances?.totalWithdrawn ?? 0).toFixed(2)}`} />
              <Row label="Payouts" value={payoutsEnabled ? "Ready" : "Add bank details"} />
              <Button variant="outline" className="w-full rounded-full" asChild>
                <Link to="/wallet">Wallet & payouts</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>{quotesQuery.data?.length ?? 0} quotes sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink to="/messages" icon={MessageSquare} label="Messages" />
              <QuickLink to="/quotes" icon={FileText} label="Quotes" />
              <QuickLink to="/bookings" icon={CalendarDays} label="Calendar" />
              <QuickLink to="/profile" icon={User} label="Edit profile" />
              <QuickLink to="/settings" icon={Settings} label="Availability settings" />
              <QuickLink to="/verification" icon={ShieldCheck} label="Verification" />
              <QuickLink to="/support" icon={Bell} label="Notifications & support" />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProviderShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  badgeClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass?: string;
}) {
  return (
    <Card className="border-[#E5E7EB]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-[#6b7b8c]">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {badgeClass ? (
          <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-sm font-medium ${badgeClass}`}>
            {value}
          </span>
        ) : (
          <div className="mt-1 text-2xl font-semibold text-[#2e4053]">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#6b7b8c]">{label}</span>
      <span className="font-medium text-[#2e4053]">{value}</span>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button variant="outline" className="w-full justify-start rounded-full" asChild>
      <Link to={to}>
        <Icon className="mr-1.5 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}