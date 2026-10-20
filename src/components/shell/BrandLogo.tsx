import Link from "next/link";
import { FOCUS_RING } from "./ui";

// Both wordmarks are rendered and swapped by the `dark` class, so there is no flash before hydration.
// Width attributes follow the SVG viewBoxes (emblem 863×1015, wordmark 427×67) to avoid layout shift.
export function BrandLogo({ wordmark = true, href = "/" }: { wordmark?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label="Breeders home" className={`flex items-center gap-2.5 rounded-md ${FOCUS_RING}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/emblem.svg" alt="" width={22} height={26} className="block h-[26px] w-auto" />
      {wordmark && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-white.svg" alt="" width={70} height={11} className="hidden h-[11px] w-auto dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-ink.svg" alt="" width={70} height={11} className="block h-[11px] w-auto dark:hidden" />
        </>
      )}
    </Link>
  );
}
