// Library categories, in sidebar order. `icon` is a lucide-react icon name resolved by the sidebar.
export const CATEGORIES = [
  { id: "text", label: "Text", icon: "Type" },
  { id: "logo", label: "Logo reveals", icon: "Hexagon" },
  { id: "ui", label: "UI elements", icon: "LayoutPanelTop" },
  { id: "charts", label: "Charts", icon: "ChartColumn" },
  { id: "3d", label: "3D", icon: "Box" },
  { id: "transitions", label: "Transitions", icon: "ArrowRightLeft" },
  { id: "backgrounds", label: "Backgrounds", icon: "Layers" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
