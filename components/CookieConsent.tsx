"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 p-4 backdrop-blur-lg sm:p-5">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm text-muted sm:text-left">
          We use essential cookies for authentication. No tracking cookies.{" "}
          <a href="/privacy#cookies" className="text-accent hover:underline">Learn more</a>.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={decline}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent/30 hover:text-foreground"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="gradient-btn rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
