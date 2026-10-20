import type { AnyMotionDef } from "@/motion/types";

// Hand-picked shelves that cut across categories. `swatch` draws the small gradient tile in the sidebar.
export type Collection = {
  id: string;
  label: string;
  swatch: [string, string];
  match: (def: AnyMotionDef) => boolean;
};

export const COLLECTIONS: Collection[] = [
  {
    id: "launch-kit",
    label: "30s launch kit",
    swatch: ["#7C5CFF", "#0067FC"],
    match: (def) => def.category === "logo" || def.category === "transitions" || def.tags.includes("launch"),
  },
  {
    id: "product-ui",
    label: "Product UI",
    swatch: ["#22D3EE", "#0EA5A4"],
    match: (def) => def.category === "ui",
  },
  {
    id: "data-stories",
    label: "Data stories",
    swatch: ["#FBBF24", "#F97316"],
    match: (def) => def.category === "charts",
  },
];

export const getCollection = (id: string) => COLLECTIONS.find((c) => c.id === id);
