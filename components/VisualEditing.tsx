"use client";

import { enableVisualEditing } from "@sanity/visual-editing";
import { useEffect } from "react";

/**
 * Client-side wrapper that turns on Sanity Visual Editing overlays
 * (click-to-edit annotations, presentation comlink) when the page is
 * rendered inside draft mode. The root layout mounts this conditionally
 * on `draftMode().isEnabled`; when disabled, the component does not
 * render or subscribe.
 *
 * This is the App-Router replacement for `<VisualEditing />` from
 * `@sanity/visual-editing/next-pages-router`, which only works with
 * the Pages Router.
 */
export default function VisualEditing() {
  useEffect(() => {
    const disable = enableVisualEditing();
    return () => disable();
  }, []);
  return null;
}
