import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { draftMode } from "next/headers";
// Exactly three families ship: Sen (display + body — humanist sans by
// Kosal Sen, warm soft-terminal letterforms, distinctive a + g), Geist
// Mono (tabular meta lines, code chrome), and Fraunces (the wordmark in
// Navbar/Footer — without this import the logo silently fell back to
// Georgia). Jakarta/Inter/JetBrains were declared but could never render
// (they sat below Sen/Geist in every stack), so they were removed.
import "@fontsource-variable/sen";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/fraunces";
import "./globals.css";
import SessionProvider from "../components/auth/SessionProvider";
import SavedPostsProvider from "../components/blog/SavedPostsProvider";
import ThemeProvider from "../components/ThemeProvider";
import JsonLd from "../components/seo/JsonLd";
import { organizationJsonLd } from "../lib/seo";
import LayoutShell from "../components/LayoutShell";
import DraftModeIndicator from "../components/DraftModeIndicator";
import VisualEditing from "../components/VisualEditing";
// Cookieless first-party analytics + real-user Core Web Vitals. Both load
// from this origin (/_vercel/*), so the strict CSP needs no third-party
// exception and no consent banner is required.
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "CodeFromScratch",
    template: "%s | CodeFromScratch",
  },
  description: "A journal for serious web developers — tutorials, guides, and deep dives on modern web development, with production-grade code you can read in your own repo.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org"),
  openGraph: {
    siteName: "CodeFromScratch",
    type: "website",
    images: [
      {
        url: "/brand/og-default.png",
        width: 1200,
        height: 630,
        alt: "CodeFromScratch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-default.png"],
  },
  icons: {
    // Order matters — browsers pick the first compatible match.
    icon: [
      // Modern: SVG scales to any DPI, supports light/dark.
      { url: "/icon.svg", type: "image/svg+xml" },
      // PNG fallbacks at common pixel sizes for browsers without SVG support.
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS / iPadOS Safari home-screen icon.
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    // Windows Pinned Site / Edge tile.
    other: [
      {
        rel: "mask-icon",
        url: "/icon.svg",
        color: "#2dd4bf",
      },
    ],
  },
  manifest: "/site.webmanifest",
  // Search Console ownership proof without touching DNS: create a
  // "URL prefix" property in GSC, pick the "HTML tag" method, and paste
  // the content="..." value into this env var on Vercel. The tag renders
  // only while the variable is set.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
};

// themeColor lives on the viewport export in Next 13.4+ — controls the
// browser chrome colour on mobile Safari, Android Chrome, and PWA splash.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraft } = await draftMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ThemeProvider>
        <SessionProvider>
        <SavedPostsProvider>
          <div className="min-h-screen flex flex-col">
            <LayoutShell>
              {children}
            </LayoutShell>
          </div>
          <JsonLd data={organizationJsonLd()} />
          {/* CookieConsent intentionally unmounted for the content-first
              launch: the public surface sets no auth or tracking cookies, and
              essential cookies need no consent banner. Re-mount when the
              SaaS surfaces (login, payments) relaunch. */}
          {isDraft && (
            <>
              <DraftModeIndicator />
              <VisualEditing />
            </>
          )}
          <Analytics />
          <SpeedInsights />
        </SavedPostsProvider>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
