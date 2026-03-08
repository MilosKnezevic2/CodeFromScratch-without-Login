import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

interface AuthorCardProps {
  name: string;
  bio?: string;
  image?: { asset: { _ref: string } };
}

export default function AuthorCard({ name, bio, image }: AuthorCardProps) {
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
      </div>
    </div>
  );
}
