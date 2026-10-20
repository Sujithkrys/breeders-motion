"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/prefs";

// Copies text and holds a "copied" flag briefly, so buttons can confirm without a toast.
export function useCopy(holdMs = 1600) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      if (!ok) return false;
      if (timer.current) clearTimeout(timer.current);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), holdMs);
      return true;
    },
    [holdMs],
  );

  return { copied, copy };
}
