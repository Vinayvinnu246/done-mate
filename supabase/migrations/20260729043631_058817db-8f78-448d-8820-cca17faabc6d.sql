
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  body TEXT,
  image_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_job_provider_idx ON public.messages (job_id, provider_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = provider_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      auth.uid() = provider_id
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Participants can update their messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = provider_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = provider_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id AND j.customer_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
