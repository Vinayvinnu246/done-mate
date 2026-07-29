import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";

export const getStripeConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("provider_stripe_accounts")
      .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted, requirements, country")
      .eq("provider_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const createStripeOnboardingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { getStripe, getReturnUrls } = await import("./stripe-connect.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();

    const origin =
      getRequestHeader("origin") ||
      (getRequestHeader("referer") ? new URL(getRequestHeader("referer")!).origin : "") ||
      "https://project--9d57e615-86b7-4740-9f8c-ec0ebd3c0a3a.lovable.app";

    const { data: profile } = await supabase.from("profiles").select("id, phone").eq("user_id", userId).maybeSingle();
    const { data: existing } = await supabase
      .from("provider_stripe_accounts")
      .select("stripe_account_id")
      .eq("provider_id", userId)
      .maybeSingle();

    let accountId = existing?.stripe_account_id;
    if (!accountId) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email ?? undefined;
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { provider_id: userId, profile_id: profile?.id ?? "" },
      });
      accountId = account.id;
      const { error: insErr } = await supabaseAdmin.from("provider_stripe_accounts").insert({
        provider_id: userId,
        stripe_account_id: accountId,
        country: account.country ?? "GB",
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
        details_submitted: !!account.details_submitted,
        requirements: account.requirements as unknown as object,
      });
      if (insErr) throw insErr;
    }

    const { return_url, refresh_url } = getReturnUrls(origin);
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url,
      refresh_url,
    });
    return { url: link.url, accountId };
  });

export const refreshStripeConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { getStripe } = await import("./stripe-connect.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabase
      .from("provider_stripe_accounts")
      .select("stripe_account_id")
      .eq("provider_id", userId)
      .maybeSingle();
    if (!existing) return null;

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(existing.stripe_account_id);
    const { data, error } = await supabaseAdmin
      .from("provider_stripe_accounts")
      .update({
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
        details_submitted: !!account.details_submitted,
        requirements: account.requirements as unknown as object,
        country: account.country ?? null,
      })
      .eq("provider_id", userId)
      .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted, requirements, country")
      .single();
    if (error) throw error;
    return data;
  });

export const createStripeDashboardLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { getStripe } = await import("./stripe-connect.server");
    const { data: existing } = await supabase
      .from("provider_stripe_accounts")
      .select("stripe_account_id")
      .eq("provider_id", userId)
      .maybeSingle();
    if (!existing) throw new Error("Connect account not set up");
    const stripe = getStripe();
    const link = await stripe.accounts.createLoginLink(existing.stripe_account_id);
    return { url: link.url };
  });