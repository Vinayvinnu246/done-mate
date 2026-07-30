/**
 * Central role-based navigation rules for DoneToday.
 * Customer -> customer marketplace, Provider -> provider dashboard, Admin -> admin.
 */

export const PROVIDER_HOME = "/provider/dashboard";
export const PROVIDER_SETUP = "/onboarding";
export const CUSTOMER_HOME = "/dashboard";
export const ADMIN_HOME = "/admin";

type MinimalProfile = {
  type?: string | null;
  onboarding_status?: string | null;
} | null | undefined;

export function isProviderProfile(profile: MinimalProfile) {
  return profile?.type === "provider";
}

export function providerNeedsSetup(profile: MinimalProfile) {
  return isProviderProfile(profile) && profile?.onboarding_status !== "complete";
}

/** Where an authenticated user should land after sign in / sign up. */
export function homePathForUser(profile: MinimalProfile, roles: string[] = []) {
  if (roles.includes("admin") || roles.includes("super_admin")) return ADMIN_HOME;
  if (isProviderProfile(profile)) {
    return providerNeedsSetup(profile) ? PROVIDER_SETUP : PROVIDER_HOME;
  }
  return CUSTOMER_HOME;
}

/** Customer-only surfaces a signed-in provider should never land on. */
const CUSTOMER_ONLY_PATHS = ["/providers", "/post-job", "/dashboard"];

export function isCustomerOnlyPath(pathname: string) {
  return CUSTOMER_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export type CompletionField = { label: string; done: boolean };

export function providerCompletionFields(profile: Record<string, any> | null | undefined): CompletionField[] {
  const p = profile ?? {};
  const cats = (p.provider_categories as unknown[] | undefined) ?? [];
  const docs = (p.provider_verifications as Array<{ document_type: string }> | undefined) ?? [];
  const hasDoc = (t: string) => docs.some((d) => d.document_type === t);

  return [
    { label: "Profile photo", done: !!p.avatar_url },
    { label: "Full name", done: !!p.display_name },
    { label: "Phone number", done: !!p.phone },
    { label: "Service categories", done: cats.length > 0 },
    { label: "Years of experience", done: typeof p.years_experience === "number" && p.years_experience >= 0 },
    { label: "Business description", done: !!p.bio },
    { label: "Postcode", done: !!p.postcode },
    { label: "Travel distance", done: !!p.service_radius },
    { label: "Working hours", done: Array.isArray(p.working_days) && p.working_days.length > 0 },
    { label: "Identity verification", done: hasDoc("id") || hasDoc("selfie") },
    { label: "Public liability insurance", done: hasDoc("insurance") },
  ];
}

export function providerCompletionPercent(profile: Record<string, any> | null | undefined) {
  const fields = providerCompletionFields(profile);
  if (fields.length === 0) return 0;
  return Math.round((fields.filter((f) => f.done).length / fields.length) * 100);
}