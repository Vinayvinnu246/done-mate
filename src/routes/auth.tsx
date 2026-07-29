import {
  createFileRoute,
  useNavigate,
  useSearch,
  Link,
} from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Briefcase, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import logoAsset from "@/assets/donetoday-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? ("signup" as const) : ("login" as const),
    role: s.role === "customer" || s.role === "provider" ? (s.role as "customer" | "provider") : undefined,
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const nextPath = search.next;
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const role = search.role;

  // No role picked yet — show the chooser.
  if (!role) {
    return <RoleChooser mode={mode} nextPath={nextPath} />;
  }

  const isProvider = role === "provider";
  const theme = isProvider
    ? { accent: "text-emerald-700", bg: "bg-emerald-50", label: "Provider", tagline: "Win more work with DoneToday." }
    : { accent: "text-primary", bg: "bg-primary/5", label: "Customer", tagline: "Book verified local pros in minutes." };

  const goNext = () => {
    if (nextPath) window.location.href = nextPath;
    else navigate({ to: isProvider ? "/providers" : "/dashboard" });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Enforce that the account matches the role of this login page.
      const uid = signInData.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("type")
          .eq("user_id", uid)
          .maybeSingle();
        if (profile?.type && profile.type !== role) {
          await supabase.auth.signOut();
          const other = profile.type === "provider" ? "provider" : "customer";
          throw new Error(
            `This is a ${role} sign in. Your account is a ${other} — use the ${other} sign in instead.`,
          );
        }
      }

      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: nextPath
            ? `${window.location.origin}/auth?next=${encodeURIComponent(nextPath)}`
            : window.location.origin,
          data: { type: role },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError(
          `This email is already registered. Each email can only be linked to one account — sign in instead, or use a different email for your ${role} account.`,
        );
        return;
      }

      if (data.session) {
        goNext();
      } else {
        setSuccess("Check your email to confirm your account before signing in.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      if (/already\s+registered|already\s+exists/i.test(message)) {
        setError(
          `This email is already registered. Each email can only be linked to one account — sign in instead, or use a different email for your ${role} account.`,
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: nextPath
          ? `${window.location.origin}/auth?next=${encodeURIComponent(nextPath)}`
          : window.location.origin,
      });

      if (result.error) throw result.error;
      if (result.redirected) return;
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col px-6 py-12 md:flex-row md:gap-16">
        <div className="mb-10 md:mb-0 md:w-1/2">
          <Link to="/" className="mb-8 inline-block">
            <img src={logoAsset.url} alt="DoneToday" width={180} height={60} className="h-12 w-auto" />
          </Link>
          <div className={`inline-flex items-center gap-2 rounded-full ${theme.bg} px-3 py-1 text-xs font-semibold ${theme.accent}`}>
            {isProvider ? <Briefcase className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {theme.label} portal
          </div>
          <h1 className="mt-4 font-serif text-4xl text-foreground md:text-5xl">
            {isProvider ? "Grow your business." : "Local pros, done today."}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{theme.tagline}</p>
          <Link
            to="/auth"
            search={{ mode, role: isProvider ? "customer" : "provider" }}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Switch to {isProvider ? "customer" : "provider"} sign in
          </Link>
        </div>

        <div className="md:w-1/2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{theme.label} sign in</TabsTrigger>
              <TabsTrigger value="signup">Create {theme.label.toLowerCase()} account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign in
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/reset-password" className="underline hover:text-foreground">
                    Forgot password?
                  </Link>
                </p>

                <Separator />

                <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                  Continue with Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input
                    id="signup-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account type</Label>
                  <div className={`flex items-center gap-3 rounded-lg border border-primary ${theme.bg} p-4`}>
                    {isProvider ? <Briefcase className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    <div className="text-sm">
                      <div className="font-medium">{theme.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Wrong type?{" "}
                        <Link
                          to="/auth"
                          search={{ mode: "signup", role: isProvider ? "customer" : "provider" }}
                          className="underline hover:text-foreground"
                        >
                          Sign up as {isProvider ? "customer" : "provider"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create account
                </Button>

                <Separator />

                <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                  Sign up with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function RoleChooser({ mode, nextPath }: { mode: "login" | "signup"; nextPath?: string }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="mb-10 inline-block">
          <img src={logoAsset.url} alt="DoneToday" width={180} height={60} className="h-12 w-auto" />
        </Link>
        <h1 className="font-serif text-4xl text-foreground md:text-5xl">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Choose how you use DoneToday to continue.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            to="/auth"
            search={{ mode, role: "customer", ...(nextPath ? { next: nextPath } : {}) }}
            className="group rounded-2xl border border-border bg-background p-6 shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-serif text-2xl">I'm a Customer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Post jobs and hire verified local professionals.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Continue <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/auth"
            search={{ mode, role: "provider", ...(nextPath ? { next: nextPath } : {}) }}
            className="group rounded-2xl border border-border bg-background p-6 shadow-sm transition hover:border-emerald-600 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-serif text-2xl">I'm a Provider</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Win jobs, manage bookings, and grow your business.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 group-hover:gap-2 transition-all">
              Continue <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>Already have an account?{" "}
              <Link to="/auth" search={{ mode: "login" }} className="underline hover:text-foreground">Sign in</Link>
            </>
          ) : (
            <>New to DoneToday?{" "}
              <Link to="/auth" search={{ mode: "signup" }} className="underline hover:text-foreground">Create an account</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

