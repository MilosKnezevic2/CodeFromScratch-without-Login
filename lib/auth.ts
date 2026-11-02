import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings/store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // 30 days, the length the privacy policy names for the sign-in cookie.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Google and GitHub only. Password sign-in was removed with the reader
  // relaunch: its reset flow could take over any account whose inbox was
  // reachable, and the providers already verify the email address.
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
  ],
  callbacks: {
    /**
     * The Settings switch closes sign-in itself, not only the /login page:
     * the provider routes under /api/auth stay reachable whatever the page
     * does. A banned reader cannot start a new session either.
     */
    async signIn({ user }) {
      if (!(await getSettings()).features.registrationOpen) return false;
      if (user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { banned: true } });
        if (existing?.banned) return false;
      }
      return true;
    },
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
        // A deleted or banned reader is signed out on their next request.
        if (!dbUser || dbUser.banned) return null;
        token.role = dbUser.role;
        token.plan = dbUser.subscription?.plan ?? "FREE";
        token.banned = dbUser.banned;
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
