// Batch "v3-c": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import commandBarMorph from "../items/command-bar-morph";
import searchPillMorph from "../items/search-pill-morph";
import iconMorph from "../items/icon-morph";
import squircleBadges from "../items/squircle-badges";

export const batch: AnyMotionDef[] = [commandBarMorph, searchPillMorph, iconMorph, squircleBadges];
