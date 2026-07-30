import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "./use-auth";
import {
  CUSTOMER_HOME,
  PROVIDER_HOME,
  PROVIDER_SETUP,
  homePathForUser,
  isProviderProfile,
  providerNeedsSetup,
} from "@/lib/role-routing";

const CUSTOMER_MODE_KEY = "dt-customer-mode";

export function isCustomerMode() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CUSTOMER_MODE_KEY) === "1";
}

export function setCustomerMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.sessionStorage.setItem(CUSTOMER_MODE_KEY, "1");
  else window.sessionStorage.removeItem(CUSTOMER_MODE_KEY);
}

/**
 * Keeps signed-in providers out of customer-only surfaces.
 * Returns true while a redirect is in flight so callers can render nothing.
 */
export function useBlockProvidersFromCustomerPages() {
  const { profile, roles, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const shouldRedirect =
    !isLoading && isAuthenticated && isProviderProfile(profile) && !isCustomerMode();

  useEffect(() => {
    if (!shouldRedirect) return;
    navigate({
      to: providerNeedsSetup(profile) ? PROVIDER_SETUP : PROVIDER_HOME,
      replace: true,
    });
  }, [shouldRedirect, profile, navigate]);

  return shouldRedirect;
}

/** Keeps non-providers out of the provider portal. */
export function useProviderOnly() {
  const { profile, roles, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isProvider = isProviderProfile(profile);
  const redirectTo =
    !isLoading && isAuthenticated && !isProvider ? homePathForUser(profile, roles) : null;

  useEffect(() => {
    if (!redirectTo) return;
    navigate({ to: redirectTo === CUSTOMER_HOME ? CUSTOMER_HOME : redirectTo, replace: true });
  }, [redirectTo, navigate]);

  return { isProvider, isLoading, redirecting: !!redirectTo };
}