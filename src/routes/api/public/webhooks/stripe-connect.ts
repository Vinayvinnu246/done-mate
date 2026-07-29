import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

export const Route = createFileRoute("/api/public/webhooks/stripe-connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!secret || !stripeKey) {
          return new Response("Stripe not configured", { status: 500 });
        }
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        const { default: StripeCtor } = await import("stripe");
        const stripe = new StripeCtor(stripeKey, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        } catch (err) {
          return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
        }

        if (event.type === "account.updated" || event.type === "account.application.deauthorized") {
          const account = event.data.object as Stripe.Account;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin
            .from("provider_stripe_accounts")
            .update({
              charges_enabled: !!account.charges_enabled,
              payouts_enabled: !!account.payouts_enabled,
              details_submitted: !!account.details_submitted,
              requirements: (account.requirements ?? null) as never,
              country: account.country ?? null,
            })
            .eq("stripe_account_id", account.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});