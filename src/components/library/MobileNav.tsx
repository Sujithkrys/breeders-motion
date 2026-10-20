"use client";
import { Menu, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { openSearch } from "@/components/shell/search-event";
import { FOCUS_RING } from "@/components/shell/ui";

const DESKTOP = "(min-width: 900px)";
const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
const ICON_BUTTON = `flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-chip hover:text-ink ${FOCUS_RING}`;

// Under 900px the sidebar becomes a top bar plus a left sheet holding the same sidebar.
export function MobileNav({ renderSidebar }: { renderSidebar: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const panelEl = panel.current;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelEl?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelEl) return;
      const items = Array.from(panelEl.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia(DESKTOP);
    const onResize = () => desktop.matches && setOpen(false);

    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-line bg-side/90 px-4 backdrop-blur-md min-[900px]:hidden">
        <BrandLogo />
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={openSearch} aria-label="Search components" className={ICON_BUTTON}>
            <Search size={18} strokeWidth={1.8} aria-hidden />
          </button>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="library-sheet"
            className={`-mr-2 ${ICON_BUTTON}`}
          >
            <Menu size={18} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </header>

      {/* Kept mounted so it can slide; `invisible` + `inert` take it out of focus and the accessibility tree. */}
      <div
        className={`fixed inset-0 z-50 transition-[visibility] duration-200 min-[900px]:hidden ${open ? "visible" : "invisible"}`}
        inert={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={close}
          aria-hidden
        />
        <div
          ref={panel}
          id="library-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Library menu"
          className={`absolute inset-y-0 left-0 w-[288px] max-w-[85vw] overflow-y-auto border-r border-line bg-side shadow-[0_24px_64px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebar(close)}
        </div>
      </div>
    </>
  );
}
