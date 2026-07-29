
-- Subcategories catalog
CREATE TABLE public.service_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);
GRANT SELECT ON public.service_subcategories TO anon, authenticated;
GRANT ALL ON public.service_subcategories TO service_role;
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subcategories are public" ON public.service_subcategories
  FOR SELECT TO anon, authenticated USING (true);

-- Provider subcategory selection
CREATE TABLE public.provider_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.service_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, subcategory_id)
);
GRANT SELECT, INSERT, DELETE ON public.provider_subcategories TO authenticated;
GRANT SELECT ON public.provider_subcategories TO anon;
GRANT ALL ON public.provider_subcategories TO service_role;
ALTER TABLE public.provider_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Provider subcategories public read" ON public.provider_subcategories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Providers manage own subcategories" ON public.provider_subcategories
  FOR ALL TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS home_address TEXT,
  ADD COLUMN IF NOT EXISTS trading_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS company_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_registered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS emergency_jobs BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_today BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS holiday_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS areas_covered TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

-- Extend verifications
ALTER TABLE public.provider_verifications
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- Seed subcategories
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order) VALUES
-- Gardening
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','Lawn mowing','lawn-mowing',1),
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','Hedge trimming','hedge-trimming',2),
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','Garden clearance','garden-clearance',3),
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','Tree pruning','tree-pruning',4),
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','Patio cleaning','patio-cleaning',5),
('6742ba35-b5dd-4459-9e3d-650032d9d2fd','General garden maintenance','general-maintenance',6),
-- Plumbing
('011fde7d-67c4-4634-80e4-973316f6ed37','Leak repair','leak-repair',1),
('011fde7d-67c4-4634-80e4-973316f6ed37','Blocked drains','blocked-drains',2),
('011fde7d-67c4-4634-80e4-973316f6ed37','Boiler repair','boiler-repair',3),
('011fde7d-67c4-4634-80e4-973316f6ed37','Tap and toilet installation','tap-toilet-install',4),
('011fde7d-67c4-4634-80e4-973316f6ed37','Bathroom installation','bathroom-install',5),
('011fde7d-67c4-4634-80e4-973316f6ed37','Emergency plumbing','emergency-plumbing',6),
-- Electrical
('8cfe6eae-be23-45c5-ba98-53051008ef99','Socket and switch installation','socket-switch',1),
('8cfe6eae-be23-45c5-ba98-53051008ef99','Light fittings','light-fittings',2),
('8cfe6eae-be23-45c5-ba98-53051008ef99','Fuse box replacement','fuse-box',3),
('8cfe6eae-be23-45c5-ba98-53051008ef99','Rewiring','rewiring',4),
('8cfe6eae-be23-45c5-ba98-53051008ef99','EV charger installation','ev-charger',5),
('8cfe6eae-be23-45c5-ba98-53051008ef99','Electrical safety check','safety-check',6),
-- Cleaning
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','Regular home cleaning','regular-home',1),
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','Deep cleaning','deep-clean',2),
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','End of tenancy','end-of-tenancy',3),
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','Oven cleaning','oven-cleaning',4),
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','Carpet cleaning','carpet-cleaning',5),
('5ac5e88c-d163-4562-aea3-045e8dbab0b8','Office cleaning','office-cleaning',6),
-- Handyman
('70642f8b-22ef-44b6-94b7-750177f31394','Shelf and picture hanging','shelf-hanging',1),
('70642f8b-22ef-44b6-94b7-750177f31394','Door repairs','door-repairs',2),
('70642f8b-22ef-44b6-94b7-750177f31394','Wall repairs','wall-repairs',3),
('70642f8b-22ef-44b6-94b7-750177f31394','TV mounting','tv-mounting',4),
('70642f8b-22ef-44b6-94b7-750177f31394','Small repairs','small-repairs',5),
-- Painting
('a82b7821-2d2b-45dd-923a-eb1b3b916216','Interior painting','interior',1),
('a82b7821-2d2b-45dd-923a-eb1b3b916216','Exterior painting','exterior',2),
('a82b7821-2d2b-45dd-923a-eb1b3b916216','Wallpapering','wallpapering',3),
('a82b7821-2d2b-45dd-923a-eb1b3b916216','Feature walls','feature-walls',4),
('a82b7821-2d2b-45dd-923a-eb1b3b916216','Woodwork and trim','woodwork',5),
-- Furniture assembly
('f3110b9d-213a-49da-b3c1-31efddf1d386','Flatpack assembly','flatpack',1),
('f3110b9d-213a-49da-b3c1-31efddf1d386','IKEA furniture','ikea',2),
('f3110b9d-213a-49da-b3c1-31efddf1d386','Wardrobe assembly','wardrobe',3),
('f3110b9d-213a-49da-b3c1-31efddf1d386','Bed frame assembly','bed-frame',4),
('f3110b9d-213a-49da-b3c1-31efddf1d386','Office desk assembly','office-desk',5),
-- Moving help
('276d35a3-28da-40a6-b82f-ba19db3e849c','Man with a van','man-van',1),
('276d35a3-28da-40a6-b82f-ba19db3e849c','Home removal','home-removal',2),
('276d35a3-28da-40a6-b82f-ba19db3e849c','Office move','office-move',3),
('276d35a3-28da-40a6-b82f-ba19db3e849c','Packing service','packing',4),
('276d35a3-28da-40a6-b82f-ba19db3e849c','Single item delivery','single-item',5),
-- Rubbish removal
('81bc523e-7c95-4960-851c-5cef057d4b5c','Household waste','household',1),
('81bc523e-7c95-4960-851c-5cef057d4b5c','Garden waste','garden-waste',2),
('81bc523e-7c95-4960-851c-5cef057d4b5c','Furniture disposal','furniture',3),
('81bc523e-7c95-4960-851c-5cef057d4b5c','Builders waste','builders',4),
('81bc523e-7c95-4960-851c-5cef057d4b5c','Fridge and appliance removal','appliance',5),
-- Window cleaning
('05539bc0-8538-46b5-aa8c-7b568dc293bf','Residential windows','residential',1),
('05539bc0-8538-46b5-aa8c-7b568dc293bf','Commercial windows','commercial',2),
('05539bc0-8538-46b5-aa8c-7b568dc293bf','Conservatory cleaning','conservatory',3),
('05539bc0-8538-46b5-aa8c-7b568dc293bf','Gutter cleaning','gutter',4),
-- Carpentry
('210845b0-d1fe-4a56-92a5-28509dbf59b0','Fitted wardrobes','fitted-wardrobes',1),
('210845b0-d1fe-4a56-92a5-28509dbf59b0','Kitchen fitting','kitchen-fitting',2),
('210845b0-d1fe-4a56-92a5-28509dbf59b0','Doors and skirting','doors-skirting',3),
('210845b0-d1fe-4a56-92a5-28509dbf59b0','Decking','decking',4),
('210845b0-d1fe-4a56-92a5-28509dbf59b0','Bespoke carpentry','bespoke',5);
