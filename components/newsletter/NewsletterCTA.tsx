import SubscribeForm from "./SubscribeForm";

export default function NewsletterCTA() {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-8 text-center card-glow">
      <h2 className="text-lg font-semibold text-foreground">
        Stay up to date
      </h2>
      <p className="mt-1 text-sm text-muted">
        Get new articles and tutorials delivered straight to your inbox.
      </p>
      <div className="mx-auto mt-4 max-w-sm">
        <SubscribeForm />
      </div>
    </section>
  );
}
