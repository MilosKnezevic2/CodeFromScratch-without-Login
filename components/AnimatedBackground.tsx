export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Floating orbs — pure CSS, no JS, no framer-motion */}
      <div className="absolute inset-0 orb-layer">
        <div
          className="orb orb-1"
          style={{
            width: 700,
            height: 700,
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 60%)",
          }}
        />
        <div
          className="orb orb-2"
          style={{
            width: 600,
            height: 600,
            background: "radial-gradient(circle, var(--color-accent-2) 0%, transparent 60%)",
          }}
        />
        <div
          className="orb orb-3"
          style={{
            width: 550,
            height: 550,
            background: "radial-gradient(circle, var(--color-accent) 0%, var(--color-accent-2) 40%, transparent 65%)",
          }}
        />
      </div>

      {/* Soft edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, var(--color-background) 85%)",
        }}
      />
    </div>
  );
}
