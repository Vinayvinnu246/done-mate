-- Recreate view as SECURITY DEFINER so the base table doesn't need a broad
-- anon/authenticated SELECT policy, preventing direct access to PII columns.
DROP VIEW IF EXISTS public.public_providers;
DROP POLICY IF EXISTS "Public can view completed provider rows via view" ON public.profiles;

CREATE VIEW public.public_providers
WITH (security_invoker = off) AS
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