
CREATE TABLE public.provider_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  sort_code TEXT NOT NULL,
  account_last4 TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_bank_accounts TO authenticated;
GRANT ALL ON public.provider_bank_accounts TO service_role;
ALTER TABLE public.provider_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage own bank accounts" ON public.provider_bank_accounts
  FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.provider_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES public.provider_bank_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers view own payouts" ON public.payout_requests
  FOR SELECT TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers create own payouts" ON public.payout_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id AND status = 'pending');
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
