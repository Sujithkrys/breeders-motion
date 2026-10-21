// Batch "v3-f": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import tickSlider from "../items/tick-slider";
import dateRangePicker from "../items/date-range-picker";
import starRating from "../items/star-rating";
import tableSort from "../items/table-sort";
import weekCalendar from "../items/week-calendar";

export const batch: AnyMotionDef[] = [tickSlider, dateRangePicker, starRating, tableSort, weekCalendar];
