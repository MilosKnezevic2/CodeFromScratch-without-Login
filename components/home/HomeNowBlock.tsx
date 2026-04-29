/**
 * "What I'm working on now" — the Now-page philosophy
 * (https://nownownow.com). Surfaces current focus instead of
 * highlight-reel only; signals that the journal is alive and
 * being maintained. Three short bullet items.
 */
export default function HomeNowBlock() {
  const items = [
    {
      label: "Currently writing",
      body: "A four-part series on production-grade Next.js stacks — auth, payments, content, and observability.",
    },
    {
      label: "Currently building",
      body: "An admin operations playbook for solo developers, ships as part of the journal in May.",
    },
    {
      label: "Currently reading",
      body: "Designing Data-Intensive Applications, plus the Linear engineering blog and Lenny's interviews.",
    },
  ];
  return (
    <section
      aria-label="What I'm working on now"
      className="border-t border-border pt-12"
    >
      <header className="mb-8 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§</span>
        <h2 className="editorial-display text-3xl text-foreground sm:text-4xl">
          What I&rsquo;m working on now
        </h2>
        <span className="editorial-meta ml-auto">
          Updated {new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
        </span>
      </header>

      <ul className="grid gap-x-12 gap-y-6 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.label} className="border-t border-border pt-5">
            <p className="editorial-meta text-foreground">{item.label}</p>
            <p className="editorial-body mt-3 text-foreground">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
