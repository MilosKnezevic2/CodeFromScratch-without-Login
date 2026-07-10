import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

  return {
    rules: {
      userAgent: "*",
      // /api/og is carved out of the /api/* block — it serves the social/
      // search preview images, and a blocked image URL can't be indexed.
      allow: ["/", "/api/og"],
      disallow: [
        "/portal-cfs-admin",
        "/portal-cfs-admin/*",
        "/api/*",
        "/dashboard",
        "/dashboard/*",
        // Content-first launch: commerce + account surfaces are hidden from
        // navigation until the backend ships. Keep crawlers off them so the
        // index matches what the site actually offers. Remove on relaunch.
        "/ebooks",
        "/ebooks/*",
        "/courses",
        "/pricing",
        "/checkout",
        "/onboarding",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
