import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token: hashedToken },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token: hashedToken },
      },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
