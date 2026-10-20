"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/prefs";
import { FOCUS_RING, SEGMENTED_GROUP, SEGMENT_BUTTON } from "./ui";

// The pressed look is driven by the `dark` class rather than React state, so the toggle is right on first paint
// (the theme script runs before hydration, while useTheme's server snapshot is always "dark").
export function ThemeToggle({ variant = "segmented" }: { variant?: "segmented" | "icon" }) {
  const { theme, setTheme, toggle } = useTheme();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        className={`flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-chip hover:text-ink ${FOCUS_RING}`}
      >
        <Sun size={17} strokeWidth={1.8} aria-hidden className="hidden dark:block" />
        <Moon size={17} strokeWidth={1.8} aria-hidden className="dark:hidden" />
      </button>
    );
  }

  return (
    <div role="group" aria-label="Theme" className={SEGMENTED_GROUP}>
      <button
        type="button"
        aria-label="Light theme"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={`${SEGMENT_BUTTON} w-[34px] bg-pill text-ink shadow-pill hover:text-ink dark:bg-transparent dark:text-ink-2 dark:shadow-none`}
      >
        <Sun size={15} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`${SEGMENT_BUTTON} w-[34px] bg-transparent text-ink-2 hover:text-ink dark:bg-pill dark:text-ink dark:shadow-pill`}
      >
        <Moon size={15} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
