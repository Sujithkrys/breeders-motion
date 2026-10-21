"use client";
import type { PlayerRef } from "@remotion/player";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommandMenu } from "@/components/shell/CommandMenu";
import { useStorageSync } from "@/lib/prefs";
import { decodeProps, encodeProps } from "@/lib/url-props";
import { getMotion } from "@/motion/registry";
import type { AnyMotionDef, MotionProps, Palette, PromptTarget, PropValue, Ratio } from "@/motion/types";
import { OptionsPanel, parseTab, type TabId } from "./OptionsPanel";
import { Rail } from "./Rail";
import { Stage } from "./Stage";
import { StageHeader } from "./StageHeader";
import { Transport } from "./Transport";

const URL_DEBOUNCE_MS = 300;

const parseRatio = (def: AnyMotionDef, raw: string | null): Ratio => def.ratios.find((r) => r === raw) ?? def.ratios[0];

// The URL carries only what differs from a fresh visit, so an untouched page keeps a clean address.
const buildQuery = (def: AnyMotionDef, props: MotionProps, ratio: Ratio, tab: TabId) => {
  const params = new URLSearchParams();
  if (tab !== "prompt") params.set("tab", tab);
  if (ratio !== def.ratios[0]) params.set("ratio", ratio);
  const encoded = encodeProps(def, props);
  if (encoded) params.set("p", encoded);
  return params.toString();
};

function ComponentDetail({ def }: { def: AnyMotionDef }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useStorageSync();

  // The URL seeds the state once; after that, state leads and the URL follows (debounced).
  const [props, setProps] = useState<MotionProps>(() => decodeProps(def, searchParams.get("p")));
  const [ratio, setRatio] = useState<Ratio>(() => parseRatio(def, searchParams.get("ratio")));
  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get("tab")));
  const [target, setTarget] = useState<PromptTarget>("claude");
  const playerRef = useRef<PlayerRef>(null);

  const query = useMemo(() => buildQuery(def, props, ratio, tab), [def, props, ratio, tab]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const search = query ? `?${query}` : "";
      if (window.location.search === search) return;
      router.replace(`${pathname}${search}`, { scroll: false });
    }, URL_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, pathname, router]);

  // Built from state rather than location, so a link copied mid-debounce already holds the latest edit.
  const getShareUrl = useCallback(() => `${window.location.origin}${pathname}${query ? `?${query}` : ""}`, [pathname, query]);

  const setProp = useCallback((key: string, value: PropValue) => setProps((current) => ({ ...current, [key]: value })), []);
  const applyPalette = useCallback((palette: Palette) => setProps((current) => ({ ...current, ...palette.values })), []);
  const reset = useCallback(() => setProps({ ...(def.defaultProps as MotionProps) }), [def]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink min-[1100px]:h-dvh min-[1100px]:flex-row min-[1100px]:overflow-hidden">
      <Rail category={def.category} />
      <main className="flex min-w-0 flex-col min-[1100px]:min-h-0 min-[1100px]:flex-1">
        <StageHeader def={def} neighbourQuery={tab !== "prompt" ? `tab=${tab}` : ""} getShareUrl={getShareUrl} />
        <Stage def={def} props={props} ratio={ratio} playerRef={playerRef} />
        <Transport def={def} ratio={ratio} onRatioChange={setRatio} playerRef={playerRef} />
      </main>
      <OptionsPanel
        def={def}
        props={props}
        ratio={ratio}
        tab={tab}
        onTabChange={setTab}
        target={target}
        onTargetChange={setTarget}
        onPropChange={setProp}
        onPaletteApply={applyPalette}
        onReset={reset}
        className="w-full border-t border-line min-[1100px]:w-[400px] min-[1100px]:shrink-0 min-[1100px]:overflow-y-auto min-[1100px]:overscroll-contain min-[1100px]:border-t-0 min-[1100px]:border-l"
      />
      <CommandMenu />
    </div>
  );
}

// useSearchParams needs a Suspense boundary on a statically generated route; the fallback holds the page colour.
export function ComponentPage({ slug }: { slug: string }) {
  const def = getMotion(slug);
  if (!def) {
    return <div className="flex min-h-dvh items-center justify-center bg-bg p-6 text-center text-sm text-ink-2">This component doesn’t exist, or it has moved.</div>;
  }
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <ComponentDetail key={slug} def={def} />
    </Suspense>
  );
}
