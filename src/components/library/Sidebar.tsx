"use client";
import { Bookmark, Compass, History, Search, Sparkles, X, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { CATEGORIES } from "@/motion/categories";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { CATEGORY_ICONS } from "@/components/shell/category-icons";
import { openSearch, useShortcutLabel } from "@/components/shell/search-event";
import { FOCUS_RING, SOON_CHIP } from "@/components/shell/ui";
import { COLLECTIONS } from "./collections";
import { CATEGORY_COUNTS, NEW_COUNT } from "./filter";
import type { LibraryView } from "./useLibraryState";

const SECTION_HEADING = "mb-1 px-2.5 text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase";

function NavButton({
  active = false,
  disabled = false,
  height = "h-9",
  leading,
  label,
  trailing,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  height?: string;
  leading: ReactNode;
  label: string;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-sm transition-colors ${height} ${FOCUS_RING} ${
        active
          ? "bg-sel font-semibold text-ink"
          : disabled
            ? "cursor-default font-medium text-ink-3"
            : "cursor-pointer font-medium text-ink-2 hover:bg-sel/60 hover:text-ink"
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

const icon = (Icon: LucideIcon) => <Icon size={17} strokeWidth={1.8} aria-hidden className="shrink-0" />;
const count = (n: number) => <span className="text-xs text-ink-3 tabular-nums">{n}</span>;

export function Sidebar({
  view,
  query,
  savedCount,
  onQueryChange,
  onSelectView,
  onClose,
}: {
  view: LibraryView;
  query: string;
  savedCount: number;
  onQueryChange: (q: string) => void;
  onSelectView: (view: LibraryView) => void;
  // Present when the sidebar is shown in the mobile sheet.
  onClose?: () => void;
}) {
  const searchId = useId();
  const shortcut = useShortcutLabel();

  return (
    <div className="flex min-h-full flex-col gap-[18px] px-3 py-4">
      <div className="flex items-center justify-between px-1.5 py-1">
        <BrandLogo />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`-my-1 flex size-9 cursor-pointer items-center justify-center rounded-[9px] text-ink-2 hover:bg-chip hover:text-ink ${FOCUS_RING}`}
          >
            <X size={18} strokeWidth={1.8} aria-hidden />
          </button>
        ) : (
          <span className="rounded-md bg-chip px-[7px] py-[3px] text-[11px] font-semibold text-ink-2">Library</span>
        )}
      </div>

      <div
        role="search"
        className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line bg-input pr-1.5 pl-2.5 text-[13px] text-ink-3 transition-colors focus-within:border-line-2 focus-within:ring-2 focus-within:ring-accent"
      >
        <label htmlFor={searchId} className="flex shrink-0 cursor-text">
          <Search size={15} strokeWidth={2} aria-hidden />
          <span className="sr-only">Search components</span>
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.preventDefault();
              onQueryChange("");
            }
          }}
          placeholder="Search components"
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="button"
          onClick={openSearch}
          aria-label="Open command menu"
          className={`shrink-0 cursor-pointer rounded-[5px] border border-line-2 px-1.5 py-px text-[11px] text-ink-3 transition-colors hover:text-ink ${FOCUS_RING}`}
        >
          {shortcut}
        </button>
      </div>

      <nav aria-label="Library" className="flex flex-col gap-px">
        <NavButton active={view === "all"} leading={icon(Compass)} label="Discover" onClick={() => onSelectView("all")} />
        <NavButton
          active={view === "new"}
          leading={icon(Sparkles)}
          label="New this week"
          onClick={() => onSelectView("new")}
          trailing={
            NEW_COUNT > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white tabular-nums">
                {NEW_COUNT}
              </span>
            ) : undefined
          }
        />
        <NavButton
          active={view === "saved"}
          leading={icon(Bookmark)}
          label="Saved"
          onClick={() => onSelectView("saved")}
          trailing={savedCount > 0 ? count(savedCount) : undefined}
        />
        <NavButton disabled leading={icon(History)} label="My exports" trailing={<span className={SOON_CHIP}>Soon</span>} />
      </nav>

      <nav aria-label="Categories" className="flex flex-col gap-px">
        <p className={SECTION_HEADING}>Categories</p>
        {CATEGORIES.map((c) => (
          <NavButton
            key={c.id}
            height="h-[34px]"
            active={view === c.id}
            leading={icon(CATEGORY_ICONS[c.id])}
            label={c.label}
            onClick={() => onSelectView(c.id)}
            trailing={count(CATEGORY_COUNTS[c.id])}
          />
        ))}
      </nav>

      <nav aria-label="Collections" className="flex flex-col gap-px">
        <p className={SECTION_HEADING}>Collections</p>
        {COLLECTIONS.map((c) => (
          <NavButton
            key={c.id}
            height="h-[34px]"
            active={view === `col:${c.id}`}
            leading={
              <span
                aria-hidden
                className="size-[18px] shrink-0 rounded-[5px]"
                style={{ background: `linear-gradient(135deg, ${c.swatch[0]}, ${c.swatch[1]})` }}
              />
            }
            label={c.label}
            onClick={() => onSelectView(`col:${c.id}`)}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5">
        <div className="rounded-xl border border-line bg-panel p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold">Brand kit</p>
            <span className={SOON_CHIP}>Soon</span>
          </div>
          <p className="mt-1 mb-3 text-xs leading-normal text-ink-2">Previews will play in your colours and font.</p>
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-[22px] rounded-md bg-accent" />
            <span className="size-[22px] rounded-md bg-ink" />
            <span className="size-[22px] rounded-md bg-[#22D3EE]" />
            <span className="ml-auto text-xs text-ink-2">Geist</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-1.5 py-1 text-xs">
          <span className="text-ink-3">New components every week</span>
          <a href="#changelog" className={`rounded font-medium text-accent-ink hover:underline ${FOCUS_RING}`}>
            Changelog
          </a>
        </div>
      </div>
    </div>
  );
}
