"use client";

import dynamic from "next/dynamic";
import DraftModeIndicator from "./DraftModeIndicator";

/**
 * Sanity's visual-editing overlay is only wanted in draft mode, yet a static
 * import put its 100 KiB into every visitor's bundle. Loaded on demand here,
 * it reaches the browser only on the operator's preview.
 */
const VisualEditing = dynamic(() => import("./VisualEditing"), { ssr: false });

export default function DraftTools() {
  return (
    <>
      <DraftModeIndicator />
      <VisualEditing />
    </>
  );
}
