ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_provider_id_fkey;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.provider_verifications DROP CONSTRAINT IF EXISTS provider_verifications_provider_id_fkey;
ALTER TABLE public.provider_verifications ADD CONSTRAINT provider_verifications_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;