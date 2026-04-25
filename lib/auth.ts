import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/credentials";
import { consumeBackupCode, verifyTotpCode } from "@/lib/services/mfa";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [GitHub({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        })]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA code", type: "text" },
        mfaType: { label: "MFA type", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await verifyPassword(email, password);
        if (!user) return null;

        if (user.mfaEnabled) {
          const mfaCode =
            typeof credentials?.mfaCode === "string"
              ? credentials.mfaCode.trim()
              : "";
          const mfaType =
            credentials?.mfaType === "backup" ? "backup" : "totp";

          if (!mfaCode || !user.mfaSecret) return null;

          if (mfaType === "backup") {
            const remaining = await consumeBackupCode(
              mfaCode,
              user.mfaBackupCodes,
            );
            if (!remaining) return null;
            await prisma.user.update({
              where: { id: user.id },
              data: { mfaBackupCodes: remaining },
            });
          } else {
            const ok = verifyTotpCode(user.mfaSecret, mfaCode);
            if (!ok) return null;
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      if (trigger === "update" && session) {
        token.name = session.name;
      }

      // Fetch role and plan on every token refresh
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { subscription: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.subscription?.plan ?? "FREE";
          token.banned = dbUser.banned;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create a FREE subscription for new OAuth users
      if (user.id) {
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, plan: "FREE", status: "ACTIVE" },
        });
      }
    },
  },
});
