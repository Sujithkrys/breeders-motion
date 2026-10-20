// Batch "new-a": new premium components built from the references. Owned by one builder.
import type { AnyMotionDef } from "../types";
import agentStateOrb from "../items/agent-state-orb";
import dotLoaders from "../items/dot-loaders";
import dockMenu from "../items/dock-menu";
import navPill from "../items/nav-pill";
import copyConfirmation from "../items/copy-confirmation";

export const batch: AnyMotionDef[] = [agentStateOrb, dotLoaders, dockMenu, navPill, copyConfirmation];
