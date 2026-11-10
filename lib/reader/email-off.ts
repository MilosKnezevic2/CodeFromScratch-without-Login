import { prisma } from "@/lib/prisma";
import type { EmailKind } from "./emails";

/** Turns one opt-in email off; a reader deleted meanwhile is simply gone. */
export async function turnEmailOff(userId: string, kind: EmailKind): Promise<void> {
  await prisma.user.updateMany({ where: { id: userId }, data: kind === "replies" ? { notifyReplies: false } : { weeklyReminder: false } });
}
