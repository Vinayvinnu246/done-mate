CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    base_price numeric(10,2) DEFAULT 0,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "Categories are public for authenticated" ON public.categories FOR SELECT TO authenticated USING (true);

CREATE TABLE public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    urgency text NOT NULL DEFAULT 'standard' CHECK (urgency IN ('standard', 'today', 'emergency')),
    status text NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'quoting', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
    budget_min numeric(10,2),
    budget_max numeric(10,2),
    scheduled_date timestamptz,
    address_line1 text,
    address_line2 text,
    city text,
    postcode text,
    lat numeric(10,7),
    lng numeric(10,7),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage their own jobs" ON public.jobs FOR ALL TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can view posted jobs" ON public.jobs FOR SELECT TO authenticated USING (status IN ('posted', 'quoting'));

CREATE TABLE public.quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    price numeric(10,2) NOT NULL,
    duration_minutes integer,
    message text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own quotes" ON public.quotes FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Customers can view quotes on their jobs" ON public.quotes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = quotes.job_id AND jobs.customer_id = auth.uid()));

CREATE TABLE public.provider_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('id', 'selfie', 'insurance', 'dbs', 'trade_licence', 'address_proof')),
    url text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    expiry_date timestamptz,
    notes text,
    reviewed_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_verifications TO authenticated;
GRANT ALL ON public.provider_verifications TO service_role;

ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own verification documents" ON public.provider_verifications FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS service_radius integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

CREATE OR REPLACE FUNCTION app_private.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION app_private.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION app_private.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION app_private.update_updated_at_column();
CREATE TRIGGER update_provider_verifications_updated_at BEFORE UPDATE ON public.provider_verifications FOR EACH ROW EXECUTE FUNCTION app_private.update_updated_at_column();

INSERT INTO public.categories (name, slug, description, icon, base_price, sort_order) VALUES
('Cleaning', 'cleaning', 'Domestic and commercial cleaning', 'SprayCan', 25.00, 1),
('Gardening', 'gardening', 'Gardens, lawns, and landscaping', 'Leaf', 35.00, 2),
('Plumbing', 'plumbing', 'Leaks, pipes, bathrooms, and kitchens', 'Wrench', 45.00, 3),
('Electrical', 'electrical', 'Wiring, fixtures, and safety checks', 'Zap', 50.00, 4),
('Handyman', 'handyman', 'General repairs and odd jobs', 'Hammer', 30.00, 5),
('Painting', 'painting', 'Interior and exterior painting', 'Paintbrush', 40.00, 6),
('Removals', 'removals', 'House and office moves', 'Truck', 60.00, 7),
('Home repairs', 'home-repairs', 'Doors, windows, and general home fixes', 'Home', 35.00, 8);