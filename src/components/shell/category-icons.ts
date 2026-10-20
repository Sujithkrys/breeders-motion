import { ArrowRightLeft, Box, ChartColumn, Clapperboard, Hexagon, Layers, LayoutPanelTop, Type, type LucideIcon } from "lucide-react";
import type { CategoryId } from "@/motion/categories";

// Resolves the icon names in CATEGORIES to components; typed by CategoryId so a new category fails to compile here.
export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  templates: Clapperboard,
  text: Type,
  logo: Hexagon,
  ui: LayoutPanelTop,
  charts: ChartColumn,
  "3d": Box,
  transitions: ArrowRightLeft,
  backgrounds: Layers,
};
