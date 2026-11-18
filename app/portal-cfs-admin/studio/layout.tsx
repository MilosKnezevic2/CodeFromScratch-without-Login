import type { Metadata } from "next";
import { metadata as studioMetadata, viewport as studioViewport } from "next-sanity/studio";

// The Studio is a full-screen app of its own. It lives outside the admin
// panel's route group, so the panel's sidebar, padding and width limit never
// wrap it (inside them its toolbars and panes broke apart, 2026-11-18).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...studioMetadata, title: "Studio", robots: { index: false, follow: false } };
export const viewport = studioViewport;

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-hidden bg-background">{children}</div>;
}
