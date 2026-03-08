import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { preferences } = await request.json();

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscriber) {
    return NextResponse.json({ error: "Not subscribed" }, { status: 404 });
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { preferences },
  });

  return NextResponse.json({ message: "Preferences updated" });
}
