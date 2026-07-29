
-- Extend categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS requires_qualification BOOLEAN NOT NULL DEFAULT false;

-- Extend service_subcategories
ALTER TABLE public.service_subcategories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.service_subcategories ADD COLUMN IF NOT EXISTS description TEXT;

-- Extend jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.service_subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS emergency BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS inspection_required BOOLEAN NOT NULL DEFAULT false;

-- Seed new categories
INSERT INTO public.categories (name, slug, icon, sort_order, requires_qualification) VALUES
  ('Builder / General Builder', 'builder', '🏗️', 1, false),
  ('Heating & Gas', 'heating-gas', '🔥', 30, true),
  ('Fencing', 'fencing', '🚧', 31, false),
  ('Decking', 'decking-cat', '🪵', 32, false),
  ('Landscaping', 'landscaping', '🌳', 33, false),
  ('Tree Surgery', 'tree-surgery', '🌲', 34, false),
  ('Gutter Cleaning', 'gutter-cleaning', '🏠', 35, false),
  ('Kitchen Fitting', 'kitchen-fitting-cat', '🍳', 36, false),
  ('Bathroom Installation', 'bathroom-installation', '🛁', 37, false),
  ('Loft Conversions', 'loft-conversions', '🏚️', 38, false),
  ('Home Extensions', 'home-extensions', '🏡', 39, false),
  ('Driveways & Paving', 'driveways-paving', '🛣️', 40, false),
  ('Window & Door Installation', 'windows-doors', '🚪', 41, false),
  ('Solar Panel Installation', 'solar-panel', '☀️', 42, true),
  ('EV Charger Installation', 'ev-charger', '🔌', 43, true)
ON CONFLICT (slug) DO NOTHING;

-- Mark existing categories that require qualification
UPDATE public.categories SET requires_qualification = true WHERE slug IN ('electrical');

-- Seed Builder sub-services
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('New builds', 'new-builds', 1),
  ('House extensions', 'house-extensions', 2),
  ('Loft conversions', 'loft-conversions-sub', 3),
  ('Garage conversions', 'garage-conversions', 4),
  ('Structural alterations', 'structural-alterations', 5),
  ('Internal wall removal', 'internal-wall-removal', 6),
  ('Foundations', 'foundations', 7),
  ('Brickwork', 'brickwork', 8),
  ('Blockwork', 'blockwork', 9),
  ('Concrete work', 'concrete-work', 10),
  ('Chimney repairs', 'chimney-repairs', 11),
  ('Internal renovations', 'internal-renovations', 12),
  ('External renovations', 'external-renovations', 13),
  ('General building maintenance', 'general-maintenance-b', 14),
  ('Property refurbishment', 'property-refurbishment', 15),
  ('Conservatories', 'conservatories', 16),
  ('Outbuildings', 'outbuildings', 17),
  ('Partition walls', 'partition-walls', 18),
  ('Damp repair', 'damp-repair-b', 19),
  ('Rendering', 'rendering-b', 20),
  ('Demolition work', 'demolition-work', 21)
) AS s(name, slug, ord)
WHERE c.slug = 'builder'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Seed Electrical additions
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Fault finding', 'fault-finding', 1),
  ('Socket installation', 'socket-installation', 2),
  ('Lighting installation', 'lighting-installation', 3),
  ('Fuse board replacement', 'fuse-board', 4),
  ('Rewiring', 'rewiring', 5),
  ('EV charger installation', 'ev-charger-sub', 6)
) AS s(name, slug, ord)
WHERE c.slug = 'electrical'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Heating & Gas sub-services
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Boiler installation', 'boiler-install', 1),
  ('Boiler repair', 'boiler-repair-hg', 2),
  ('Boiler servicing', 'boiler-servicing', 3),
  ('Gas safety certificate', 'gas-safety-cert', 4),
  ('Radiator installation', 'radiator-install', 5),
  ('Central heating', 'central-heating', 6)
) AS s(name, slug, ord)
WHERE c.slug = 'heating-gas'
ON CONFLICT (category_id, slug) DO NOTHING;

-- Fencing / Decking / Landscaping / Tree Surgery / Gutter Cleaning subs
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('New fence installation', 'new-fence', 1),
  ('Fence repair', 'fence-repair', 2),
  ('Gate installation', 'gate-install', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'fencing'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('New deck build', 'new-deck', 1),
  ('Deck repair', 'deck-repair', 2),
  ('Deck staining', 'deck-staining', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'decking-cat'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Garden design', 'garden-design', 1),
  ('Planting', 'planting-ls', 2),
  ('Turf laying', 'turf-laying', 3),
  ('Patio installation', 'patio-install', 4)
) AS s(name, slug, ord)
WHERE c.slug = 'landscaping'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Tree felling', 'tree-felling', 1),
  ('Tree pruning', 'tree-pruning-ts', 2),
  ('Stump removal', 'stump-removal', 3),
  ('Emergency callout', 'ts-emergency', 4)
) AS s(name, slug, ord)
WHERE c.slug = 'tree-surgery'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Gutter cleaning', 'gutter-cleaning-sub', 1),
  ('Gutter repair', 'gutter-repair-sub', 2),
  ('Downpipe unblock', 'downpipe-unblock', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'gutter-cleaning'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Full kitchen fit', 'full-kitchen', 1),
  ('Cabinet installation', 'cabinets', 2),
  ('Worktop installation', 'worktops', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'kitchen-fitting-cat'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Full bathroom install', 'full-bathroom', 1),
  ('Shower installation', 'shower-install', 2),
  ('Wet room', 'wet-room', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'bathroom-installation'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Dormer loft conversion', 'dormer', 1),
  ('Velux loft conversion', 'velux', 2),
  ('Full loft build', 'full-loft', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'loft-conversions'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Rear extension', 'rear-extension', 1),
  ('Side return', 'side-return', 2),
  ('Wrap-around extension', 'wrap-around', 3),
  ('Double-storey extension', 'double-storey', 4)
) AS s(name, slug, ord)
WHERE c.slug = 'home-extensions'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Block paving', 'block-paving', 1),
  ('Tarmac driveway', 'tarmac', 2),
  ('Gravel driveway', 'gravel', 3),
  ('Resin driveway', 'resin', 4)
) AS s(name, slug, ord)
WHERE c.slug = 'driveways-paving'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('uPVC windows', 'upvc-windows', 1),
  ('Aluminium windows', 'aluminium-windows', 2),
  ('Front door installation', 'front-door', 3),
  ('Bi-fold doors', 'bi-fold', 4)
) AS s(name, slug, ord)
WHERE c.slug = 'windows-doors'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Solar panel install', 'solar-install', 1),
  ('Battery storage', 'battery-storage', 2),
  ('Solar maintenance', 'solar-maintenance', 3)
) AS s(name, slug, ord)
WHERE c.slug = 'solar-panel'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.ord FROM public.categories c
CROSS JOIN (VALUES
  ('Home EV charger', 'home-ev', 1),
  ('Commercial EV charger', 'commercial-ev', 2)
) AS s(name, slug, ord)
WHERE c.slug = 'ev-charger'
ON CONFLICT (category_id, slug) DO NOTHING;

-- provider_services
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  years_experience INTEGER,
  experience_description TEXT,
  callout_fee NUMERIC(10,2),
  hourly_rate NUMERIC(10,2),
  minimum_job_price NUMERIC(10,2),
  emergency_available BOOLEAN NOT NULL DEFAULT false,
  inspection_available BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT SELECT ON public.provider_services TO anon;
GRANT ALL ON public.provider_services TO service_role;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active services" ON public.provider_services FOR SELECT USING (is_active = true);
CREATE POLICY "Providers manage own services" ON public.provider_services FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());
CREATE POLICY "Admins manage all services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_provider_services_updated_at BEFORE UPDATE ON public.provider_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- provider_qualifications
CREATE TABLE IF NOT EXISTS public.provider_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  qualification_name TEXT NOT NULL,
  registration_number TEXT,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected','expired')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_qualifications TO authenticated;
GRANT ALL ON public.provider_qualifications TO service_role;
ALTER TABLE public.provider_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage own qualifications" ON public.provider_qualifications FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());
CREATE POLICY "Admins manage all qualifications" ON public.provider_qualifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_provider_qualifications_updated_at BEFORE UPDATE ON public.provider_qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public safe view of approved qualifications (no document URLs)
CREATE OR REPLACE VIEW public.public_qualifications AS
SELECT id, provider_id, category_id, qualification_name, issuing_body, issue_date, expiry_date, verification_status
FROM public.provider_qualifications
WHERE verification_status = 'approved';
GRANT SELECT ON public.public_qualifications TO anon, authenticated;

-- provider_service_areas
CREATE TABLE IF NOT EXISTS public.provider_service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  postcode TEXT NOT NULL,
  radius_miles INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_service_areas TO authenticated;
GRANT SELECT ON public.provider_service_areas TO anon;
GRANT ALL ON public.provider_service_areas TO service_role;
ALTER TABLE public.provider_service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view service areas" ON public.provider_service_areas FOR SELECT USING (true);
CREATE POLICY "Providers manage own areas" ON public.provider_service_areas FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());
CREATE TRIGGER trg_provider_service_areas_updated_at BEFORE UPDATE ON public.provider_service_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- provider_portfolio
CREATE TABLE IF NOT EXISTS public.provider_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_portfolio TO authenticated;
GRANT SELECT ON public.provider_portfolio TO anon;
GRANT ALL ON public.provider_portfolio TO service_role;
ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view portfolio" ON public.provider_portfolio FOR SELECT USING (true);
CREATE POLICY "Providers manage own portfolio" ON public.provider_portfolio FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());

-- pending_category_requests
CREATE TABLE IF NOT EXISTS public.pending_category_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  proposed_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_category_requests TO authenticated;
GRANT ALL ON public.pending_category_requests TO service_role;
ALTER TABLE public.pending_category_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage own requests" ON public.pending_category_requests FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());
CREATE POLICY "Admins manage all requests" ON public.pending_category_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_pending_category_requests_updated_at BEFORE UPDATE ON public.pending_category_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill provider_services from existing provider_categories
INSERT INTO public.provider_services (provider_id, category_id, years_experience, is_active)
SELECT pc.provider_id, pc.category_id, p.years_experience, true
FROM public.provider_categories pc
LEFT JOIN public.profiles p ON p.user_id = pc.provider_id
ON CONFLICT (provider_id, category_id) DO NOTHING;
