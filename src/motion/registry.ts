// Every component in the library. Batches are split by owner so parallel work never edits the same file.
import type { AnyMotionDef } from "./types";
import type { CategoryId } from "./categories";
import { batch as core } from "./batches/core";
import { batch as text } from "./batches/text";
import { batch as logo } from "./batches/logo";
import { batch as uiA } from "./batches/ui-a";
import { batch as uiB } from "./batches/ui-b";
import { batch as charts } from "./batches/charts";
import { batch as three } from "./batches/3d";
import { batch as transitions } from "./batches/transitions";

export const MOTIONS: AnyMotionDef[] = [...core, ...text, ...logo, ...uiA, ...uiB, ...charts, ...three, ...transitions].sort((a, b) =>
  b.addedAt.localeCompare(a.addedAt),
);

export const getMotion = (slug: string) => MOTIONS.find((m) => m.slug === slug);

export const motionsIn = (cat: CategoryId) => MOTIONS.filter((m) => m.category === cat);

// "New this week": added within 7 days of the newest component, so the badge stays meaningful between drops.
const newest = MOTIONS[0]?.addedAt ?? "1970-01-01";
const DAY = 86_400_000;
export const isNew = (m: AnyMotionDef) => Date.parse(newest) - Date.parse(m.addedAt) < 7 * DAY;
