-- Undo previous complexity
DROP FUNCTION IF EXISTS public.get_my_profile();
DROP POLICY IF EXISTS "Public can view completed provider rows" ON public.profiles;

-- Restore normal table-level privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- Recreate the safe view (security_invoker so it uses caller's RLS)
DROP VIEW IF EXISTS public.public_providers;
CREATE VIEW public.public_providers
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

-- Row policy: only anon (public unauthenticated browsing) gets access to
-- completed provider rows through the view. Signed-in users read their OWN
-- profile via the existing "Users can read own profile" policy; provider
-- browsing for signed-in users is served by server functions using the
-- publishable (anon) client, so this remains sufficient.
CREATE POLICY "Anon can view completed provider rows"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (type = 'provider' AND onboarding_status = 'complete');