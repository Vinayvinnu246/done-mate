
-- New top-level categories (idempotent)
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Appliance Repair', 'appliance-repair', 'wrench', 12),
  ('Roofing', 'roofing', 'home', 13),
  ('Flooring', 'flooring', 'layers', 14),
  ('Tiling', 'tiling', 'grid-3x3', 15),
  ('Plastering', 'plastering', 'paintbrush', 16),
  ('Locksmith', 'locksmith', 'key', 17),
  ('Pest Control', 'pest-control', 'bug', 18),
  ('HVAC / Heating & Cooling', 'hvac', 'thermometer', 19),
  ('Pressure Washing', 'pressure-washing', 'droplets', 20),
  ('Interior Design', 'interior-design', 'palette', 21),
  ('Home Renovation', 'home-renovation', 'hammer', 22),
  ('CCTV & Security', 'cctv-security', 'shield', 23),
  ('Smart Home Installation', 'smart-home', 'cpu', 24),
  ('Other', 'other', 'more-horizontal', 99)
ON CONFLICT (slug) DO NOTHING;

-- Helper CTE-based inserts for subcategories
WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.service_subcategories (category_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.sort_order FROM (VALUES
  -- Plumbing additions
  ('plumbing', 'Pipe installation', 'pipe-installation', 7),
  ('plumbing', 'Toilet repair', 'toilet-repair', 8),
  ('plumbing', 'Tap replacement', 'tap-replacement', 9),
  -- Appliance Repair
  ('appliance-repair', 'Washing machine repair', 'washing-machine', 1),
  ('appliance-repair', 'Dryer repair', 'dryer', 2),
  ('appliance-repair', 'Dishwasher repair', 'dishwasher', 3),
  ('appliance-repair', 'Fridge and freezer repair', 'fridge-freezer', 4),
  ('appliance-repair', 'Cooker and oven repair', 'cooker-oven', 5),
  -- Roofing
  ('roofing', 'Roof repair', 'roof-repair', 1),
  ('roofing', 'Roof replacement', 'roof-replacement', 2),
  ('roofing', 'Leak fixing', 'leak-fixing', 3),
  ('roofing', 'Gutter repair', 'gutter-repair', 4),
  ('roofing', 'Chimney repair', 'chimney-repair', 5),
  -- Flooring
  ('flooring', 'Laminate flooring', 'laminate', 1),
  ('flooring', 'Vinyl flooring', 'vinyl', 2),
  ('flooring', 'Hardwood flooring', 'hardwood', 3),
  ('flooring', 'Tile flooring', 'tile', 4),
  ('flooring', 'Carpet fitting', 'carpet', 5),
  -- Tiling
  ('tiling', 'Wall tiling', 'wall-tiling', 1),
  ('tiling', 'Floor tiling', 'floor-tiling', 2),
  ('tiling', 'Bathroom tiling', 'bathroom-tiling', 3),
  ('tiling', 'Kitchen splashback', 'kitchen-splashback', 4),
  ('tiling', 'Grout repair', 'grout-repair', 5),
  -- Plastering
  ('plastering', 'Skimming', 'skimming', 1),
  ('plastering', 'Rendering', 'rendering', 2),
  ('plastering', 'Ceiling repair', 'ceiling-repair', 3),
  ('plastering', 'Coving', 'coving', 4),
  ('plastering', 'Damp repair', 'damp-repair', 5),
  -- Locksmith
  ('locksmith', 'Emergency lockout', 'emergency-lockout', 1),
  ('locksmith', 'Lock change', 'lock-change', 2),
  ('locksmith', 'Lock repair', 'lock-repair', 3),
  ('locksmith', 'Security upgrade', 'security-upgrade', 4),
  ('locksmith', 'Key cutting', 'key-cutting', 5),
  -- Pest Control
  ('pest-control', 'Rodent control', 'rodents', 1),
  ('pest-control', 'Wasps and bees', 'wasps-bees', 2),
  ('pest-control', 'Bedbugs', 'bedbugs', 3),
  ('pest-control', 'Cockroaches', 'cockroaches', 4),
  ('pest-control', 'Ants', 'ants', 5),
  -- HVAC
  ('hvac', 'Boiler service', 'boiler-service', 1),
  ('hvac', 'Radiator installation', 'radiator-install', 2),
  ('hvac', 'AC installation', 'ac-install', 3),
  ('hvac', 'AC repair', 'ac-repair', 4),
  ('hvac', 'Ventilation', 'ventilation', 5),
  -- Pressure Washing
  ('pressure-washing', 'Driveway cleaning', 'driveway', 1),
  ('pressure-washing', 'Patio cleaning', 'patio', 2),
  ('pressure-washing', 'Decking cleaning', 'decking', 3),
  ('pressure-washing', 'Roof cleaning', 'roof-cleaning', 4),
  ('pressure-washing', 'Building facade', 'facade', 5),
  -- Interior Design
  ('interior-design', 'Design consultation', 'consultation', 1),
  ('interior-design', 'Full room design', 'room-design', 2),
  ('interior-design', 'Colour scheme', 'colour-scheme', 3),
  ('interior-design', 'Furniture selection', 'furniture-selection', 4),
  ('interior-design', 'Space planning', 'space-planning', 5),
  -- Home Renovation
  ('home-renovation', 'Kitchen renovation', 'kitchen-renovation', 1),
  ('home-renovation', 'Bathroom renovation', 'bathroom-renovation', 2),
  ('home-renovation', 'Loft conversion', 'loft-conversion', 3),
  ('home-renovation', 'Extension', 'extension', 4),
  ('home-renovation', 'Full house refurbishment', 'full-refurb', 5),
  -- CCTV & Security
  ('cctv-security', 'CCTV installation', 'cctv-install', 1),
  ('cctv-security', 'Alarm system', 'alarm', 2),
  ('cctv-security', 'Access control', 'access-control', 3),
  ('cctv-security', 'Video doorbell', 'video-doorbell', 4),
  ('cctv-security', 'Security lighting', 'security-lighting', 5),
  -- Smart Home
  ('smart-home', 'Smart lighting', 'smart-lights', 1),
  ('smart-home', 'Smart thermostat', 'smart-thermostat', 2),
  ('smart-home', 'Smart locks', 'smart-locks', 3),
  ('smart-home', 'Smart speakers', 'smart-speakers', 4),
  ('smart-home', 'Home automation', 'home-automation', 5)
) AS v(cat_slug, name, slug, sort_order)
JOIN cat c ON c.slug = v.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;
