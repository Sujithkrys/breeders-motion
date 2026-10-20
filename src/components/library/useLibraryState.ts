"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, type CategoryId } from "@/motion/categories";
import type { Ratio } from "@/motion/types";
import { getCollection } from "./collections";

export type LibraryView = "all" | "new" | "saved" | CategoryId | `col:${string}`;
export type SortOrder = "new" | "az";

const RATIOS: Ratio[] = ["16:9", "9:16", "1:1"];
const SEARCH_DEBOUNCE_MS = 200;

const isCategory = (value: string): value is CategoryId => CATEGORIES.some((c) => c.id === value);

export const parseView = (raw: string | null): LibraryView => {
  if (!raw) return "all";
  if (raw === "all" || raw === "new" || raw === "saved" || isCategory(raw)) return raw;
  if (raw.startsWith("col:") && getCollection(raw.slice(4))) return raw as `col:${string}`;
  return "all";
};

type UrlState = { view: LibraryView; sort: SortOrder; ratio: Ratio; q: string };

// Library filters live in the URL (cat, sort, ratio, q) so a view can be shared. The search box is local state
// written to the URL after a short pause; `pendingQueries` remembers what we wrote so our own echoes coming back
// through useSearchParams are not mistaken for outside changes (back button, command menu) and don't clobber typing.
export function useLibraryState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const view = parseView(params.get("cat"));
  const sort: SortOrder = params.get("sort") === "az" ? "az" : "new";
  const ratioParam = params.get("ratio");
  const ratio: Ratio = RATIOS.find((r) => r === ratioParam) ?? "16:9";
  const urlQuery = params.get("q") ?? "";

  const [query, setQueryState] = useState(urlQuery);
  const pendingQueries = useRef<string[]>([]);
  const urlQueryRef = useRef(urlQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    urlQueryRef.current = urlQuery;
    const ours = pendingQueries.current.indexOf(urlQuery);
    if (ours >= 0) {
      pendingQueries.current.splice(0, ours + 1);
      return;
    }
    pendingQueries.current = [];
    clearTimeout(timer.current);
    setQueryState(urlQuery);
  }, [urlQuery]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const write = useCallback(
    (next: UrlState) => {
      clearTimeout(timer.current);
      const q = next.q.trim() ? next.q : "";
      if (q !== urlQueryRef.current) pendingQueries.current.push(q);
      const search = new URLSearchParams();
      if (next.view !== "all") search.set("cat", next.view);
      if (next.sort !== "new") search.set("sort", next.sort);
      if (next.ratio !== "16:9") search.set("ratio", next.ratio);
      if (q) search.set("q", q);
      const qs = search.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const current: UrlState = { view, sort, ratio, q: query };

  return {
    view,
    sort,
    ratio,
    query,
    setView: (v: LibraryView) => write({ ...current, view: v }),
    setSort: (s: SortOrder) => write({ ...current, sort: s }),
    setRatio: (r: Ratio) => write({ ...current, ratio: r }),
    setQuery: (q: string) => {
      setQueryState(q);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => write({ ...current, q }), SEARCH_DEBOUNCE_MS);
    },
    clearQuery: () => {
      setQueryState("");
      write({ ...current, q: "" });
    },
  };
}
