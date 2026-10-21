// Batch "v3-d": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import sortableList from "../items/sortable-list";
import kanbanMove from "../items/kanban-move";
import swipeNotifications from "../items/swipe-notifications";
import milestoneTimeline from "../items/milestone-timeline";

export const batch: AnyMotionDef[] = [sortableList, kanbanMove, swipeNotifications, milestoneTimeline];
