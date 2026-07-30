-- 1. Job columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_provider_id uuid,
  ADD COLUMN IF NOT EXISTS booking_status text NOT NULL DEFAULT 'quote_pending',
  ADD COLUMN IF NOT EXISTS job_ref text,
  ADD COLUMN IF NOT EXISTS scheduled_start_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/London',
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS agreed_price numeric,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS customer_instructions text,
  ADD COLUMN IF NOT EXISTS materials_info text,
  ADD COLUMN IF NOT EXISTS before_photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS after_photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS provider_notes text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_details text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_5h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_5h_sent_at timestamptz;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_booking_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_booking_status_check CHECK (booking_status = ANY (ARRAY[
  'quote_pending','provider_selected','assigned','confirmed','upcoming','on_the_way','arrived',
  'in_progress','provider_completed','customer_confirmed','completed','cancelled','disputed','unable_to_complete'
]));

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_payment_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_payment_status_check CHECK (payment_status = ANY (ARRAY[
  'pending','authorised','paid','released','refunded','failed'
]));

-- 2. Human readable job reference
CREATE SEQUENCE IF NOT EXISTS public.job_ref_seq START 1000;

CREATE OR REPLACE FUNCTION public.set_job_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.job_ref IS NULL THEN
    NEW.job_ref := 'DT-' || to_char(now(), 'YY') || '-' || lpad(nextval('public.job_ref_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_job_ref_trigger ON public.jobs;
CREATE TRIGGER set_job_ref_trigger BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_job_ref();

UPDATE public.jobs SET job_ref = 'DT-' || to_char(created_at, 'YY') || '-' || lpad(nextval('public.job_ref_seq')::text, 5, '0') WHERE job_ref IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_job_ref_key ON public.jobs (job_ref);
CREATE INDEX IF NOT EXISTS jobs_assigned_provider_idx ON public.jobs (assigned_provider_id);
CREATE INDEX IF NOT EXISTS jobs_scheduled_start_idx ON public.jobs (scheduled_start_datetime);

-- 3. Provider access to assigned jobs
DROP POLICY IF EXISTS "Providers can view assigned jobs" ON public.jobs;
CREATE POLICY "Providers can view assigned jobs" ON public.jobs
FOR SELECT TO authenticated
USING (auth.uid() = assigned_provider_id);

DROP POLICY IF EXISTS "Providers can update assigned jobs" ON public.jobs;
CREATE POLICY "Providers can update assigned jobs" ON public.jobs
FOR UPDATE TO authenticated
USING (auth.uid() = assigned_provider_id)
WITH CHECK (auth.uid() = assigned_provider_id);

-- 4. Status history
CREATE TABLE IF NOT EXISTS public.job_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_id uuid,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.job_status_events TO authenticated;
GRANT ALL ON public.job_status_events TO service_role;

ALTER TABLE public.job_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job parties read status events" ON public.job_status_events;
CREATE POLICY "Job parties read status events" ON public.job_status_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs j
  WHERE j.id = job_status_events.job_id
    AND (j.customer_id = auth.uid() OR j.assigned_provider_id = auth.uid())
));

DROP POLICY IF EXISTS "Job parties add status events" ON public.job_status_events;
CREATE POLICY "Job parties add status events" ON public.job_status_events
FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.jobs j
  WHERE j.id = job_status_events.job_id
    AND (j.customer_id = auth.uid() OR j.assigned_provider_id = auth.uid())
));

CREATE INDEX IF NOT EXISTS job_status_events_job_idx ON public.job_status_events (job_id, created_at DESC);

DROP TRIGGER IF EXISTS update_job_status_events_updated_at ON public.job_status_events;
CREATE TRIGGER update_job_status_events_updated_at BEFORE UPDATE ON public.job_status_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Backfill assignment from accepted quotes
UPDATE public.jobs j
SET assigned_provider_id = q.provider_id,
    agreed_price = COALESCE(j.agreed_price, q.price),
    estimated_duration_minutes = COALESCE(j.estimated_duration_minutes, q.duration_minutes),
    scheduled_start_datetime = COALESCE(j.scheduled_start_datetime, j.scheduled_date),
    booking_status = CASE
      WHEN j.status = 'completed' THEN 'completed'
      WHEN j.status = 'cancelled' THEN 'cancelled'
      WHEN j.status = 'disputed' THEN 'disputed'
      WHEN j.status = 'in_progress' THEN 'in_progress'
      ELSE 'assigned' END
FROM public.quotes q
WHERE q.job_id = j.id AND q.status = 'accepted' AND j.assigned_provider_id IS NULL;