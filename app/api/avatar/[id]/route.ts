import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serves an uploaded profile picture. The bytes were re-encoded on upload,
 * and the address carries a version, so a browser may keep it for a year.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return notFound();
  const avatar = await prisma.userAvatar.findUnique({ where: { userId: id }, select: { data: true, user: { select: { banned: true } } } });
  if (!avatar || avatar.user.banned) return notFound();
  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(avatar.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
