"use client";
import type { CallbackListener, PlayerRef } from "@remotion/player";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { AnyMotionDef, Ratio } from "@/motion/types";
import { Segmented } from "./Segmented";
import { FOCUS_RING, ICON_BUTTON, cx } from "./ui";

type TransportProps = {
  def: AnyMotionDef;
  ratio: Ratio;
  onRatioChange: (ratio: Ratio) => void;
  playerRef: RefObject<PlayerRef | null>;
};

// "0:01.2": minutes, then seconds to a tenth. The epsilon keeps 1.2 from flooring to 1.1 through float error.
const formatTime = (frames: number, fps: number) => {
  const tenths = Math.floor((frames / fps) * 10 + 1e-6);
  const minutes = Math.floor(tenths / 600);
  const seconds = (tenths % 600) / 10;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
};

// Keys inside these elements belong to the element, not to the global play/pause shortcut.
const OWNS_SPACE = "input, textarea, select, button, a, [contenteditable=''], [contenteditable='true'], [role='tab'], [role='switch'], [role='option']";

// The range thumb is the playhead itself, so where you click is exactly where the head lands.
const SCRUBBER =
  "relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent outline-none " +
  "[&::-webkit-slider-runnable-track]:h-8 [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-0.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-ink " +
  "[&::-moz-range-track]:h-8 [&::-moz-range-track]:bg-transparent " +
  "[&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-0.5 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink";

export function Transport({ def, ratio, onRatioChange, playerRef }: TransportProps) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const resumeAfterScrub = useRef(false);
  const lastFrame = Math.max(0, def.durationInFrames - 1);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    setPlaying(player.isPlaying());
    setFrame(player.getCurrentFrame());
    const onFrame: CallbackListener<"frameupdate"> = (e) => setFrame(e.detail.frame);
    const onSeeked: CallbackListener<"seeked"> = (e) => setFrame(e.detail.frame);
    const onPlay: CallbackListener<"play"> = () => setPlaying(true);
    const onPause: CallbackListener<"pause"> = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onSeeked);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onSeeked);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, def, ratio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(OWNS_SPACE)) return;
      e.preventDefault();
      playerRef.current?.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playerRef]);

  const restart = () => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    setFrame(0);
    player.play();
  };

  const seek = (to: number) => {
    playerRef.current?.seekTo(to);
    setFrame(to);
  };

  const startScrub = () => {
    const player = playerRef.current;
    resumeAfterScrub.current = Boolean(player?.isPlaying());
    if (resumeAfterScrub.current) player?.pause();
  };

  const endScrub = () => {
    if (resumeAfterScrub.current) playerRef.current?.play();
    resumeAfterScrub.current = false;
  };

  const percent = lastFrame ? (frame / lastFrame) * 100 : 0;
  const current = formatTime(frame, def.fps);
  const total = formatTime(def.durationInFrames, def.fps);

  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3 border-t border-line px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => playerRef.current?.toggle()}
        aria-label={playing ? "Pause" : "Play"}
        title={playing ? "Pause (Space)" : "Play (Space)"}
        className={cx("flex size-[38px] shrink-0 items-center justify-center rounded-full bg-btn text-btn-ink transition-transform active:scale-95", FOCUS_RING)}
      >
        {playing ? <Pause size={14} fill="currentColor" strokeWidth={0} aria-hidden /> : <Play size={14} fill="currentColor" strokeWidth={0} className="translate-x-px" aria-hidden />}
      </button>
      <button type="button" onClick={restart} aria-label="Restart" title="Restart" className={ICON_BUTTON}>
        <RotateCcw size={15} aria-hidden />
      </button>
      <span className="shrink-0 font-mono text-[13px] font-medium text-ink-2 tabular-nums" aria-live="off">
        <span className="text-ink">{current}</span> / {total}
      </span>
      <div className="relative order-last h-8 min-w-0 flex-[1_1_100%] overflow-hidden rounded-lg bg-chip has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent sm:order-none sm:flex-[1_1_200px]">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 bg-accent/25" style={{ width: `${percent}%` }} />
        <input
          type="range"
          min={0}
          max={lastFrame}
          step={1}
          value={Math.min(frame, lastFrame)}
          onChange={(e) => seek(Number(e.currentTarget.value))}
          onPointerDown={startScrub}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          aria-label="Seek"
          aria-valuetext={`${current} of ${total}`}
          className={SCRUBBER}
        />
      </div>
      <Segmented<Ratio> label="Aspect ratio" options={def.ratios.map((r) => ({ label: r, value: r }))} value={ratio} onChange={onRatioChange} className="ml-auto sm:ml-0" />
    </div>
  );
}
