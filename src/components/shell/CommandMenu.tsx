"use client";
import { Command } from "cmdk";
import { CornerDownLeft, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/prefs";
import { CATEGORIES, categoryLabel } from "@/motion/categories";
import { MOTIONS } from "@/motion/registry";
import { CATEGORY_ICONS } from "./category-icons";
import { OPEN_SEARCH_EVENT } from "./search-event";

const GROUP =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:uppercase";
const ITEM =
  "flex h-10 cursor-pointer items-center gap-3 rounded-[9px] px-2.5 text-sm text-ink-2 select-none data-[selected=true]:bg-sel data-[selected=true]:text-ink";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search the library"
      loop
      /* Ctrl+K is our open/close shortcut, so cmdk's vim-style Ctrl+K "move up" must not fire as well. */
      vimBindings={false}
      overlayClassName="fixed inset-0 z-50 bg-black/50"
      contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line-2 bg-panel text-ink shadow-[0_24px_64px_rgba(0,0,0,0.35)] outline-none"
      className="flex flex-col"
    >
      <div className="flex h-[52px] items-center gap-2.5 border-b border-line px-4 text-ink-3">
        <Search size={16} strokeWidth={2} aria-hidden />
        <Command.Input
          placeholder="Search components, categories and actions"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
        />
        <kbd className="rounded-[5px] border border-line-2 px-1.5 py-px font-sans text-[11px] text-ink-3">Esc</kbd>
      </div>

      <Command.List className="max-h-[min(440px,60vh)] scroll-py-2 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-10 text-center text-sm text-ink-3">No matches. Try another word.</Command.Empty>

        <Command.Group heading="Components" className={GROUP}>
          {MOTIONS.map((def) => (
            <Command.Item
              key={def.slug}
              value={`component ${def.slug}`}
              keywords={[def.name, categoryLabel(def.category), ...def.tags]}
              onSelect={() => run(() => router.push(`/components/${def.slug}`))}
              className={ITEM}
            >
              <span className="flex shrink-0 -space-x-1" aria-hidden>
                {(def.palettes[0]?.swatch ?? []).slice(0, 3).map((color, i) => (
                  <span key={i} className="size-2.5 rounded-full ring-2 ring-panel" style={{ background: color }} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{def.name}</span>
              <span className="shrink-0 text-xs text-ink-3">{categoryLabel(def.category)}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Categories" className={GROUP}>
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <Command.Item
                key={c.id}
                value={`category ${c.id}`}
                keywords={[c.label]}
                onSelect={() => run(() => router.push(`/?cat=${c.id}`))}
                className={ITEM}
              >
                <Icon size={16} strokeWidth={1.8} aria-hidden className="shrink-0" />
                <span className="flex-1 truncate">{c.label}</span>
              </Command.Item>
            );
          })}
        </Command.Group>

        <Command.Group heading="Actions" className={GROUP}>
          <Command.Item value="action theme" keywords={["theme", "dark", "light", "mode"]} onSelect={() => run(toggle)} className={ITEM}>
            {theme === "dark" ? <Sun size={16} strokeWidth={1.8} aria-hidden /> : <Moon size={16} strokeWidth={1.8} aria-hidden />}
            <span className="flex-1">{theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</span>
          </Command.Item>
        </Command.Group>
      </Command.List>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-ink-3" aria-hidden>
        <span className="flex items-center gap-1.5">
          <kbd className="font-sans">↑↓</kbd> to move
        </span>
        <span className="flex items-center gap-1.5">
          <CornerDownLeft size={12} strokeWidth={2} /> to open
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="font-sans">Esc</kbd> to close
        </span>
      </div>
    </Command.Dialog>
  );
}
