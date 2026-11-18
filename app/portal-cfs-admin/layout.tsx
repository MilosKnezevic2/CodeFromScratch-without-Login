// Admin pages read live operational data per request; they must never be
// prerendered at build time (the build environment has no database). The
// panel (sidebar, navigation) is the (panel) route group's layout; the
// Studio has its own full-screen layout.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
