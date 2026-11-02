import SubscribeForm from "./SubscribeForm";

export default function NewsletterCTA() {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-8 text-center card-glow">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent">Free for subscribers</p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">
        Get The Production Checklist
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        24 checks to run before a web app meets real users, each linked to the article that shows the code.
        It arrives when you confirm your address; after that, one short email per new article.
      </p>
      <div className="mx-auto mt-4 max-w-sm">
        <SubscribeForm />
      </div>
    </section>
  );
}
