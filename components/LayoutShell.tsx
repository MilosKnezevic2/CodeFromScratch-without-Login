"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedBackground from "./AnimatedBackground";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/portal-cfs-admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main id="main-content" className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
