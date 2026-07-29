
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS working_days text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS working_hours jsonb NOT NULL DEFAULT '{"start":"09:00","end":"18:00"}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email":true,"sms":false,"push":true}'::jsonb;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_chk
  CHECK (account_status IN ('active','suspended','deleted'));

-- 2. Saved addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text,
  postcode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own addresses"
  ON public.customer_addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Category catalogue
UPDATE public.categories SET name = 'Painting and Decorating', slug = 'painting-decorating' WHERE slug = 'painting';
UPDATE public.categories SET name = 'Moving Help', slug = 'moving-help' WHERE slug = 'removals';
DELETE FROM public.categories WHERE slug = 'home-repairs';

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Furniture Assembly', 'furniture-assembly', 70),
  ('Rubbish Removal', 'rubbish-removal', 80),
  ('Window Cleaning', 'window-cleaning', 90)
ON CONFLICT (slug) DO NOTHING;
