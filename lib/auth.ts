import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { LINK_MAX_AGE_S, linkAllowed, normalizeEmail, sendSignInLink } from "@/lib/email-sign-in";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings/store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // 30 days, the length the privacy policy names for the sign-in cookie.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login/check-email",
  },
  // Google, GitHub, or a one-time link sent to any email address (GMX, Yahoo,
  // Outlook, a private domain). No passwords: password sign-in was removed
  // because its reset flow could take over any account whose inbox was
  // reachable. One person is one account whichever way they sign in: the
  // providers below return addresses they have verified, so linking by email
  // is safe, and the email link proves the inbox itself.
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [GitHub({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    ...(process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? [Resend({
          from: process.env.EMAIL_FROM,
          apiKey: process.env.RESEND_API_KEY,
          maxAge: LINK_MAX_AGE_S,
          normalizeIdentifier: normalizeEmail,
          sendVerificationRequest: sendSignInLink,
        })]
      : []),
  ],
  callbacks: {
    /**
     * The Settings switch closes sign-in itself, not only the /login page:
     * the provider routes under /api/auth stay reachable whatever the page
     * does. A banned reader cannot start a new session either.
     */
    async signIn({ user, email }) {
      if (!(await getSettings()).features.registrationOpen) return false;
      // Asking for a sign-in link: cap how many go out (see lib/email-sign-in.ts).
      if (email?.verificationRequest && user.email && !(await linkAllowed(user.email))) {
        return "/login?error=TooManyLinks";
      }
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
        // An uploaded or removed profile picture shows in the header on the next request.
        token.picture = dbUser.image;
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
