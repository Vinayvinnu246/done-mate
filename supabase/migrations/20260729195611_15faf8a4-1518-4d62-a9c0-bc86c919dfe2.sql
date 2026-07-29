
DROP VIEW IF EXISTS public.public_qualifications;
CREATE VIEW public.public_qualifications WITH (security_invoker = true) AS
SELECT id, provider_id, category_id, qualification_name, issuing_body, issue_date, expiry_date, verification_status
FROM public.provider_qualifications
WHERE verification_status = 'approved';
GRANT SELECT ON public.public_qualifications TO anon, authenticated;
