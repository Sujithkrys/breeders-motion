"use client";
import { Braces, Check, ChevronDown, Copy, Download, FileCode2 } from "lucide-react";
import { useMemo, useState } from "react";
import { highlight } from "sugar-high";
import { SOURCES } from "@/motion/sources.generated";
import type { AnyMotionDef, MotionProps } from "@/motion/types";
import { ACCENT_BUTTON, FIELD_LABEL, FOCUS_RING, OUTLINE_BUTTON, cx } from "./ui";
import { useCopy } from "./useCopy";

type CodeTabProps = {
  def: AnyMotionDef;
  props: MotionProps;
};

const downloadText = (fileName: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Some browsers start the download asynchronously, so the URL has to outlive the click.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

function PropsBlock({ props }: { props: MotionProps }) {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useCopy();
  const json = useMemo(() => JSON.stringify(props, null, 2), [props]);

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 pr-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="props-json"
          onClick={() => setOpen((v) => !v)}
          className={cx("flex h-11 flex-1 items-center gap-2 rounded-xl px-3.5 text-left text-[13px] font-medium text-ink hover:text-ink", FOCUS_RING)}
        >
          <Braces size={15} className="text-ink-3" aria-hidden />
          Props
          <span className="font-normal text-ink-3">· current values</span>
          <ChevronDown size={15} aria-hidden className={cx("ml-auto text-ink-3 transition-transform", open && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={() => void copy(json)}
          aria-label={copied ? "Props copied" : "Copy props as JSON"}
          title="Copy props as JSON"
          className={cx("flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-2 transition-colors hover:bg-sel hover:text-ink", FOCUS_RING)}
        >
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {open && (
        <pre id="props-json" className="m-0 max-h-72 overflow-auto border-t border-line bg-code p-4 font-mono text-xs leading-[1.65] text-code-ink">
          {json}
        </pre>
      )}
    </div>
  );
}

export function CodeTab({ def, props }: CodeTabProps) {
  const files = SOURCES[def.slug] ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const file = files[Math.min(activeIndex, files.length - 1)];
  const { copied, copy } = useCopy();
  const html = useMemo(() => (file ? highlight(file.code) : ""), [file]);

  if (!file) {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-2 px-6 py-10 text-center">
          <FileCode2 size={22} className="text-ink-3" aria-hidden />
          <p className="m-0 text-sm font-medium text-ink">Source isn’t bundled for this one yet</p>
          <p className="m-0 max-w-[30ch] text-[13px] leading-relaxed text-ink-2">Copy the prompt to rebuild it, or take the current props below.</p>
        </div>
        <PropsBlock props={props} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Source files" className="flex min-w-0 flex-wrap gap-1.5">
          {files.map((f, i) => {
            const on = f === file;
            return (
              <button
                key={f.file}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveIndex(i)}
                className={cx(
                  "h-7 max-w-full truncate rounded-[7px] border px-2.5 font-mono text-[12.5px] font-medium transition-colors",
                  on ? "border-line-2 bg-sel text-ink" : "border-transparent text-ink-2 hover:text-ink",
                  FOCUS_RING,
                )}
              >
                {f.file}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-ink-3">Remotion · React</span>
      </div>
      <pre className="m-0 max-h-[460px] overflow-auto rounded-xl border border-line bg-code p-4 font-mono text-xs leading-[1.65] text-code-ink">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      <div className="flex gap-2">
        <button type="button" onClick={() => void copy(file.code)} className={cx(ACCENT_BUTTON, "h-[46px] flex-1 rounded-xl text-sm")}>
          {copied ? <Check size={15} strokeWidth={2.25} aria-hidden /> : <Copy size={15} aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy code"}</span>
        </button>
        <button type="button" onClick={() => downloadText(file.file, file.code)} className={cx(OUTLINE_BUTTON, "h-[46px] flex-1 rounded-xl text-sm text-ink")}>
          <Download size={15} aria-hidden />
          Download file
        </button>
      </div>
      <PropsBlock props={props} />
    </div>
  );
}
