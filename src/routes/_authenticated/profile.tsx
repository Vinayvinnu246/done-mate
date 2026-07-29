import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Save, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => getMyProfile(),
  });

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (input: { display_name?: string; phone?: string; avatar_url?: string }) =>
      updateMyProfile({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });

  useState(() => {
    if (data?.profile) {
      setDisplayName(data.profile.display_name ?? "");
      setPhone(data.profile.phone ?? "");
      setAvatarUrl(data.profile.avatar_url ?? "");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await updateMutation.mutateAsync({
        display_name: displayName,
        phone,
        avatar_url: avatarUrl,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

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

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-serif text-3xl text-foreground">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          Update your account details so pros and customers can recognise you.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Public details
              </CardTitle>
              <CardDescription>
                Signed in as {data?.profile?.user_id ? "" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7123 456789"
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Account type</div>
                <div className="font-medium capitalize">{data?.profile?.type ?? "customer"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Onboarding status</div>
                <div className="font-medium capitalize">{data?.profile?.onboarding_status ?? "incomplete"}</div>
              </div>
            </CardContent>
          </Card>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {updateMutation.isSuccess && (
            <Alert className="border-primary/50 bg-primary/5">
              <AlertDescription>Profile updated successfully.</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
