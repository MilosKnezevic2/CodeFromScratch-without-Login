import type { DocumentBadgeComponent } from "sanity";
import { calculateReadingTime } from "@/lib/reading-time";

const ReadingTimeBadge: DocumentBadgeComponent = (props) => {
  if (props.type !== "post") return null;
  const doc = (props.published ?? props.draft) as
    | { content?: unknown; readingTime?: number }
    | undefined;
  if (!doc) return null;

  const manual = typeof doc.readingTime === "number" ? doc.readingTime : 0;
  const blocks = Array.isArray(doc.content) ? doc.content : null;
  const computed = calculateReadingTime(blocks);
  const minutes = manual > 0 ? manual : computed;
  const isOverride = manual > 0 && manual !== computed;

  return {
    label: `${minutes} min read`,
    title: isOverride
      ? `Manual override (auto-computed: ${computed} min)`
      : "Auto-computed from content",
  };
};

export default ReadingTimeBadge;
