
CREATE POLICY "Public can view verified providers"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (type = 'provider' AND onboarding_status = 'complete');

GRANT SELECT ON public.profiles TO anon;

CREATE POLICY "Public can view provider categories"
  ON public.provider_categories FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.provider_categories TO anon;
