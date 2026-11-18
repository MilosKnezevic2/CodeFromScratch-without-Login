"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/** Sanity Studio across the whole screen, as it is designed to run. */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
