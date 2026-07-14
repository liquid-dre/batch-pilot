import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";
import { Providers } from "./providers";
import { AppToaster } from "@/components/ui/Toaster";

/* Plus Jakarta Sans is a variable font — no explicit weights needed.
   The two IBM Plex families are static, so their weights are declared.
   Each exposes a CSS variable consumed by globals.css (--font-display etc.). */
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BatchPilot — clear decisions for every flock",
  description:
    "BatchPilot turns each day's raw poultry figures into auto-computed cumulatives, a clear status per house, and what to do next — for growers and contractors.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* Set the theme class before paint so there's no flash. Default is light; only
   a stored "dark" preference adds the class. Runs synchronously, top of body. */
const NO_FLASH = `(function(){try{if(localStorage.getItem('bp.theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
      >
        <body className="min-h-full">
          <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
          <Providers>{children}</Providers>
          <AppToaster />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
