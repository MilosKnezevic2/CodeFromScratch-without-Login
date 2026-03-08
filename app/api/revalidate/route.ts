import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { _type, slug } = body;

    // Revalidate based on content type
    if (_type === "post") {
      revalidatePath("/blog");
      if (slug?.current) {
        revalidatePath(`/blog/${slug.current}`);
      }
    }

    if (_type === "ebook") {
      revalidatePath("/ebooks");
      if (slug?.current) {
        revalidatePath(`/ebooks/${slug.current}`);
      }
    }

    if (_type === "category") {
      revalidatePath("/blog");
    }

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
