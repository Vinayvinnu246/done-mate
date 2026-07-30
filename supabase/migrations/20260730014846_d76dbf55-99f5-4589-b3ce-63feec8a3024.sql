DROP VIEW IF EXISTS public.public_providers;

CREATE VIEW public.public_providers
WITH (security_invoker = true)
AS
SELECT user_id,
       display_name,
       avatar_url,
       bio,
       years_experience,
       service_radius,
       verification_status,
       is_available
FROM public.profiles
WHERE type = 'provider'
  AND onboarding_status = 'complete'
  AND account_status = 'active'
  AND verification_status = 'verified';

GRANT SELECT ON public.public_providers TO anon, authenticated;