# DoneToday Provider Portal — Phased Plan

The full spec is ~15 major feature areas. Building everything in one pass would produce shallow stubs. I'll ship it in 4 phases, each end-to-end functional, mobile-first, and reusing the existing navy/emerald DoneToday branding.

## What's already built (reuse, don't duplicate)
- Provider signup/login split (`/auth?role=provider`)
- Basic onboarding (`/onboarding`) — bio, categories, working days/hours, doc URLs
- Wallet with bank accounts + payout requests (`/wallet`)
- Jobs marketplace + quotes + messages + job detail
- Admin verification review
- Tables: `profiles`, `categories`, `provider_categories`, `provider_verifications`, `jobs`, `quotes`, `messages`, `customer_addresses`, `provider_bank_accounts`, `payout_requests`

## Phase 1 — Onboarding + Profile + Verification (this turn)

**DB**
- `service_subcategories` (category_id, name, slug)
- `provider_subcategories` (provider_id, subcategory_id)
- Extend `profiles`: `date_of_birth`, `home_address`, `trading_name`, `business_type` (sole_trader/limited), `company_number`, `vat_registered`, `vat_number`, `emergency_jobs`, `available_today`, `holiday_dates jsonb`, `areas_covered text[]`
- Extend `provider_verifications`: `rejected_reason`
- Seed subcategories for all 11 categories

**Files**
- `/onboarding` → rewrite as 6-step wizard (Personal / Business / Services / Area / Availability / Verification). Progress bar, back/next, saves per step.
- Real file uploads to `verifications` storage bucket (already exists) instead of URL paste.
- `/profile` → tabbed edit view (Public profile, Services, Availability, Notifications).
- `/verification` → standalone page showing document statuses (Not submitted / Under review / Verified / Rejected / Expired) with re-upload.
- New provider nav sidebar component used across all provider pages.

## Phase 2 — Matching Jobs + Quotes + Bookings (next turn)
- Server fn `getMatchingJobs` filtering by provider categories + subcategories + radius (postcode prefix) + availability + verification.
- Redacted job cards (partial postcode, no PII).
- Rich quote form (labour/materials/callout/VAT/duration/validity).
- Counter-offer table + flow.
- Bookings pipeline with status timeline.

## Phase 3 — Stripe Connect + Earnings (later)
- Replace mock wallet totals with real `provider_earnings` from completed bookings.
- Stripe Connect Express onboarding via `createServerFn` (needs `STRIPE_SECRET_KEY` — will request when we get here).
- Transaction history with commission breakdown.

## Phase 4 — Reviews + Disputes + Notifications (later)
- `reviews`, `disputes`, `support_tickets`, `notifications` tables.
- In-app notification bell + email hooks.
- Reputation stats (response rate, on-time %, etc.).

## What I'll do right now
Phase 1 only:
1. Migration for subcategories + extended profile/verification fields (with GRANTs + RLS).
2. Seed the ~50 subcategories.
3. Storage RLS on `verifications` bucket for provider-owned folders.
4. Rewrite `/onboarding` as a 6-step wizard with real file uploads.
5. New `/verification` page.
6. Extend `/profile` with the new fields.
7. Provider sidebar nav (Dashboard / Find Jobs / Quotes / Bookings / Messages / Earnings / Reviews / Profile / Verification / Settings / Support) — with "coming soon" states for Phase 2–4 pages so the nav is complete but honest.

After Phase 1 lands and you've tested it, say "phase 2" and I'll build matching + quotes + bookings.

## Notes
- Payouts stay as the current internal request flow until Phase 3 (Stripe Connect). No fake balances — wallet shows real payout data from `payout_requests`.
- Postcode-based matching in Phase 2 uses prefix matching (first outward code) — accurate geodistance needs a lat/lng geocoder, which I'll flag when we get there.
- All new tables use RLS scoped to `auth.uid()`.

Reply **"go phase 1"** to start, or tell me what to reorder / drop.
