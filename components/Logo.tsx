import Link from "next/link";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-1 ${className}`}>
      <span className="font-mono text-lg font-bold text-accent opacity-70 transition group-hover:opacity-100">
        &lt;
      </span>
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        Code
      </span>
      <span className="text-lg font-extrabold tracking-tight gradient-text">
        FromScratch
      </span>
      <span className="font-mono text-lg font-bold text-accent opacity-70 transition group-hover:opacity-100">
        /&gt;
      </span>
    </Link>
  );
}
