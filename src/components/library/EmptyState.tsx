import type { LucideIcon } from "lucide-react";
import { FOCUS_RING } from "@/components/shell/ui";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-dashed border-line-2 px-6 py-20 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-chip text-ink-2">
        <Icon size={20} strokeWidth={1.8} aria-hidden />
      </span>
      <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-2">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className={`mt-5 h-9 cursor-pointer rounded-[9px] bg-btn px-4 text-[13px] font-semibold text-btn-ink transition-opacity hover:opacity-90 ${FOCUS_RING} focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
