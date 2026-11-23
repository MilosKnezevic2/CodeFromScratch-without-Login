import type { ConversationStatus } from "@/lib/mailbox/conversations";

export const STATUS_STYLE: Record<ConversationStatus, string> = {
  new: "bg-accent text-accent-foreground",
  waiting: "border border-accent/50 text-accent",
  replied: "bg-surface-2 text-muted-foreground",
  done: "border border-border text-muted-foreground",
};
