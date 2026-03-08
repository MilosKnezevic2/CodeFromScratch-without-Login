import type { ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const delayClass = delay > 0 ? `delay-${Math.round(delay * 1000)}` : "";
  return (
    <div
      className={`animate-fade-up ${delayClass} ${className || ""}`}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
