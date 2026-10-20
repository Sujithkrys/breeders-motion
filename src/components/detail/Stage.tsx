"use client";
import { Player, type PlayerRef } from "@remotion/player";
import type { ComponentType, RefObject } from "react";
import { RATIO_SIZE, type AnyMotionDef, type MotionProps, type Ratio } from "@/motion/types";
import { cx } from "./ui";

type StageProps = {
  def: AnyMotionDef;
  props: MotionProps;
  ratio: Ratio;
  playerRef: RefObject<PlayerRef | null>;
};

const renderError = () => (
  <div className="flex size-full items-center justify-center p-6 text-center text-sm text-ink-2">This component couldn’t render with these settings.</div>
);

export function Stage({ def, props, ratio, playerRef }: StageProps) {
  const { width, height } = RATIO_SIZE[ratio];
  const transparent = props.background === "transparent";
  const component = def.component as ComponentType<MotionProps>;

  return (
    <div className="relative h-[56vh] min-h-[300px] bg-canvas min-[1100px]:h-auto min-[1100px]:min-h-0 min-[1100px]:flex-1">
      {/* The inset box is a size container, so the frame can take the largest box of this ratio that fits. */}
      <div className="absolute inset-4 flex items-center justify-center sm:inset-8" style={{ containerType: "size" }}>
        <div
          className={cx("relative overflow-hidden rounded-2xl border border-line", transparent ? "checker" : "bg-stage")}
          style={{
            aspectRatio: `${width} / ${height}`,
            width: `min(100cqw, calc(100cqh * ${width} / ${height}))`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <Player
            ref={playerRef}
            component={component}
            inputProps={props}
            compositionWidth={width}
            compositionHeight={height}
            durationInFrames={def.durationInFrames}
            fps={def.fps}
            loop
            autoPlay
            controls={false}
            clickToPlay
            spaceKeyToPlayOrPause={false}
            errorFallback={renderError}
            acknowledgeRemotionLicense
            // Black behind the composition, like the export's matte, so a colour with opacity previews as it exports.
            style={{ width: "100%", height: "100%", background: transparent ? undefined : "#000000" }}
          />
        </div>
      </div>
    </div>
  );
}
