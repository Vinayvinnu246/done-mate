
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_provider_id_fkey;
ALTER TABLE public.payout_holds DROP CONSTRAINT IF EXISTS payout_holds_provider_id_fkey;

DROP POLICY IF EXISTS "Providers view own ledger" ON public.wallet_transactions;
CREATE POLICY "Providers view own ledger"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "Providers view own holds" ON public.payout_holds;
CREATE POLICY "Providers view own holds"
  ON public.payout_holds FOR SELECT TO authenticated
  USING (provider_id = auth.uid());
