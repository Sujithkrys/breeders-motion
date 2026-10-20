// Shared class strings for the component page, so every control focuses and labels the same way.
export const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

export const FIELD_LABEL = "text-xs font-semibold uppercase tracking-[0.06em] text-ink-3";

export const ICON_BUTTON = `flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border border-line text-ink-2 transition-colors hover:bg-sel hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${FOCUS_RING}`;

export const GHOST_BUTTON = `flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-line px-3 text-[13px] font-medium transition-colors hover:bg-sel ${FOCUS_RING}`;

export const ACCENT_BUTTON = `flex items-center justify-center gap-2 bg-accent font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.99] ${FOCUS_RING}`;

export const OUTLINE_BUTTON = `flex items-center justify-center gap-2 border border-line-2 font-medium transition-colors hover:bg-sel ${FOCUS_RING}`;

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
