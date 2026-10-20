// Batch "new-b": new premium components built from the references. Owned by one builder.
import type { AnyMotionDef } from "../types";
import moneyStack from "../items/money-stack";
import notificationStack from "../items/notification-stack";
import pillToCard from "../items/pill-to-card";
import sidebarCollapse from "../items/sidebar-collapse";
import taskTabs from "../items/task-tabs";

export const batch: AnyMotionDef[] = [sidebarCollapse, notificationStack, moneyStack, taskTabs, pillToCard];
