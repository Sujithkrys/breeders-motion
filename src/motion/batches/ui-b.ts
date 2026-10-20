// Batch "ui-b": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import appDock from "../items/app-dock";
import pricingCards from "../items/pricing-cards";
import searchCascade from "../items/search-cascade";
import musicPlayer from "../items/music-player";
import calendarInvite from "../items/calendar-invite";
import otpCode from "../items/otp-code";
import uploadCard from "../items/upload-card";

export const batch: AnyMotionDef[] = [appDock, pricingCards, searchCascade, musicPlayer, calendarInvite, otpCode, uploadCard];
