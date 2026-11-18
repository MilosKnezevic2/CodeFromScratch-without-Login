/** How each draft status reads to people, on the author's desk and in the admin. */
export const STATUS_LABEL = {
  WRITING: { label: "Draft", tone: "bg-surface-2 text-muted-foreground" },
  IN_REVIEW: { label: "With the editor", tone: "bg-accent/12 text-accent" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "bg-yellow-500/12 text-yellow-600 dark:text-yellow-300" },
  APPROVED: { label: "Approved", tone: "bg-green-500/12 text-green-700 dark:text-green-300" },
} as const;

export type DraftStatusName = keyof typeof STATUS_LABEL;
