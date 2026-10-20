"use client";
// Per-visitor preferences kept in localStorage: theme and saved components. Every read and write is guarded,
// because storage can be blocked (private windows, previews).
import { useCallback, useEffect, useSyncExternalStore } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
  emit();
};

// ---- theme
export type Theme = "dark" | "light";
const getTheme = (): Theme => (typeof document !== "undefined" && !document.documentElement.classList.contains("dark") ? "light" : "dark");

export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    write("breeders-theme", t);
  }, []);
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
};

// ---- saved components (slugs)
const SAVED_KEY = "breeders-saved";
let savedCache: string | null = null;
let savedList: string[] = [];
const getSaved = () => {
  const raw = read(SAVED_KEY) ?? "[]";
  if (raw !== savedCache) {
    savedCache = raw;
    try {
      savedList = JSON.parse(raw);
    } catch {
      savedList = [];
    }
  }
  return savedList;
};
const EMPTY: string[] = [];

export const useSaved = () => {
  const saved = useSyncExternalStore(subscribe, getSaved, () => EMPTY);
  const toggle = useCallback((slug: string) => {
    const cur = getSaved();
    write(SAVED_KEY, JSON.stringify(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }, []);
  return { saved, isSaved: (slug: string) => saved.includes(slug), toggle };
};

// Re-sync when another tab changes storage.
export const useStorageSync = () => {
  useEffect(() => {
    const on = () => emit();
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
};

// ---- clipboard with a fallback for blocked clipboard APIs
export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
