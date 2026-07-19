"use client";

/**
 * Runtime white-label theming (ROADMAP §5 theming seam / §9 · BRD §12-P —
 * "branding is configuration, not code"). A Platform Admin sets a contractor
 * org's brand (`convex/admin.ts` setContractorTheme); every user under that org
 * then renders with it here: we read the caller's tenant brand (`admin.myTheme`)
 * and override the `--brand-*` custom properties on the document root. Because
 * every component references the semantic tokens (never raw hex), overriding the
 * variables re-themes the whole app — the same mechanism as editing
 * `globals.css`, but per tenant at runtime.
 *
 * Convex-gated: with no deployment connected the app runs on the default palette
 * and this is a transparent pass-through (no `useQuery` without a client).
 */
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const BRAND_VARS = ["--brand-700", "--brand-600", "--brand-500"] as const;

function ThemedInner({ children }: { children: React.ReactNode }) {
  const theme = useQuery(api.admin.myTheme); // { brand700, brand500 } | null | undefined

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      // 700 is the CTA/active fill; 600 (link/accent text) + 500 (marks) take the
      // brighter accent so the whole scale moves together.
      root.style.setProperty("--brand-700", theme.brand700);
      root.style.setProperty("--brand-600", theme.brand500);
      root.style.setProperty("--brand-500", theme.brand500);
    } else {
      // null (no tenant brand) or undefined (loading) → the globals.css default.
      for (const v of BRAND_VARS) root.style.removeProperty(v);
    }
    return () => {
      for (const v of BRAND_VARS) root.style.removeProperty(v);
    };
  }, [theme]);

  return <>{children}</>;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <>{children}</>;
  return <ThemedInner>{children}</ThemedInner>;
}
