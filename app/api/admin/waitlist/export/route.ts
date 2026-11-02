import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { csvCell } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const people = await prisma.courseWaitlist.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, confirmed: true, level: true, note: true, createdAt: true },
  });

  const rows = people.map((p) =>
    [p.email, "course", p.level, p.confirmed ? "confirmed" : "pending", p.note ?? "", p.createdAt.toISOString()]
      .map(csvCell)
      .join(","),
  );
  const csv = [`"email","list","level","status","note","signed_up"`, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
