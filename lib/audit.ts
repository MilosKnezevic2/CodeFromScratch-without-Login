import { prisma } from "@/lib/prisma";

export type AuditDetail = Record<string, string | number | boolean | string[] | null>;

/**
 * One line per thing the administrator did, or tried to do. Never fatal: a
 * change that cannot be logged still goes through, and the error is printed.
 */
export async function recordAudit(action: string, detail?: AuditDetail, ip?: string | null): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: { action, detail: detail ?? undefined, ip: ip ?? undefined },
    });
  } catch (error) {
    console.error(`Audit log failed (${action}):`, error);
  }
}

export interface AuditEntry {
  id: string;
  action: string;
  detail: AuditDetail | null;
  ip: string | null;
  createdAt: Date;
}

export async function listAudit(limit = 50, actionPrefix?: string): Promise<AuditEntry[]> {
  try {
    const rows = await prisma.adminAuditLog.findMany({
      where: actionPrefix ? { action: { startsWith: actionPrefix } } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((row) => ({ ...row, detail: (row.detail as AuditDetail | null) ?? null }));
  } catch (error) {
    console.error("Audit log could not be read:", error);
    return [];
  }
}

/** The caller's address from the proxy header, for login and change records only. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length <= 64 ? ip : null;
}
