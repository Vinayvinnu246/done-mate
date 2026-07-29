import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-4xl tracking-tight text-foreground">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            This is your DoneToday dashboard. More features are coming next.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Signed in as {user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Type: <span className="font-medium text-foreground capitalize">{profile?.type ?? "customer"}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Onboarding: <span className="font-medium text-foreground capitalize">{profile?.onboarding_status ?? "incomplete"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roles</CardTitle>
              <CardDescription>Your platform permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground">No additional roles assigned yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Get started with DoneToday</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/">Post a job</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/profile">Complete profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
