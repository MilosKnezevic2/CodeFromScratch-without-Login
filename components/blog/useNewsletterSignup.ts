"use client";

import { useState } from "react";
import { trackGoal } from "@/lib/analytics/client";

export type SignupStatus = "idle" | "loading" | "success" | "error";

/** The newsletter sign-up shared by every form: email, honeypot, status and the server's message. */
export function useNewsletterSignup() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (res.ok) {
        setMessage(body?.message ?? "Check your inbox.");
        setStatus("success");
        trackGoal("signup");
        setEmail("");
      } else {
        setMessage(body?.error ?? "Something went wrong. Try again.");
        setStatus("error");
      }
    } catch {
      setMessage("Network error. Try again.");
      setStatus("error");
    }
  }

  return { email, setEmail, honeypot, setHoneypot, status, message, submit };
}
