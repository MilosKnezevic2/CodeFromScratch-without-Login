"use client";

import { FormEvent, useState } from "react";
import SocialLinks from "@/components/SocialLinks";
import type { SocialLinks as Links } from "@/lib/settings/schema";

export default function ContactPageClient({ contactEmail, social }: { contactEmail: string; social: Links | null }) {
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
            <div className="min-w-0 lg:col-span-3">
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
                        tabIndex={-1}
                        autoComplete="off"
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
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Your name"
                          className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-base text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
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
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-base text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
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
                        className="w-full rounded-xl border border-border bg-surface-2/50 py-3 pl-10 pr-4 text-base text-foreground placeholder-muted-foreground transition focus:border-accent focus:bg-surface-2 focus:ring-1 focus:ring-accent focus:outline-none"
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
            <div className="min-w-0 space-y-6 lg:col-span-2">
              {/* Contact info cards */}
              <div className="rounded-2xl border border-border bg-surface p-6" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contact Info</h3>
                <div className="mt-5 space-y-4">
                  <a href={`mailto:${contactEmail}`} className="group flex items-center gap-4 rounded-xl border border-border bg-surface-2/30 p-4 transition hover:border-accent/30 hover:bg-accent/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition group-hover:bg-accent/20">
                      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold text-foreground transition group-hover:text-accent">{contactEmail}</p>
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
              {social && (
                <div className="rounded-2xl border border-border bg-surface p-6" style={{ boxShadow: "0 0 60px rgba(45, 212, 191, 0.04)" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Follow Us</h3>
                  <div className="mt-4">
                    <SocialLinks links={social} size="md" />
                  </div>
                </div>
              )}

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
