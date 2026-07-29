-- Switch view back to security_invoker so it obeys the caller's RLS.
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

-- Row-level policy: admit only completed provider rows for public reads.
CREATE POLICY "Public can view completed provider rows"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (type = 'provider' AND onboarding_status = 'complete');

-- Column-level: restrict anon/authenticated to safe columns only.
-- The owner still reads all columns via the "Users can read own profile" policy
-- because that policy targets authenticated and column grants apply per role;
-- so we also grant the safe columns to authenticated and rely on the owner
-- policy for the rest (owners run selects with the full column set they
-- already query via their own RLS policy which admits all columns for their row).
-- Note: column privileges gate columns; RLS gates rows. Both must pass.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  user_id,
  display_name,
  avatar_url,
  bio,
  years_experience,
  service_radius,
  verification_status,
  is_available,
  type,
  onboarding_status
) ON public.profiles TO anon, authenticated;

-- Owner needs full-column access; give authenticated SELECT on all columns
-- but rely on RLS ("Users can read own profile") to restrict rows to owner
-- for the sensitive columns. Column privileges are role-wide, so instead we
-- grant the sensitive PII columns to authenticated too, but the row policy
-- for anon+authenticated public reads only admits completed provider rows,
-- while the owner policy admits the owner's row. A signed-in non-owner
-- querying phone/date_of_birth/home_address of a provider will match the
-- public row policy (row admitted) AND have the column grant, exposing PII.
-- To prevent that, split: keep column grants MINIMAL for authenticated as
-- well, and route owner reads through a SECURITY DEFINER function.
GRANT SELECT (
  phone,
  business_name,
  postcode,
  working_days,
  working_hours,
  notification_preferences,
  date_of_birth,
  home_address,
  trading_name,
  business_type,
  company_number,
  vat_registered,
  vat_number,
  emergency_jobs,
  available_today,
  holiday_dates,
  areas_covered,
  service_radius,
  years_experience,
  verification_status,
  is_available,
  account_status,
  id,
  created_at,
  updated_at,
  avatar_url,
  bio,
  display_name,
  user_id,
  type,
  onboarding_status
) ON public.profiles TO service_role;

-- Provide a security-definer function for the owner to read their full profile.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;