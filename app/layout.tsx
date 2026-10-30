import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { draftMode } from "next/headers";
// Exactly three families ship: Sen (display + body — humanist sans by
// Kosal Sen, warm soft-terminal letterforms, distinctive a + g), Geist
// Mono (tabular meta lines, code chrome), and Fraunces (the wordmark in
// Navbar/Footer — without this import the logo silently fell back to
// Georgia). Jakarta/Inter/JetBrains were declared but could never render
// (they sat below Sen/Geist in every stack), so they were removed.
import { Sen, Geist_Mono } from "next/font/google";
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
import SiteTracker from "@/components/analytics/SiteTracker";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/settings/store";

// next/font self-hosts the files (no request to Google at runtime) and emits
// a size-adjusted fallback face, so the swap from system font to Sen does not
// reflow the hero (it caused a 0.204 layout shift on mobile before).
const sen = Sen({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sen",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

/** Site-wide metadata. The name, description and share image are set in the portal. */
export async function generateMetadata(): Promise<Metadata> {
  const { general, seo } = await getSettings();
  const verification = seo.googleVerification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return {
    title: {
      default: general.siteName,
      template: `%s | ${general.siteName}`,
    },
    description: seo.defaultDescription,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org"),
    openGraph: {
      siteName: general.siteName,
      type: "website",
      images: [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: general.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      images: [seo.ogImageUrl],
      ...(seo.xHandle ? { site: seo.xHandle.startsWith("@") ? seo.xHandle : `@${seo.xHandle}` } : {}),
    },
    ...STATIC_METADATA,
    // Search Console ownership proof without touching DNS: paste the
    // content="..." value in the portal (SEO tab) or the env var. The tag
    // renders only while one of them is set.
    ...(verification && { verification: { google: verification } }),
  };
}

const STATIC_METADATA: Metadata = {
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
  const { general, features } = await getSettings();

  return (
    <html
      lang="en"
      className={`${sen.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
            <LayoutShell
              banner={<AnnouncementBanner announcement={general.announcement} />}
              footer={
                <Footer
                  siteName={general.siteName}
                  tagline={general.tagline}
                  contactEmail={general.contactEmail}
                  social={features.showSocialLinks ? general.social : null}
                />
              }
            >
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
          <SiteTracker />
        </SavedPostsProvider>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
