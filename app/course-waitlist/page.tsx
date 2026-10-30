import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import { getSettings } from "@/lib/settings/store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "Course Waitlist",
  description:
    "A course on building and shipping real web apps is being considered. Tell me your level and I will email you once, when it opens.",
  alternates: { canonical: `${SITE_URL}/course-waitlist` },
};

export default async function CourseWaitlistPage() {
  const { features } = await getSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <p className="editorial-meta text-muted-foreground">Course waitlist</p>
      <h1 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
        A course that builds real things
      </h1>
      <p className="post-standfirst mt-5">
        The articles here teach one idea at a time. A course would go further:
        whole projects, built from an empty folder to something you can put
        online. It is not made yet, and I do not want to build it for nobody.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        So this list is a question. If enough people want it, I will make it,
        and I will start at the level most of you pick. There is no date and no
        price yet. I will email you once, when there is something real to show.
        Nothing is sold here.
      </p>

      <div className="mt-10">
        {features.courseWaitlistOpen ? (
          <WaitlistForm />
        ) : (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
            The list is closed for now. Subscribe to the newsletter and you will hear when it opens again.
          </p>
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Your email, level and note are used only to tell you when the course
        opens and to decide what to build first. You get one confirmation email
        first and nothing until you click it. You can remove yourself at any
        time with the link in that email, and everything is deleted. Details in
        the{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
