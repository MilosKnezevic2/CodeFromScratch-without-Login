"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioPage() {
  return (
    <div className="mx-auto w-[90vw]">
      <NextStudio config={config} />
    </div>
  );
}
