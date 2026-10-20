// Shared class strings for the shell, so every control gets the same focus ring and segmented look.
export const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const SEGMENTED_GROUP = "flex rounded-[10px] bg-chip p-[3px]";

export const SEGMENT_BUTTON = `flex h-[30px] cursor-pointer items-center justify-center rounded-[7px] text-[13px] font-medium transition-colors ${FOCUS_RING}`;
export const SEGMENT_ON = "bg-pill text-ink shadow-pill";
export const SEGMENT_OFF = "bg-transparent text-ink-2 hover:text-ink";

export const SOON_CHIP = "rounded-md bg-chip px-1.5 py-0.5 text-[11px] leading-none font-semibold text-ink-3";
