"use client";

import { FormEvent, useState } from "react";
import { SOCIAL_LINKS } from "@/lib/config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, honeypot }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to send message.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setHoneypot("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="blog-particle absolute left-[20%] top-[35%]" style={{ animationDelay: "0s" }} />
          <div className="blog-particle absolute left-[50%] top-[55%]" style={{ animationDelay: "2s" }} />
          <div className="blog-particle absolute left-[80%] top-[30%]" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5">
            <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">Get in Touch</span>
          </div>
          <h1 className="animate-fade-up text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl" style={{ animationDelay: "0.05s" }}>
            Let&apos;s Build Something{" "}
            <span className="gradient-text">Together</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: "0.1s" }}>
            Have a question, feedback, or collaboration idea? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Success state */}
        {success ? (
          <div className="animate-fade-up -mt-8 mx-auto max-w-lg rounded-2xl border border-accent/20 bg-surface p-10 text-center" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.08)" }}>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Message Sent!</h2>
            <p className="mt-3 text-muted">
              Thank you for reaching out. We&apos;ll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="gradient-btn mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <div className="animate-fade-up -mt-8 grid gap-8 lg:grid-cols-5">
            {/* Contact form — takes 3 cols */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                <h2 className="text-xl font-bold text-foreground">Send a Message</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fill out the form below and we&apos;ll respond as soon as possible.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {/* Honeypot */}
                  <div className="hidden">
                    <label>
                      Website
                      <input
                        type="text"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>

                  {/* Name & Email row */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                        Name <span className="text-accent">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </span>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Your name"
                          className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                        Email <span className="text-accent">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </span>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-foreground">
                      Subject
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                      </span>
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="What's this about?"
                        className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-foreground">
                      Message <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={6}
                      placeholder="Tell us what's on your mind..."
                      className="w-full rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl gradient-btn px-6 py-3.5 text-sm font-bold transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar — takes 2 cols */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact info cards */}
              <div className="rounded-2xl border border-border bg-surface p-6" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contact Info</h3>
                <div className="mt-5 space-y-4">
                  <a href="mailto:office@codefromscratch.org" className="group flex items-center gap-4 rounded-xl border border-border bg-surface-2/30 p-4 transition hover:border-accent/30 hover:bg-accent/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition group-hover:bg-accent/20">
                      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold text-foreground transition group-hover:text-accent">office@codefromscratch.org</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/30 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold text-foreground">Graz, Austria</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/30 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Response Time</p>
                      <p className="text-sm font-semibold text-foreground">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="rounded-2xl border border-border bg-surface p-6" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Follow Us</h3>
                <div className="mt-4 flex gap-3">
                  {SOCIAL_LINKS.instagram && (
                    <a
                      href={SOCIAL_LINKS.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2/30 text-muted transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                      aria-label="Instagram"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                  {SOCIAL_LINKS.twitter && (
                    <a
                      href={SOCIAL_LINKS.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2/30 text-muted transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                      aria-label="X (Twitter)"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {SOCIAL_LINKS.pinterest && (
                    <a
                      href={SOCIAL_LINKS.pinterest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2/30 text-muted transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                      aria-label="Pinterest"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-2xl border border-border" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d43312.67689036728!2d15.399816!3d47.070714!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476e357da0e1a4a9%3A0xebf4e892f9d3b0ac!2s8020%20Graz%2C%20Austria!5e0!3m2!1sen!2sat!4v1700000000000!5m2!1sen!2sat"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
