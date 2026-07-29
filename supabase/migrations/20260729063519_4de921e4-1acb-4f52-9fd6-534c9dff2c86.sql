CREATE TABLE public.provider_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE,
  stripe_account_id text NOT NULL UNIQUE,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  requirements jsonb,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.provider_stripe_accounts TO authenticated;
GRANT ALL ON public.provider_stripe_accounts TO service_role;

ALTER TABLE public.provider_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers view own stripe account"
  ON public.provider_stripe_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Service role manages stripe accounts"
  ON public.provider_stripe_accounts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_provider_stripe_accounts_updated_at
  BEFORE UPDATE ON public.provider_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();