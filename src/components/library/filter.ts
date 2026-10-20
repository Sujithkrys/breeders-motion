import { CATEGORIES, categoryLabel, type CategoryId } from "@/motion/categories";
import { MOTIONS, isNew, motionsIn } from "@/motion/registry";
import type { AnyMotionDef } from "@/motion/types";
import { getCollection } from "./collections";
import type { LibraryView, SortOrder } from "./useLibraryState";

export const NEW_COUNT = MOTIONS.filter(isNew).length;

export const CATEGORY_COUNTS = Object.fromEntries(CATEGORIES.map((c) => [c.id, motionsIn(c.id).length])) as Record<
  CategoryId,
  number
>;

export const viewTitle = (view: LibraryView) => {
  if (view === "all") return "All components";
  if (view === "new") return "New this week";
  if (view === "saved") return "Saved";
  if (view.startsWith("col:")) return getCollection(view.slice(4))?.label ?? "Collection";
  return categoryLabel(view as CategoryId);
};

const inView = (def: AnyMotionDef, view: LibraryView, saved: string[]) => {
  if (view === "all") return true;
  if (view === "new") return isNew(def);
  if (view === "saved") return saved.includes(def.slug);
  if (view.startsWith("col:")) return getCollection(view.slice(4))?.match(def) ?? false;
  return def.category === view;
};

const searchText = (def: AnyMotionDef) =>
  [def.name, def.description, categoryLabel(def.category), ...def.tags].join(" ").toLowerCase();

export const filterMotions = (view: LibraryView, saved: string[], query: string, sort: SortOrder) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const list = MOTIONS.filter((def) => {
    if (!inView(def, view, saved)) return false;
    if (!terms.length) return true;
    const text = searchText(def);
    return terms.every((t) => text.includes(t));
  });
  // MOTIONS is already newest-first.
  return sort === "az" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
};
