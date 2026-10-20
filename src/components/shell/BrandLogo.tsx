import Link from "next/link";
import { FOCUS_RING } from "./ui";

// Emblem plus the name in type. The emblem's width attribute follows its viewBox (863×1015) to avoid layout shift.
export function BrandLogo({ wordmark = true, href = "/" }: { wordmark?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label="Breeders home" className={`flex items-center gap-2.5 rounded-md ${FOCUS_RING}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/emblem.svg" alt="" width={22} height={26} className="block h-[26px] w-auto" />
      {wordmark && (
        // Set as type (Geist medium, capitals, slightly open tracking) so it follows the theme via `text-ink`.
        <span aria-hidden className="text-[15px] leading-none font-medium tracking-[0.02em] text-ink uppercase">
          Breeders
        </span>
      )}
    </Link>
  );
}
