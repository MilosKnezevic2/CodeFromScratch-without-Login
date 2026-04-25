import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";

/**
 * Sanity Presentation tool → enable draft mode on this site.
 *
 * The Presentation plugin in Sanity Studio calls this route with a
 * signed, Sanity-issued token. `defineEnableDraftMode` verifies the
 * token against `NEXT_PUBLIC_SANITY_PROJECT_ID` and, on match, sets
 * the Next.js draft-mode cookie. The caller is then redirected to the
 * preview target URL supplied by Presentation.
 *
 * Requires a Sanity read token with permission to view drafts.
 * Configure `SANITY_API_READ_TOKEN` (server-only) in the environment.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_TOKEN,
  }),
});
