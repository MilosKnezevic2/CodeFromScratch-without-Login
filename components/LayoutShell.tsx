"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import AnimatedBackground from "./AnimatedBackground";

export default function LayoutShell({
  children,
  banner,
  footer,
  accounts,
}: {
  children: React.ReactNode;
  banner: React.ReactNode;
  footer: React.ReactNode;
  accounts: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/portal-cfs-admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar accounts={accounts} />
      <main id="main-content" className="flex-1 pt-20">
        {banner}
        {children}
      </main>
      {footer}
    </>
  );
}
