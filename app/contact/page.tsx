import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

// The form itself is a client component; this server wrapper exists so the
// route can carry its own metadata — a client page.tsx can't export any, and
// /contact is in the sitemap, so it was being indexed with the generic
// site-wide title and no canonical.
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions, feedback, or a topic you want covered? Send a message — every email gets read and answered.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
