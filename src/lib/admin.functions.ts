import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { supabase, userId } = context;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Unauthorized");
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const [profiles, jobs, quotes, verifications] = await Promise.all([
      supabase.from("profiles").select("type", { count: "exact" }),
      supabase.from("jobs").select("status", { count: "exact" }),
      supabase.from("quotes").select("status", { count: "exact" }),
      supabase.from("provider_verifications").select("status", { count: "exact" }),
    ]);

    return {
      profiles: profiles.count ?? 0,
      jobs: jobs.count ?? 0,
      quotes: quotes.count ?? 0,
      verifications: verifications.count ?? 0,
    };
  });

export const getAdminVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data, error } = await supabase
      .from("provider_verifications")
      .select("*, provider:profiles(display_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

export const updateVerificationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        verification_id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data: verification, error: findError } = await supabase
      .from("provider_verifications")
      .select("provider_id")
      .eq("id", data.verification_id)
      .single();

    if (findError) throw findError;

    const { error: updateError } = await supabase
      .from("provider_verifications")
      .update({ status: data.status, notes: data.notes, reviewed_by: context.userId })
      .eq("id", data.verification_id);

    if (updateError) throw updateError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: data.status === "approved" ? "verified" : "rejected",
      })
      .eq("id", verification.provider_id);

    if (profileError) throw profileError;

    return { ok: true };
  });

export const getAdminJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data, error } = await supabase
      .from("jobs")
      .select("*, category:categories(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        status: z.enum(["posted", "quoting", "accepted", "in_progress", "completed", "cancelled", "disputed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { error } = await supabase.from("jobs").update({ status: data.status }).eq("id", data.job_id);
    if (error) throw error;
    return { ok: true };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, type, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profilesError) throw profilesError;

    const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
    if (rolesError) throw rolesError;

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    return (profiles ?? []).map((p) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
    }));
  });

export const addUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "super_admin", "support", "finance", "verification"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { error } = await supabase.from("user_roles").insert({
      user_id: data.user_id,
      role: data.role,
    });

    if (error) throw error;
    return { ok: true };
  });
