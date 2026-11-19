import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import WriterEditor from "@/components/writer/WriterEditor";
import { toBody } from "@/lib/writer/body";
import { currentAuthor, getOwnDraft } from "@/lib/writer/drafts";

export const metadata: Metadata = {
  title: "Writing",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

/** One draft in the editor. Only its author gets past here; a draft id alone opens nothing. */
export default async function WriteDraftPage({ params }: Props) {
  const author = await currentAuthor();
  if (!author) redirect("/login?callbackUrl=/dashboard/write");
  const draft = await getOwnDraft(author.id, (await params).id);
  if (!draft) notFound();
  return (
    <WriterEditor
      id={draft.id}
      initial={{ title: draft.title, excerpt: draft.excerpt, body: toBody(draft.body) }}
      status={draft.status}
      reviewNote={draft.reviewNote}
      authorName={author.name ?? "You"}
    />
  );
}
