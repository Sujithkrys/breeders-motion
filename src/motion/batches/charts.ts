// Batch "charts": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import barChartRise from "../items/bar-chart-rise";
import lineChartDraw from "../items/line-chart-draw";
import donutFill from "../items/donut-fill";
import statCards from "../items/stat-cards";
import areaStack from "../items/area-stack";
import heatmapGrid from "../items/heatmap-grid";
import leaderboardReorder from "../items/leaderboard-reorder";

export const batch: AnyMotionDef[] = [barChartRise, lineChartDraw, donutFill, statCards, areaStack, heatmapGrid, leaderboardReorder];
