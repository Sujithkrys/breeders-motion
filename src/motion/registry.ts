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
import { batch as v2a } from "./batches/v2-a";
import { batch as v2b } from "./batches/v2-b";
import { batch as v2c } from "./batches/v2-c";
import { batch as v2d } from "./batches/v2-d";
import { batch as v2e } from "./batches/v2-e";
import { batch as v2f } from "./batches/v2-f";
import { batch as newA } from "./batches/new-a";
import { batch as newB } from "./batches/new-b";
import { batch as newC } from "./batches/new-c";
import { batch as tplA } from "./batches/templates-a";
import { batch as tplB } from "./batches/templates-b";
import { batch as tplC } from "./batches/templates-c";
import { batch as tplD } from "./batches/templates-d";
import { batch as tplE } from "./batches/templates-e";
import { batch as tplF } from "./batches/templates-f";
import { batch as tplG } from "./batches/templates-g";
import { batch as tplH } from "./batches/templates-h";
import { batch as tplI } from "./batches/templates-i";
import { batch as tplJ } from "./batches/templates-j";
import { batch as tplK } from "./batches/templates-k";
import { batch as tplL } from "./batches/templates-l";
import { batch as tplM } from "./batches/templates-m";
import { batch as tplN } from "./batches/templates-n";
import { batch as tplO } from "./batches/templates-o";
import { batch as tplP } from "./batches/templates-p";
import { batch as tplQ } from "./batches/templates-q";
import { batch as tplR } from "./batches/templates-r";
import { batch as tplS } from "./batches/templates-s";
import { batch as tplT } from "./batches/templates-t";

export const MOTIONS: AnyMotionDef[] = [...core, ...text, ...logo, ...uiA, ...uiB, ...charts, ...three, ...transitions, ...v2a, ...v2b, ...v2c, ...v2d, ...v2e, ...v2f, ...newA, ...newB, ...newC, ...tplA, ...tplB, ...tplC, ...tplD, ...tplE, ...tplF, ...tplG, ...tplH, ...tplI, ...tplJ, ...tplK, ...tplL, ...tplM, ...tplN, ...tplO, ...tplP, ...tplQ, ...tplR, ...tplS, ...tplT].sort((a, b) =>
  b.addedAt.localeCompare(a.addedAt),
);

export const getMotion = (slug: string) => MOTIONS.find((m) => m.slug === slug);

export const motionsIn = (cat: CategoryId) => MOTIONS.filter((m) => m.category === cat);

// "New this week": added within 7 days of the newest component, so the badge stays meaningful between drops.
const newest = MOTIONS[0]?.addedAt ?? "1970-01-01";
const DAY = 86_400_000;
export const isNew = (m: AnyMotionDef) => Date.parse(newest) - Date.parse(m.addedAt) < 7 * DAY;
