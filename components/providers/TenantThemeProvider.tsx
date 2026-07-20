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
  // { brand700, brand500, dark?: { brand700, brand500 } } | null | undefined
  const theme = useQuery(api.admin.myTheme);

  useEffect(() => {
    const root = document.documentElement;
    const clear = () => {
      for (const v of BRAND_VARS) root.style.removeProperty(v);
    };
    // Inline styles on the root win over the `.dark` CSS block, so we can't rely
    // on CSS specificity for the dark variant — we read the active mode and write
    // the mode-appropriate pair, re-running whenever the theme toggles.
    const apply = () => {
      if (!theme) return clear();
      const dark = root.classList.contains("dark");
      const pair = dark && theme.dark ? theme.dark : theme;
      root.style.setProperty("--brand-700", pair.brand700);
      root.style.setProperty("--brand-600", pair.brand500);
      root.style.setProperty("--brand-500", pair.brand500);
    };
    apply();
    window.addEventListener("bp:theme", apply);
    return () => {
      window.removeEventListener("bp:theme", apply);
      clear();
    };
  }, [theme]);

  return <>{children}</>;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <>{children}</>;
  return <ThemedInner>{children}</ThemedInner>;
}
