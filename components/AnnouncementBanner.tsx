import Link from "next/link";
import type { Announcement } from "@/lib/settings/schema";

/** One line at the top of every public page, switched on from the portal. */
export default function AnnouncementBanner({ announcement }: { announcement: Announcement }) {
  if (!announcement.enabled || !announcement.text) return null;

  const external = announcement.linkUrl.startsWith("https://");
  const hasLink = Boolean(announcement.linkUrl && announcement.linkLabel);

  return (
    <div role="region" aria-label="Announcement" className="bg-accent text-accent-foreground">
      <p className="mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium">
        <span>{announcement.text}</span>
        {hasLink &&
          (external ? (
            <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {announcement.linkLabel}
            </a>
          ) : (
            <Link href={announcement.linkUrl} className="underline underline-offset-2">
              {announcement.linkLabel}
            </Link>
          ))}
      </p>
    </div>
  );
}
