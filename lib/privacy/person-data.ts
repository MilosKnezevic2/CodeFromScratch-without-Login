import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Everything the site holds about one email address, for the two requests the
 * GDPR gives every reader: a copy of their data (article 15) and its erasure
 * (article 17). Tokens and password hashes are never part of the copy.
 */

export interface PersonSummary {
  email: string;
  subscriber: { confirmed: boolean; signedUpAt: Date; confirmedAt: Date | null } | null;
  waitlist: { confirmed: boolean; level: string; joinedAt: Date } | null;
  contactMessages: number;
  account: { name: string | null; createdAt: Date; role: string } | null;
}

export async function findPersonData(rawEmail: string): Promise<PersonSummary> {
  const email = rawEmail.trim().toLowerCase();
  const [subscriber, waitlist, contactMessages, account] = await Promise.all([
    prisma.newsletterSubscriber.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { confirmed: true, createdAt: true, confirmedAt: true },
    }),
    prisma.courseWaitlist.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { confirmed: true, level: true, createdAt: true },
    }),
    prisma.contactSubmission.count({ where: { email: { equals: email, mode: "insensitive" } } }),
    prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { name: true, createdAt: true, role: true } }),
  ]);
  return {
    email,
    subscriber: subscriber ? { confirmed: subscriber.confirmed, signedUpAt: subscriber.createdAt, confirmedAt: subscriber.confirmedAt } : null,
    waitlist: waitlist ? { confirmed: waitlist.confirmed, level: waitlist.level, joinedAt: waitlist.createdAt } : null,
    contactMessages,
    account: account ? { name: account.name, createdAt: account.createdAt, role: account.role } : null,
  };
}

export async function exportPersonData(rawEmail: string): Promise<Record<string, unknown>> {
  const email = rawEmail.trim().toLowerCase();
  const where = { email: { equals: email, mode: "insensitive" as const } };
  const [subscriber, waitlist, messages, account] = await Promise.all([
    prisma.newsletterSubscriber.findFirst({
      where,
      select: { email: true, confirmed: true, confirmedAt: true, preferences: true, createdAt: true, updatedAt: true },
    }),
    prisma.courseWaitlist.findFirst({ where, select: { email: true, confirmed: true, level: true, note: true, createdAt: true } }),
    prisma.contactSubmission.findMany({ where, select: { name: true, email: true, subject: true, message: true, createdAt: true } }),
    prisma.user.findFirst({
      where,
      select: {
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        interests: true,
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        savedPosts: { select: { postSlug: true, createdAt: true } },
        readingHistory: { select: { postSlug: true, scrollPercent: true, readAt: true } },
        reactions: { select: { postSlug: true, type: true, createdAt: true } },
        ebookPurchases: { select: { createdAt: true, ebook: { select: { title: true } } } },
      },
    }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    email,
    newsletter: subscriber,
    courseWaitlist: waitlist,
    contactMessages: messages,
    account,
  };
}

export interface ErasureCounts {
  subscriber: number;
  waitlist: number;
  contactMessages: number;
  account: number;
}

/** Removes every row for the address. Account removal cascades to its history. */
export async function erasePersonData(rawEmail: string): Promise<ErasureCounts> {
  const email = rawEmail.trim().toLowerCase();
  const where = { email: { equals: email, mode: "insensitive" as const } };
  const [subscriber, waitlist, contactMessages, account] = await prisma.$transaction([
    prisma.newsletterSubscriber.deleteMany({ where }),
    prisma.courseWaitlist.deleteMany({ where }),
    prisma.contactSubmission.deleteMany({ where }),
    prisma.user.deleteMany({ where }),
  ]);
  return { subscriber: subscriber.count, waitlist: waitlist.count, contactMessages: contactMessages.count, account: account.count };
}

/** A stable reference for the audit log that does not keep the address itself. */
export function emailReference(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 12);
}
