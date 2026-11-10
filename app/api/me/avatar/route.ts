import { NextResponse } from "next/server";
import { currentReader } from "@/lib/comments-store";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { AVATAR_MAX_BYTES, avatarPath, isUploadedAvatar, processAvatar } from "@/lib/reader/avatar";
import { removeUploadedAvatar } from "@/lib/reader/avatar-store";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Uploads a new profile picture (multipart field "file"). */
export async function POST(request: Request) {
  const reader = await currentReader();
  if (!reader) return json({ error: "Log in first." }, 401);
  if (!rateLimit(`avatar:${reader.id}`, 10, 60 * 60 * 1000).success) return json({ error: "That is a lot of pictures. Try again in an hour." }, 429);
  if (Number(request.headers.get("content-length") ?? 0) > AVATAR_MAX_BYTES + 64 * 1024) return json({ error: "Use a picture under 4 MB." }, 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "Choose a picture first." }, 400);
  const result = await processAvatar(Buffer.from(await file.arrayBuffer()));
  if (!result.ok) return json({ error: result.error }, 422);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: reader.id }, select: { image: true } });
  const data = new Uint8Array(result.data);
  const now = new Date();
  const image = avatarPath(reader.id, now);
  await prisma.$transaction([
    prisma.userAvatar.upsert({
      where: { userId: reader.id },
      // The first upload remembers the Google or GitHub picture, so "Remove" can put it back.
      create: { userId: reader.id, data, previousImage: isUploadedAvatar(user.image) ? null : user.image },
      update: { data },
    }),
    prisma.user.update({ where: { id: reader.id }, data: { image } }),
  ]);
  return json({ image });
}

/** Removes the uploaded picture and goes back to the one from Google or GitHub, if there was one. */
export async function DELETE() {
  const reader = await currentReader();
  if (!reader) return json({ error: "Log in first." }, 401);
  const { image } = await removeUploadedAvatar(reader.id);
  return json({ image });
}
