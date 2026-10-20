import { useSyncExternalStore } from "react";

// Any part of the site can open the command menu without holding a ref to it.
export const OPEN_SEARCH_EVENT = "breeders:open-search";

export const openSearch = () => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));

const noopSubscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

// "⌘K" on Apple devices, "Ctrl K" elsewhere. The server snapshot is "⌘K" so hydration matches the design.
export const useShortcutLabel = () => useSyncExternalStore(noopSubscribe, () => (isApple() ? "⌘K" : "Ctrl K"), () => "⌘K");
