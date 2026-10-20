"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { RATIO_SIZE, type AnyMotionDef, type MotionProps, type Palette, type PromptTarget, type PropValue, type Ratio } from "@/motion/types";
import { CodeTab } from "./CodeTab";
import { EditTab } from "./EditTab";
import { ExportTab } from "./ExportTab";
import { Palettes } from "./Palettes";
import { PromptTab } from "./PromptTab";
import { FOCUS_RING, cx } from "./ui";

export const TABS = [
  { id: "prompt", label: "Prompt" },
  { id: "code", label: "Code" },
  { id: "edit", label: "Edit" },
  { id: "export", label: "Export" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export const parseTab = (raw: string | null): TabId => TABS.find((t) => t.id === raw)?.id ?? "prompt";

type OptionsPanelProps = {
  def: AnyMotionDef;
  props: MotionProps;
  ratio: Ratio;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  target: PromptTarget;
  onTargetChange: (target: PromptTarget) => void;
  onPropChange: (key: string, value: PropValue) => void;
  onPaletteApply: (palette: Palette) => void;
  onReset: () => void;
  className?: string;
};

const titleCase = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);

export function OptionsPanel({ def, props, ratio, tab, onTabChange, target, onTargetChange, onPropChange, onPaletteApply, onReset, className }: OptionsPanelProps) {
  const { width, height } = RATIO_SIZE[ratio];
  const seconds = (def.durationInFrames / def.fps).toFixed(1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Once opened, a tab stays mounted (hidden) so work in progress, like an export, survives switching tabs.
  const [visited, setVisited] = useState<ReadonlySet<TabId>>(() => new Set([tab]));
  if (!visited.has(tab)) setVisited(new Set([...visited, tab]));

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "ArrowRight" ? (index + 1) % TABS.length : e.key === "ArrowLeft" ? (index - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next === -1) return;
    e.preventDefault();
    onTabChange(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const renderTab = (id: TabId) => {
    switch (id) {
      case "prompt":
        return <PromptTab def={def} props={props} ratio={ratio} target={target} onTargetChange={onTargetChange} />;
      case "code":
        return <CodeTab def={def} props={props} />;
      case "edit":
        return <EditTab def={def} props={props} ratio={ratio} onChange={onPropChange} onReset={onReset} />;
      case "export":
        return <ExportTab def={def} props={props} ratio={ratio} />;
    }
  };

  return (
    <aside aria-label="Component options" className={cx("flex flex-col bg-panel", className)}>
      <div className="border-b border-line px-5 pt-5 pb-4">
        <h2 className="m-0 text-[22px] leading-tight font-semibold tracking-[-0.03em]">{def.name}</h2>
        <p className="mt-1 mb-3 text-[13px] leading-normal text-ink-2">
          {def.description} <span className="whitespace-nowrap text-ink-3">{`${seconds}s · ${width}×${height}`}</span>
        </p>
        {def.tags.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 text-xs font-medium" aria-label="Tags">
            {def.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-chip px-[9px] py-[3px] text-ink-2">
                {titleCase(tag)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Palettes palettes={def.palettes} props={props} onApply={onPaletteApply} />

      <div role="tablist" aria-label="Options" onKeyDown={onTabKeyDown} className="mx-5 mt-3.5 flex gap-1 rounded-[11px] bg-chip p-[3px]">
        {TABS.map((t, i) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => onTabChange(t.id)}
              className={cx(
                "h-[34px] min-w-0 flex-1 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow]",
                on ? "bg-pill text-ink shadow-pill" : "text-ink-2 hover:text-ink",
                FOCUS_RING,
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {TABS.filter((t) => visited.has(t.id)).map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={t.id !== tab} className="px-5 pt-[18px] pb-6">
          {renderTab(t.id)}
        </div>
      ))}
    </aside>
  );
}
