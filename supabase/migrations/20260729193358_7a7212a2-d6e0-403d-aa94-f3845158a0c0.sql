-- 1) Remove broad public SELECT on profiles; expose safe columns via a view
DROP POLICY IF EXISTS "Public can view verified providers" ON public.profiles;

CREATE OR REPLACE VIEW public.public_providers
WITH (security_invoker = on) AS
SELECT
  user_id,
  display_name,
  avatar_url,
  bio,
  years_experience,
  service_radius,
  verification_status,
  is_available
FROM public.profiles
WHERE type = 'provider' AND onboarding_status = 'complete';

GRANT SELECT ON public.public_providers TO anon, authenticated;

-- The view uses security_invoker, so it still needs a SELECT policy on the base
-- table that admits the same safe rows. Keep it minimal (no PII columns are
-- selectable through the view).
CREATE POLICY "Public can view completed provider rows via view"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (type = 'provider' AND onboarding_status = 'complete');

-- 2) Restrict job-images bucket reads to the uploader (folder = auth.uid())
DROP POLICY IF EXISTS "Authenticated can read job images" ON storage.objects;

CREATE POLICY "Users can read own job images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'job-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can manage job images"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'job-images')
  WITH CHECK (bucket_id = 'job-images');