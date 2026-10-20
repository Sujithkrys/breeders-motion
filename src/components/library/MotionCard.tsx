"use client";
import { Bookmark, Check, Copy } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { MotionPreview } from "@/components/MotionPreview";
import { FOCUS_RING } from "@/components/shell/ui";
import { copyText } from "@/lib/prefs";
import { categoryLabel } from "@/motion/categories";
import { secs } from "@/motion/kit";
import { isNew } from "@/motion/registry";
import { RATIO_SIZE, type AnyMotionDef, type Ratio } from "@/motion/types";

type CopyState = "idle" | "copied" | "failed";

export const MotionCard = memo(function MotionCard({
  def,
  ratio,
  saved,
  onToggleSave,
}: {
  def: AnyMotionDef;
  ratio: Ratio;
  saved: boolean;
  onToggleSave: (slug: string) => void;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const href = `/components/${def.slug}${ratio === "16:9" ? "" : `?ratio=${ratio}`}`;

  const copyPrompt = async () => {
    const { width, height } = RATIO_SIZE[def.ratios.includes(ratio) ? ratio : (def.ratios[0] ?? "16:9")];
    const text = def.prompt(def.defaultProps, {
      target: "claude",
      width,
      height,
      seconds: Math.round((def.durationInFrames / def.fps) * 10) / 10,
      fps: def.fps,
    });
    const ok = await copyText(text);
    setCopyState(ok ? "copied" : "failed");
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <article className="group rounded-[14px] border border-line bg-card p-1.5 transition-colors duration-200 hover:border-line-2 focus-within:border-line-2">
      <div className="relative">
        {/* The name link below is the keyboard route to the page; this one is a large pointer target. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="block overflow-hidden rounded-[10px] bg-stage"
          style={{ aspectRatio: ratio.replace(":", " / ") }}
        >
          <MotionPreview def={def} ratio={ratio} inputProps={def.defaultProps} />
        </Link>

        {isNew(def) && (
          <span className="pointer-events-none absolute top-[9px] left-[9px] rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
            New
          </span>
        )}

        <button
          type="button"
          onClick={copyPrompt}
          aria-label={`Copy prompt for ${def.name}`}
          className={`absolute top-2 right-2 flex h-[30px] -translate-y-1 cursor-pointer items-center gap-1.5 rounded-lg bg-btn px-2.5 text-xs font-semibold text-btn-ink opacity-0 transition-[opacity,transform] duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 ${FOCUS_RING}`}
        >
          {copyState === "copied" ? (
            <Check size={13} strokeWidth={2.4} aria-hidden />
          ) : (
            <Copy size={13} strokeWidth={2.2} aria-hidden />
          )}
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Try again" : "Prompt"}
        </button>
        <span className="sr-only" aria-live="polite">
          {copyState === "copied" ? `Prompt for ${def.name} copied` : copyState === "failed" ? "Copy failed" : ""}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
        <div className="min-w-0">
          <Link
            href={href}
            className={`block truncate rounded text-sm font-semibold text-ink transition-colors hover:text-ink-2 ${FOCUS_RING}`}
          >
            {def.name}
          </Link>
          <p className="mt-[3px] truncate text-xs text-ink-3">
            {categoryLabel(def.category)} · {secs(def.durationInFrames, def.fps)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleSave(def.slug)}
          aria-label={`Save ${def.name}`}
          aria-pressed={saved}
          className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-chip ${
            saved ? "text-accent-ink" : "text-ink-3 hover:text-ink"
          } ${FOCUS_RING}`}
        >
          <Bookmark size={16} strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>
    </article>
  );
});
