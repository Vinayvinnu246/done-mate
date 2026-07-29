CREATE TABLE public.provider_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider_id, category_id)
);

GRANT SELECT, INSERT, DELETE ON public.provider_categories TO authenticated;
GRANT ALL ON public.provider_categories TO service_role;

ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage their own categories" ON public.provider_categories FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);