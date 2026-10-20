import Link from "next/link";
import { BrandLogo } from "@/components/shell/BrandLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="flex h-16 items-center px-6">
        <BrandLogo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="text-[13px] font-medium text-ink-3 tabular-nums">404</p>
        <h1 className="mt-2 text-[34px] leading-tight font-semibold tracking-[-0.035em]">This page didn’t make the cut</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">
          The link may be old, or the component was renamed. Everything else is in the library.
        </p>
        <Link
          href="/"
          className="mt-6 flex h-10 items-center rounded-[10px] bg-btn px-4 text-sm font-semibold text-btn-ink transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Back to the library
        </Link>
      </main>
    </div>
  );
}
