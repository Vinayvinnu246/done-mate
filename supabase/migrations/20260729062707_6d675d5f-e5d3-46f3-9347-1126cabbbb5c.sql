ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS parent_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proposed_by text NOT NULL DEFAULT 'provider';

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_proposed_by_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_proposed_by_check CHECK (proposed_by IN ('customer','provider'));

DROP POLICY IF EXISTS "Customers can counter quotes on own jobs" ON public.quotes;
CREATE POLICY "Customers can counter quotes on own jobs"
  ON public.quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proposed_by = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can update quotes on own jobs" ON public.quotes;
CREATE POLICY "Customers can update quotes on own jobs"
  ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.customer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.customer_id = auth.uid())
  );