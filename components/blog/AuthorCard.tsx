import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

interface AuthorCardProps {
  name: string;
  bio?: string;
  image?: { asset: { _ref: string } };
  twitter?: string;
  github?: string;
  website?: string;
  linkedin?: string;
}

export default function AuthorCard({ name, bio, image, twitter, github, website, linkedin }: AuthorCardProps) {
  const hasSocial = twitter || github || website || linkedin;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface-2/50 p-5">
      {image?.asset ? (
        <Image
          src={urlFor(image).width(80).height(80).url()}
          alt={name}
          width={56}
          height={56}
          className="shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
          {name.charAt(0)}
        </span>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Written by
        </p>
        <p className="mt-0.5 text-base font-semibold text-foreground">{name}</p>
        {bio && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{bio}</p>
        )}
        {hasSocial && (
          <div className="mt-3 flex gap-2">
            {github && (
              <a href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-accent/40 hover:text-accent" aria-label="GitHub">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
            )}
            {twitter && (
              <a href={`https://x.com/${twitter}`} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-accent/40 hover:text-accent" aria-label="X (Twitter)">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {linkedin && (
              <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-accent/40 hover:text-accent" aria-label="LinkedIn">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-accent/40 hover:text-accent" aria-label="Website">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-4.247m0 0A8.966 8.966 0 013 12c0-1.97.633-3.792 1.708-5.274"/></svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
