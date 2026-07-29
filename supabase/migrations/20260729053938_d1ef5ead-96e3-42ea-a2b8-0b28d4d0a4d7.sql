INSERT INTO public.categories (name, slug, description, icon, base_price, sort_order)
VALUES ('Carpentry', 'carpentry', 'Bespoke woodwork, fittings, and repairs', 'Hammer', 45.00, 55)
ON CONFLICT (slug) DO NOTHING;