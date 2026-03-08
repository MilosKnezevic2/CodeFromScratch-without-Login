"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";

const orbs = [
  { size: 700, x: [10, 65, 20, 80, 10], y: [10, 50, 80, 20, 10], duration: 30, color: "accent" },
  { size: 600, x: [80, 25, 70, 15, 80], y: [20, 70, 35, 60, 20], duration: 35, color: "accent2" },
  { size: 550, x: [50, 85, 15, 60, 50], y: [70, 15, 50, 85, 70], duration: 25, color: "mixed" },
];

function Orb({
  size,
  xPath,
  yPath,
  duration,
  color,
}: {
  size: number;
  xPath: number[];
  yPath: number[];
  duration: number;
  color: string;
}) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration,
      ease: "linear",
      repeat: Infinity,
    });
    return controls.stop;
  }, [duration, progress]);

  const xPercent = useTransform(
    progress,
    xPath.map((_, i) => i / (xPath.length - 1)),
    xPath
  );
  const yPercent = useTransform(
    progress,
    yPath.map((_, i) => i / (yPath.length - 1)),
    yPath
  );

  const springX = useSpring(xPercent, { stiffness: 10, damping: 25, mass: 3 });
  const springY = useSpring(yPercent, { stiffness: 10, damping: 25, mass: 3 });

  const x = useTransform(springX, (v) => `${v}%`);
  const y = useTransform(springY, (v) => `${v}%`);

  const gradient =
    color === "accent"
      ? "radial-gradient(circle, var(--color-accent) 0%, transparent 60%)"
      : color === "accent2"
        ? "radial-gradient(circle, var(--color-accent-2) 0%, transparent 60%)"
        : "radial-gradient(circle, var(--color-accent) 0%, var(--color-accent-2) 40%, transparent 65%)";

  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: x,
        top: y,
        background: gradient,
        borderRadius: "50%",
        filter: `blur(${size * 0.2}px)`,
        transform: "translate(-50%, -50%)",
        willChange: "left, top",
      }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Floating orbs */}
      <div className="absolute inset-0 orb-layer">
        {orbs.map((orb, i) => (
          <Orb
            key={i}
            size={orb.size}
            xPath={orb.x}
            yPath={orb.y}
            duration={orb.duration}
            color={orb.color}
          />
        ))}
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
