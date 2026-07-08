import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";
import { Providers } from "./providers";

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
  themeColor: "#14487e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
      >
        <body className="min-h-full">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
