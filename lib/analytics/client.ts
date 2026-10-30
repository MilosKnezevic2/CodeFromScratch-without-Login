import type { CollectEvent, GoalName } from "./events";

const NO_COUNT_KEY = "cfs-no-count";

function readNoCountFlag(): boolean {
  try {
    return window.localStorage.getItem(NO_COUNT_KEY) === "1";
  } catch {
    // Storage can be blocked. This flag only exists on the administrator's own device.
    return false;
  }
}

/** Marks the administrator's own device so their visits do not inflate small numbers. */
export function excludeThisDevice(): void {
  try {
    window.localStorage.setItem(NO_COUNT_KEY, "1");
  } catch {
    // Storage blocked: the login cookie still excludes this device while logged in.
  }
}

function canCount(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true || nav.doNotTrack === "1") return false;
  // Sanity's preview shows the site inside a frame; that is not a visit.
  if (window.top !== window.self) return false;
  return !readNoCountFlag();
}

export function sendAnalytics(event: CollectEvent): void {
  if (!canCount()) return;
  const url = "/api/analytics/collect";
  const body = JSON.stringify(event);
  // sendBeacon survives the page closing, which is when reading time is sent.
  if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
  fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => {
      // Statistics are best effort; a lost count must never disturb the reader.
    },
  );
}

/** Records that a reader did something that matters, on the page they did it from. */
export function trackGoal(name: GoalName): void {
  sendAnalytics({ type: "goal", name, path: window.location.pathname });
}
