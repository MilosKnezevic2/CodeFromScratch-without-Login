"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";

export default function MobileSidebarDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent/30 hover:text-foreground md:hidden"
        aria-label="Open navigation menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        Menu
      </button>

      {open && (
        <>
          <div
            className="animate-fade-in-fast fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-slide-in-left fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background p-4 shadow-2xl md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Dashboard
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                aria-label="Close navigation menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div onClick={() => setOpen(false)}>
              <DashboardSidebar />
            </div>
          </div>
        </>
      )}
    </>
  );
}
