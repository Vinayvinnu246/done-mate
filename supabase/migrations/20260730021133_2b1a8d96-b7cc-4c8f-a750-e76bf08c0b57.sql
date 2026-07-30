CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'unread',
  read_at timestamp with time zone,
  delivery_method text NOT NULL DEFAULT 'in_app',
  delivery_status text NOT NULL DEFAULT 'delivered',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX notifications_unique_per_job_type
  ON public.notifications (user_id, job_id, type)
  WHERE job_id IS NOT NULL;

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '14 days');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS muted_category_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS daily_notification_limit integer NOT NULL DEFAULT 50;