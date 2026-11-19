import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { currentAuthor, EDITABLE } from "@/lib/writer/drafts";
import { prisma } from "@/lib/prisma";
import { IMAGE_MAX_BYTES, sniffImage, uploadImage } from "@/lib/writer/sanity";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * An author's image for one of their own drafts that is still editable.
 * The file's type is read from its bytes (PNG, JPEG, WebP or GIF; never SVG),
 * it is renamed, and it goes to the Sanity media library through the server's
 * token; the author only gets back the asset id to place in the article.
 */
export async function POST(request: NextRequest) {
  // A form on another site cannot use the author's session to upload here.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return fail("This upload did not come from the editor.", 403);

  const author = await currentAuthor();
  if (!author) return fail("Log in with your author account to add images.", 401);
  if (!rateLimit(`writer-image:${author.id}`, 40, 60 * 60 * 1000).success) {
    return fail("That is a lot of images in one hour. Try again a little later.", 429);
  }

  const form = await request.formData().catch(() => null);
  const draftId = form?.get("draftId");
  const file = form?.get("file");
  if (typeof draftId !== "string" || !(file instanceof File)) return fail("Choose an image to upload.", 400);
  if (file.size > IMAGE_MAX_BYTES) return fail("The image is larger than 4 MB. Make it smaller and try again.", 413);

  const draft = await prisma.articleDraft.findFirst({
    where: { id: draftId, authorId: author.id, status: { in: [...EDITABLE] } },
    select: { id: true },
  });
  if (!draft) return fail("Images can be added only to your own draft while you are writing it.", 403);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return fail("Use a PNG, JPEG, WebP or GIF image.", 415);

  try {
    const ref = await uploadImage(bytes, kind, `${draft.id}-${randomBytes(4).toString("hex")}`);
    return NextResponse.json({ ref });
  } catch (error) {
    console.error("writer: image upload failed", error);
    return fail("The image could not be uploaded. Please try again in a minute.", 502);
  }
}
