import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

type FeaturedImage = {
  asset: { _ref: string };
  alt?: string;
  caption?: string;
};

/**
 * Full-bleed-ish editorial cover image. Replaces the previous
 * glow-bordered card with overlay byline. Now: clean image + an
 * optional figcaption underneath in monospace meta type.
 */
export default function PostFeaturedImage({
  image,
  fallbackAlt,
}: {
  image: FeaturedImage;
  fallbackAlt: string;
}) {
  const url = urlFor(image).width(1600).quality(88).url();
  return (
    <figure className="my-12 sm:my-16">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={url}
          alt={image.alt || fallbackAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover"
          priority
        />
      </div>
      {image.caption && (
        <figcaption className="editorial-meta mt-3 text-center">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}
