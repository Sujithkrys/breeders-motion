import { Suspense } from "react";
import { Library } from "@/components/library/Library";

// The library reads its filters from the URL, so it renders on the client; this skeleton paints first.
function LibrarySkeleton() {
  return (
    <div className="flex min-h-screen bg-bg" aria-busy="true" aria-label="Loading library">
      <div className="hidden w-64 shrink-0 border-r border-line bg-side min-[900px]:block" />
      <div className="flex-1 px-7 py-6">
        <div className="h-4 w-40 rounded bg-chip" />
        <div className="mt-3 h-8 w-64 rounded-lg bg-chip" />
        <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="rounded-[14px] border border-line bg-card p-1.5">
              <div className="aspect-[16/10] rounded-[10px] bg-stage" />
              <div className="mx-1.5 mt-3 mb-2 h-3.5 w-28 rounded bg-chip" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <Library />
    </Suspense>
  );
}
