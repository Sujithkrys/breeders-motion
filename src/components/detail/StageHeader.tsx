"use client";
import { Bookmark, Check, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import Link from "next/link";
import { categoryLabel } from "@/motion/categories";
import { isNew, motionsIn } from "@/motion/registry";
import type { AnyMotionDef } from "@/motion/types";
import { useSaved } from "@/lib/prefs";
import { FOCUS_RING, GHOST_BUTTON, ICON_BUTTON, cx } from "./ui";
import { useCopy } from "./useCopy";

type StageHeaderProps = {
  def: AnyMotionDef;
  // Query string to carry onto neighbours (keeps the open tab), without the leading "?".
  neighbourQuery: string;
  getShareUrl: () => string;
};

export function StageHeader({ def, neighbourQuery, getShareUrl }: StageHeaderProps) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(def.slug);
  const { copied, copy } = useCopy(1800);

  // Neighbours wrap within the category, in the library's own order.
  const siblings = motionsIn(def.category);
  const index = siblings.findIndex((m) => m.slug === def.slug);
  const hasNeighbours = siblings.length > 1 && index !== -1;
  const prev = hasNeighbours ? siblings[(index - 1 + siblings.length) % siblings.length] : null;
  const next = hasNeighbours ? siblings[(index + 1) % siblings.length] : null;
  const hrefFor = (m: AnyMotionDef) => `/components/${m.slug}${neighbourQuery ? `?${neighbourQuery}` : ""}`;
  const label = categoryLabel(def.category);

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
      {/* Full row on phones so the name never gets squeezed out by the actions. */}
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1 sm:gap-3">
        <Link
          href={`/?cat=${def.category}`}
          className={cx("flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] pr-2.5 pl-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sel hover:text-ink", FOCUS_RING)}
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden />
          {label}
        </Link>
        <span aria-hidden className="text-line-2">
          /
        </span>
        <h1 className="m-0 truncate text-[15px] font-semibold">{def.name}</h1>
        {isNew(def) && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {prev && next ? (
          <>
            <Link href={hrefFor(prev)} aria-label={`Previous: ${prev.name}`} title={`Previous: ${prev.name}`} className={ICON_BUTTON}>
              <ChevronLeft size={15} aria-hidden />
            </Link>
            <Link href={hrefFor(next)} aria-label={`Next: ${next.name}`} title={`Next: ${next.name}`} className={ICON_BUTTON}>
              <ChevronRight size={15} aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <button type="button" disabled aria-label="Previous component" className={ICON_BUTTON}>
              <ChevronLeft size={15} aria-hidden />
            </button>
            <button type="button" disabled aria-label="Next component" className={ICON_BUTTON}>
              <ChevronRight size={15} aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => toggle(def.slug)}
          className={cx(GHOST_BUTTON, saved ? "text-accent-ink" : "text-ink")}
        >
          <Bookmark size={14} strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden />
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" onClick={() => void copy(getShareUrl())} className={cx(GHOST_BUTTON, "text-ink")}>
          {copied ? <Check size={14} strokeWidth={2.25} aria-hidden /> : <Link2 size={14} aria-hidden />}
          <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
        </button>
      </div>
    </header>
  );
}
