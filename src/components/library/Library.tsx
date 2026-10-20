"use client";
import { Bookmark, SearchX, Sparkles } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo } from "react";
import { CommandMenu } from "@/components/shell/CommandMenu";
import { Segmented } from "@/components/shell/Segmented";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { FOCUS_RING } from "@/components/shell/ui";
import { useSaved, useStorageSync } from "@/lib/prefs";
import type { Ratio } from "@/motion/types";
import { EmptyState } from "./EmptyState";
import { filterMotions, viewTitle } from "./filter";
import { MobileNav } from "./MobileNav";
import { MotionCard } from "./MotionCard";
import { Sidebar } from "./Sidebar";
import { useLibraryState, type LibraryView, type SortOrder } from "./useLibraryState";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "az", label: "A–Z" },
];
const RATIO_OPTIONS: { value: Ratio; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

export function Library() {
  useStorageSync();
  const { view, sort, ratio, query, setView, setSort, setRatio, setQuery, clearQuery } = useLibraryState();
  const { saved, toggle: toggleSave } = useSaved();
  const deferredQuery = useDeferredValue(query);

  const items = useMemo(() => filterMotions(view, saved, deferredQuery, sort), [view, saved, deferredQuery, sort]);
  const title = viewTitle(view);
  const hasQuery = deferredQuery.trim().length > 0;

  const selectView = (next: LibraryView) => {
    setView(next);
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  };

  const sidebarProps = { view, query, savedCount: saved.length, onQueryChange: setQuery };

  return (
    <div className="min-h-dvh bg-bg text-ink min-[900px]:flex">
      <MobileNav
        renderSidebar={(close) => (
          <Sidebar
            {...sidebarProps}
            onClose={close}
            onSelectView={(next) => {
              close();
              selectView(next);
            }}
          />
        )}
      />

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r border-line bg-side min-[900px]:block">
        <Sidebar {...sidebarProps} onSelectView={selectView} />
      </aside>

      <main className="min-w-0 flex-1 px-4 pt-5 pb-14 min-[900px]:px-7 min-[900px]:pt-[22px]">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-[22px]">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3">
              <Link href="/" className={`rounded transition-colors hover:text-ink-2 ${FOCUS_RING}`}>
                Library
              </Link>
              <span aria-hidden> / </span>
              <span aria-current="page">{title}</span>
            </nav>
            <h1 className="mt-1.5 text-[28px] leading-tight font-semibold tracking-[-0.035em] min-[900px]:text-[34px]">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-2">
              {items.length} {items.length === 1 ? "component" : "components"} · click one to copy its prompt, code or edit it
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Sort" options={SORT_OPTIONS} value={sort} onChange={setSort} />
            <Segmented label="Aspect ratio" options={RATIO_OPTIONS} value={ratio} onChange={setRatio} />
            <ThemeToggle />
          </div>
        </div>

        {items.length > 0 ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${ratio === "9:16" ? 180 : 240}px, 1fr))` }}
          >
            {items.map((def) => (
              <MotionCard key={def.slug} def={def} ratio={ratio} saved={saved.includes(def.slug)} onToggleSave={toggleSave} />
            ))}
          </div>
        ) : hasQuery ? (
          <EmptyState
            icon={SearchX}
            title={`No components match “${deferredQuery.trim()}”`}
            body={
              view === "all"
                ? "Try a shorter word, or search by category like “charts” or “logo”."
                : `Nothing in ${title} matches. Try a shorter word, or clear the search to see everything here.`
            }
            actionLabel="Clear search"
            onAction={clearQuery}
          />
        ) : view === "saved" ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            body="Tap the bookmark on any component to keep it here. Saved components stay in this browser."
            actionLabel="Browse all components"
            onAction={() => selectView("all")}
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Nothing here yet"
            body="New components land every week. Browse the full library in the meantime."
            actionLabel="Browse all components"
            onAction={() => selectView("all")}
          />
        )}
      </main>

      <CommandMenu />
    </div>
  );
}
