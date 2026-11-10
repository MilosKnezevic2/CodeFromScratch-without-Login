import type { Metadata, ResolvingMetadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { getSettings } from "@/lib/settings/store";
import { withPageUrl } from "@/lib/seo";

// The form itself is a client component; this server wrapper exists so the
// route can carry its own metadata — a client page.tsx can't export any, and
// /contact is in the sitemap, so it was being indexed with the generic
// site-wide title and no canonical.
const METADATA: Metadata = {
  title: "Contact",
  description:
    "Questions, feedback, or a topic you want covered? Send a message — every email gets read and answered.",
};

export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return withPageUrl("/contact", METADATA, parent);
}

export default async function ContactPage() {
  const { general, features } = await getSettings();
  return <ContactPageClient contactEmail={general.contactEmail} social={features.showSocialLinks ? general.social : null} />;
}
