"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  confirmed: number;
}

export default function AdminNewsletterPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0 });
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((data) => setStats({
        total: data.newsletterTotal || 0,
        confirmed: data.newsletterConfirmed || 0,
      }));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Send this campaign to all confirmed subscribers?")) return;

    setSending(true);
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, htmlBody }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Campaign sent to ${data.sentCount} subscribers!`);
      setSubject("");
      setHtmlBody("");
    } else {
      setMessage(data.error || "Failed to send");
    }
    setSending(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total Subscribers</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.confirmed}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Send Campaign</h2>

        {message && (
          <div className="mb-4 rounded-lg bg-accent/10 border border-accent/20 p-3 text-sm text-accent">{message}</div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted">HTML Body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              required
              rows={10}
              className="mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
