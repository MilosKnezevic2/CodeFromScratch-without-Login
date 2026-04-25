import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import SessionProvider from "../components/auth/SessionProvider";
import SavedPostsProvider from "../components/blog/SavedPostsProvider";
import ThemeProvider from "../components/ThemeProvider";
import JsonLd from "../components/seo/JsonLd";
import { organizationJsonLd } from "../lib/seo";
import LayoutShell from "../components/LayoutShell";
import CookieConsent from "../components/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: "CodeFromScratch",
    template: "%s | CodeFromScratch",
  },
  description: "Master web development from scratch with hands-on tutorials, in-depth guides, and premium resources.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    siteName: "CodeFromScratch",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "CodeFromScratch" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <CookieConsent />
        </SavedPostsProvider>
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
