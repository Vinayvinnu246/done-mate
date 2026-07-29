
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('job_earning','commission','refund','adjustment','withdrawal','reversal','bonus','cancellation_fee')),
  amount numeric(12,2) NOT NULL,
  description text,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  payout_request_id uuid REFERENCES public.payout_requests(id) ON DELETE SET NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers view own ledger"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all ledger"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance'));

CREATE INDEX wallet_transactions_provider_idx ON public.wallet_transactions(provider_id, available_at);

CREATE TRIGGER trg_wallet_transactions_updated
BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.payout_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  released_by uuid,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payout_holds TO authenticated;
GRANT ALL ON public.payout_holds TO service_role;

ALTER TABLE public.payout_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers view own holds"
  ON public.payout_holds FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all holds"
  ON public.payout_holds FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance'));

CREATE INDEX payout_holds_provider_idx ON public.payout_holds(provider_id, active);

CREATE TRIGGER trg_payout_holds_updated
BEFORE UPDATE ON public.payout_holds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS estimated_arrival timestamptz,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;
