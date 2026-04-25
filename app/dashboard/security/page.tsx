import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MfaPanel from "@/components/dashboard/MfaPanel";

export const metadata = {
  title: "Security",
  description: "Two-factor authentication and account security",
};

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      mfaEnabled: true,
      mfaVerifiedAt: true,
      mfaBackupCodes: true,
      passwordHash: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <svg
            className="h-5 w-5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Security</h1>
          <p className="text-xs text-muted-foreground">
            Two-factor authentication and account protection
          </p>
        </div>
      </div>

      <MfaPanel
        initiallyEnabled={user.mfaEnabled}
        verifiedAt={user.mfaVerifiedAt?.toISOString() ?? null}
        backupCodesRemaining={user.mfaBackupCodes.length}
        hasPassword={Boolean(user.passwordHash)}
      />
    </div>
  );
}
