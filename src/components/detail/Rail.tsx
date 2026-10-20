"use client";
import { Bookmark, Compass, Search, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { CATEGORY_ICONS } from "@/components/shell/category-icons";
import { openSearch } from "@/components/shell/search-event";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { categoryLabel, type CategoryId } from "@/motion/categories";
import { FOCUS_RING, cx } from "./ui";

const RAIL_ITEM = `flex size-10 shrink-0 items-center justify-center rounded-[10px] transition-colors ${FOCUS_RING}`;

// Desktop: a 64px vertical rail. Under 1100px it lies down into a slim top bar.
export function Rail({ category }: { category: CategoryId }) {
  const items: { href: string; label: string; icon: LucideIcon; active: boolean }[] = [
    { href: "/", label: "Discover", icon: Compass, active: false },
    { href: "/?cat=new", label: "New", icon: Sparkles, active: false },
    { href: "/?cat=saved", label: "Saved", icon: Bookmark, active: false },
    { href: `/?cat=${category}`, label: categoryLabel(category), icon: CATEGORY_ICONS[category], active: true },
  ];

  return (
    <nav
      aria-label="Library"
      className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-side px-3 min-[1100px]:h-auto min-[1100px]:w-16 min-[1100px]:flex-col min-[1100px]:border-r min-[1100px]:border-b-0 min-[1100px]:px-0 min-[1100px]:py-3.5"
    >
      <div className="mr-2 flex size-10 shrink-0 items-center justify-center min-[1100px]:mr-0 min-[1100px]:mb-2.5">
        <BrandLogo wordmark={false} />
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            aria-current={item.active ? "true" : undefined}
            className={cx(RAIL_ITEM, item.active ? "bg-sel text-ink" : "text-ink-2 hover:bg-sel hover:text-ink")}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        );
      })}
      <span className="flex-1" />
      <button
        type="button"
        aria-label="Search components"
        title="Search (⌘K)"
        onClick={openSearch}
        className={cx(RAIL_ITEM, "text-ink-2 hover:bg-sel hover:text-ink")}
      >
        <Search size={17} strokeWidth={1.9} aria-hidden />
      </button>
      <ThemeToggle variant="icon" />
    </nav>
  );
}
