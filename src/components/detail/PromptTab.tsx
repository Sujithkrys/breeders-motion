"use client";
import { Check, Copy } from "lucide-react";
import { useMemo } from "react";
import { RATIO_SIZE, type AnyMotionDef, type MotionProps, type PromptTarget, type Ratio } from "@/motion/types";
import { Segmented } from "./Segmented";
import { ACCENT_BUTTON, FIELD_LABEL, cx } from "./ui";
import { useCopy } from "./useCopy";

const TARGETS: { label: string; value: PromptTarget }[] = [
  { label: "Claude Code", value: "claude" },
  { label: "React", value: "react" },
  { label: "CSS", value: "css" },
];

type PromptTabProps = {
  def: AnyMotionDef;
  props: MotionProps;
  ratio: Ratio;
  target: PromptTarget;
  onTargetChange: (target: PromptTarget) => void;
};

export function PromptTab({ def, props, ratio, target, onTargetChange }: PromptTabProps) {
  const { copied, copy } = useCopy();
  const { width, height } = RATIO_SIZE[ratio];

  const prompt = useMemo(() => {
    try {
      return def.prompt(props, { target, width, height, seconds: Math.round((def.durationInFrames / def.fps) * 10) / 10, fps: def.fps });
    } catch {
      return "This prompt couldn’t be written for the current settings. Try Reset to default in Edit.";
    }
  }, [def, props, target, width, height]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className={FIELD_LABEL}>Prompt for</span>
        <Segmented<PromptTarget> label="Prompt target" options={TARGETS} value={target} onChange={onTargetChange} variant="outline" />
      </div>
      <pre className="m-0 max-h-[52vh] overflow-auto rounded-xl border border-line bg-code p-4 font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap text-code-ink min-[1100px]:max-h-none">
        {prompt}
      </pre>
      <button type="button" onClick={() => void copy(prompt)} className={cx(ACCENT_BUTTON, "h-12 rounded-xl text-[15px]")}>
        {copied ? <Check size={16} strokeWidth={2.25} aria-hidden /> : <Copy size={16} aria-hidden />}
        <span aria-live="polite">{copied ? "Copied" : "Copy prompt"}</span>
      </button>
      <p className="m-0 text-xs leading-normal text-ink-3">The prompt follows your edits, so what you copy is what you see.</p>
    </div>
  );
}
