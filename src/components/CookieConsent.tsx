import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "dt_cookie_consent_v1";

type Prefs = {
  essential: true;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  ts: number;
};

function save(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    save({ essential: true, analytics: true, preferences: true, marketing: true, ts: Date.now() });
    setVisible(false);
  };
  const rejectNonEssential = () => {
    save({ essential: true, analytics: false, preferences: false, marketing: false, ts: Date.now() });
    setVisible(false);
  };
  const savePrefs = () => {
    save({ essential: true, analytics, preferences, marketing, ts: Date.now() });
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">We use cookies</div>
            <p className="mt-1 text-xs text-muted-foreground">
              We use essential cookies to run DoneToday and optional cookies to improve your
              experience and measure how it's used. See our{" "}
              <Link to="/cookies" className="underline underline-offset-2 hover:text-foreground">
                Cookie Policy
              </Link>
              .
            </p>

            {managing && (
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
                <Row label="Essential" description="Required for the site to work." checked disabled />
                <Row
                  label="Preferences"
                  description="Remember your settings."
                  checked={preferences}
                  onChange={setPreferences}
                />
                <Row
                  label="Analytics"
                  description="Help us understand usage."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <Row
                  label="Marketing"
                  description="Personalise offers and ads."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 md:w-56">
            <button
              onClick={acceptAll}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Accept all
            </button>
            <button
              onClick={rejectNonEssential}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Reject non-essential
            </button>
            {managing ? (
              <button
                onClick={savePrefs}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Save preferences
              </button>
            ) : (
              <button
                onClick={() => setManaging(true)}
                className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Manage preferences
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3">
      <span>
        <span className="font-medium text-foreground">{label}</span>
        <span className="ml-2 text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary disabled:opacity-60"
      />
    </label>
  );
}