import { prisma } from "@/lib/prisma";

/**
 * Deletes a reader's uploaded picture and puts back the Google or GitHub one
 * it replaced (none if there was none). Used by the reader's own "Remove
 * picture" and by the admin taking a picture down.
 */
export async function removeUploadedAvatar(userId: string): Promise<{ removed: boolean; image: string | null }> {
  const avatar = await prisma.userAvatar.findUnique({ where: { userId }, select: { previousImage: true } });
  if (!avatar) return { removed: false, image: null };
  await prisma.$transaction([
    prisma.userAvatar.delete({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { image: avatar.previousImage } }),
  ]);
  return { removed: true, image: avatar.previousImage };
}
