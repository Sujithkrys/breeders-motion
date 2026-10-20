// Batch "new-c": new premium components built from the references. Owned by one builder.
import type { AnyMotionDef } from "../types";
import codeVerify from "../items/code-verify";
import modelWheel from "../items/model-wheel";
import explodedWireframe from "../items/exploded-wireframe";
import wireSheet from "../items/wire-sheet";

export const batch: AnyMotionDef[] = [codeVerify, modelWheel, explodedWireframe, wireSheet];
