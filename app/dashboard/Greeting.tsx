"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "Good evening" by the reader's own clock; the server, which does not know it, says "Welcome back". */
export default function Greeting({ firstName }: { firstName: string | null }) {
  const part = useSyncExternalStore(
    subscribe,
    () => {
      const h = new Date().getHours();
      return h < 5 ? "Welcome back" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    },
    () => "Welcome back",
  );
  return (
    <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
      {part}
      {firstName ? `, ${firstName}` : ""}
    </h1>
  );
}
