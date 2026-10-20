"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { RATIO_SIZE, type AnyMotionDef, type MotionProps, type Ratio } from "@/motion/types";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);

function PreviewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stage text-xs text-ink-3">Preview unavailable</div>
  );
}

// One broken component must not take the whole grid down with it.
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Motion preview failed", error);
  }
  render() {
    return this.state.failed ? <PreviewFallback /> : this.props.children;
  }
}

export function MotionPreview({
  def,
  ratio,
  inputProps,
  className,
}: {
  def: AnyMotionDef;
  ratio: Ratio;
  inputProps?: MotionProps;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const visibleRef = useRef(false);
  const hoveredRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const size = RATIO_SIZE[def.ratios.includes(ratio) ? ratio : (def.ratios[0] ?? "16:9")];
  const restFrame = Math.floor(def.durationInFrames * 0.4);

  // Play only while on screen; with reduced motion, only while hovered, resting on a representative frame otherwise.
  const syncPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const shouldPlay = visibleRef.current && (!reducedMotion || hoveredRef.current);
    if (shouldPlay) {
      if (!player.isPlaying()) player.play();
    } else if (player.isPlaying()) {
      player.pause();
      if (reducedMotion) player.seekTo(restFrame);
    }
  }, [reducedMotion, restFrame]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!mounted || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      syncPlayback();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visibleRef.current = entry.isIntersecting;
      syncPlayback();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, syncPlayback]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full bg-stage ${className ?? ""}`}
      onPointerEnter={() => {
        hoveredRef.current = true;
        syncPlayback();
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        syncPlayback();
      }}
    >
      {mounted && (
        <PreviewBoundary key={def.slug}>
          <Player
            ref={playerRef}
            component={def.component}
            inputProps={inputProps ?? def.defaultProps}
            durationInFrames={def.durationInFrames}
            fps={def.fps}
            compositionWidth={size.width}
            compositionHeight={size.height}
            autoPlay={!reducedMotion}
            initialFrame={reducedMotion ? restFrame : 0}
            loop
            initiallyMuted
            controls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            allowFullscreen={false}
            acknowledgeRemotionLicense
            errorFallback={() => <PreviewFallback />}
            style={{ width: "100%", height: "100%" }}
          />
        </PreviewBoundary>
      )}
    </div>
  );
}
