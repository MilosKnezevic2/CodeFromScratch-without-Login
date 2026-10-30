"use client";

import { useEffect } from "react";
import { excludeThisDevice } from "@/lib/analytics/client";

/** The administrator's own reading must not inflate numbers this small. Renders nothing. */
export default function ExcludeDevice() {
  useEffect(() => {
    excludeThisDevice();
  }, []);
  return null;
}
