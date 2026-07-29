# DoneToday Provider Services Enhancement

This extends the existing provider system — nothing gets removed. Existing `categories`, `service_subcategories`, `provider_categories`, `provider_subcategories`, `provider_verifications`, jobs, wallet, Stripe, admin flows all remain intact and keep working.

## 1. Database (single migration)

**Seed 25+ new categories** (Builder, Roofing, Flooring, Tiling, Plastering, Bricklaying, Windows & Doors, Kitchen Fitting, Bathroom Installation, Loft Conversions, Home Extensions, Driveways & Paving, Fencing, Decking, Landscaping, Tree Surgery, Pressure Washing, Gutter Cleaning, Appliance Repair, Locksmith, Pest Control, Heating & Gas, HVAC, CCTV & Security, Smart Home, Solar Panel Installation, EV Charger Installation, Other) — merged into existing `categories` via `ON CONFLICT (slug) DO NOTHING`. Existing 11 categories kept.

**Seed sub-services** for every category (Builder gets all 21 listed; Plumbing/Electrical/Gardening get the listed sets; other categories get sensible defaults) into existing `service_subcategories` with `ON CONFLICT DO NOTHING`.

**New tables** (all with GRANT + RLS + owner policies + updated_at triggers):
- `provider_services` — per-category pricing/experience: `provider_id, category_id, years_experience, experience_description, callout_fee, hourly_rate, minimum_job_price, emergency_available, inspection_available, is_active` (unique on `provider_id,category_id`).
- `provider_qualifications` — `provider_id, category_id, qualification_name, registration_number, issuing_body, issue_date, expiry_date, document_url, verification_status (pending/approved/rejected/expired), admin_notes`.
- `provider_service_areas` — `provider_id, category_id (nullable = all), postcode, radius_miles`.
- `provider_portfolio` — `provider_id, category_id, title, description, image_url`.
- `pending_category_requests` — for "Other" submissions: `provider_id, proposed_name, description, status`.

**Backfill**: for every row in `provider_categories`, insert a `provider_services` row with defaults (years_experience from profile, `is_active=true`) so existing providers work with no data loss.

**RLS**: providers manage only their own rows; public can read `is_active=true` provider_services + approved qualifications (name/body only, never document URLs); admins full access via `has_role`.

**Storage**: reuse existing `verifications` (private) bucket for qualification docs; reuse `job-images` for portfolio, or add `provider-portfolio` public bucket.

## 2. Server functions (`src/lib/onboarding.functions.ts` + new `src/lib/provider-services.functions.ts`)

- `getMyProviderServices()` — returns categories with per-cat pricing, qualifications, portfolio, areas.
- `upsertProviderService({ category_id, ...pricing, is_active })` — create/update/pause.
- `removeProviderService(category_id)` — deletes service + subs for that category.
- `upsertProviderSubcategories({ category_id, subcategory_ids })`.
- `addQualification`, `deleteQualification`, `addPortfolioItem`, `deletePortfolioItem`, `upsertServiceArea`, `deleteServiceArea`.
- `submitOtherCategory({ name, description })`.
- Admin: `adminListPendingQualifications`, `adminReviewQualification`, `adminListCategoryRequests`, `adminApproveCategoryRequest`, `adminCreateCategory`, `adminUpdateCategory`, `adminCreateSubcategory`.

Existing `getAvailableJobs` matching updated: providers only see jobs when they have that category selected AND (`is_active=true`) AND subcategory matches when job specifies one. No provider removal from existing feed if they had no per-cat toggle (defaults `is_active=true` via backfill).

## 3. UI

**Onboarding (`src/routes/_authenticated/onboarding.tsx`)** — extend the existing wizard, do not rewrite: enrich the existing "Services" step to show sub-services inline (already partially there); add an "Experience & Pricing" panel per selected category with the fields above; keep existing verification-doc step.

**Settings → Services (`src/routes/_authenticated/settings.tsx`)** — extend current editor:
- Existing multi-category + sub-service selector kept.
- For each selected category: pricing panel (call-out fee, hourly, min job), years/description, emergency/inspection toggles, pause switch, remove button.
- Qualifications section per category: list + add/delete with document upload to `verifications` bucket, shows verification status badge.
- Portfolio section per category: image upload + title/description.
- Service areas: postcode + radius per category (or global).
- "Add another trade" → opens the category picker.
- "Request new category (Other)" form.

**Provider public profile (`src/routes/providers.$providerId.tsx`)** — show per-category cards with sub-services, pricing, qualifications (approved only, no doc URLs), portfolio grid, badges, service areas.

**Customer post-job (`src/routes/_authenticated/post-job.tsx`)** — add sub-service dropdown (filtered by selected category), emergency checkbox, inspection-required checkbox. Persist on the existing `jobs` table (add `subcategory_id`, `emergency`, `inspection_required` columns in the same migration).

**Admin (`src/routes/_authenticated/admin.tsx`)** — new tabs:
- "Categories" — CRUD categories/sub-services, reorder, toggle active.
- "Qualifications" — approve/reject pending qualification docs.
- "Category requests" — approve "Other" submissions (creates a real category on approval).

## 4. Matching / notifications

Update `getAvailableJobs` in `src/lib/jobs.functions.ts` to filter by:
- Provider has `provider_services` row for job.category_id with `is_active=true`.
- If job.subcategory_id set: provider has matching `provider_subcategories`.
- Provider `is_available=true`, `account_status='active'`, not on holiday today.
- Qualification-required categories (Electrical, Heating & Gas, Gas): require `verification_status='approved'` qualification for that category before job appears. Enforced by a `category_requires_qualification` flag added to `categories`.

Notifications: no bulk notifier exists today; matching already scoped by feed. No behavior regression.

## 5. Security & migration safety

- Every new table: GRANT to authenticated + service_role, RLS on, policies scope to `auth.uid()`.
- Qualification document URLs never returned to non-admin non-owner queries — separate public view exposes only name/issuing_body/status.
- Backfill in same migration guarantees existing providers see no change.
- All new categories inserted with `ON CONFLICT (slug) DO NOTHING` — zero risk to existing data.

## Technical notes

- Migration is one big file; ordered: extend `categories` (add `requires_qualification bool`, `active bool default true`), extend `service_subcategories` (`active`, `description`), seed data, create new tables, backfill, extend `jobs` with `subcategory_id/emergency/inspection_required`, RLS/GRANT.
- No breaking changes to `src/integrations/supabase/types.ts` — will regenerate after migration.
- Estimated ~1 migration + ~6-8 file edits + 1-2 new files. I will implement in order: migration → server fns → settings UI → onboarding UI → post-job UI → provider profile UI → admin UI.

Approve to proceed.