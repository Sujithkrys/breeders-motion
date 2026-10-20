import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type UploadCardProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  success: string;
  fileName: string;
  sizeMb: number;
  ease: string;
};

// Timeline in frames (180-frame clip, frames 168–180 held still).
export const T = { drop: 14, land: 38, travel: 46, upStart: 62, upEnd: 126, done: 140 };
export const ENTER = 18;
export const EXIT = 12;
// The card is designed at 1040 / 820 / 760px; at 16:9 it also scales up so it fills ~62% of the frame width.
export const zoomFor = (wide: boolean) => (wide ? 1.15 : 1);
export const cardWidth = (ratio: string) => (ratio === "16:9" ? 1040 : ratio === "9:16" ? 820 : 760);

const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};

export const extOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "FILE";
};

// A plain document: card-coloured page, hairline outline, grey folded corner and one small accent type chip.
const FileIcon: React.FC<{ w: number; s: number; page: string; outline: string; fold: string; chip: string; onChip: string; ext: string }> = ({ w, s, page, outline, fold, chip, onChip, ext }) => {
  const sw = (STROKE.hair * s * 60) / w;
  const rx = (RADIUS.chip * s * 60) / w;
  return (
    <svg width={w} height={w * 1.2} viewBox="0 0 60 72" style={{ display: "block", overflow: "visible" }}>
      <path d="M6 1h33l20 20v45a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5z" fill={page} stroke={outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M39 1v15a5 5 0 0 0 5 5h15z" fill={fold} stroke={outline} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={10} y={46} width={40} height={16} rx={Math.min(rx, 8)} fill={chip} />
      <text x={30} y={57.6} textAnchor="middle" fontFamily={FONT_MONO} fontSize={10.5} fontWeight={500} letterSpacing={1.2} fill={onChip}>
        {ext}
      </text>
    </svg>
  );
};

export const UploadCard: React.FC<UploadCardProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const s = u * zoomFor(ratio === "16:9");
  const dark = isDark(p.background);
  const size = Math.max(1, Math.round(p.sizeMb * 10) / 10);

  const W = cardWidth(ratio) * s;
  const P = 40 * s;
  const zoneTop = 144 * s;
  const zoneH = 300 * s;
  const zoneW = W - 2 * P;
  const rowTop = zoneTop + zoneH + 24 * s;
  const rowH = 112 * s;
  const H = rowTop + rowH + P;
  const hair = STROKE.hair * s;

  const enter = progress(f, 0, ENTER, p.ease);
  const fall = progress(f, T.drop, T.land, "travel");
  const hover = progress(f, T.drop + 8, T.drop + 8 + ENTER, p.ease) * (1 - progress(f, T.travel + 6, T.travel + 6 + EXIT, "exit"));
  const squash = progress(f, T.land, T.land + 3, "travel") - progress(f, T.land + 3, T.land + 10, "travel");
  const travel = progress(f, T.travel, T.travel + ENTER, "travel");
  const rowIn = progress(f, T.travel + 2, T.travel + 2 + ENTER, p.ease);

  const bigW = 120 * s;
  const smallW = 56 * s;
  const iconW = mix(bigW, smallW, travel);
  const cx = mix(W / 2, P + 24 * s + smallW / 2, travel);
  const cy = mix(zoneTop + zoneH / 2 - (1 - fall) * 460 * s, rowTop + rowH / 2, travel);

  const raw = progress(f, T.upStart, T.upEnd, "travel");
  // A small wobble on top of the eased curve so the upload reads as real network progress; it stays monotonic.
  const v = Math.min(1, Math.max(0, raw + 0.03 * Math.sin(raw * Math.PI * 3) * (1 - raw)));
  const pct = Math.round(v * 100);
  const speed = 5.2 + 1.4 * Math.sin(f * 0.23) + 0.6 * Math.sin(f * 0.61);
  const left = Math.max(1, Math.ceil(((1 - v) * size) / speed));
  const done = progress(f, T.done, T.done + ENTER, p.ease);
  const pop = progress(f, T.done, T.done + ENTER, "spring");
  const tick = progress(f, T.done + 6, T.done + 6 + ENTER, "enter");
  const zoneIdle = 1 - progress(f, T.drop + 4, T.drop + 4 + EXIT, "exit") + progress(f, T.travel + 10, T.travel + 10 + ENTER, "enter");
  const closeIcon = 30 * s;
  const upIcon = 34 * s;
  const checkIcon = 44 * s;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          borderRadius: RADIUS.card * s,
          background: p.card,
          border: `${1 * s}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${1 * s}px ${2 * s}px rgba(0,0,0,0.04), 0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.06)`,
          boxSizing: "border-box",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30 * s}px)`,
        }}
      >
        <div style={{ position: "absolute", left: P, top: P, right: P, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 34 * s, fontWeight: 500, letterSpacing: "-0.035em", color: p.ink }}>Upload files</div>
            <div style={{ fontSize: 21 * s, color: p.ink2, marginTop: 6 * s }}>Add documents to the shared workspace</div>
          </div>
          <svg width={closeIcon} height={closeIcon} viewBox="0 0 24 24" style={{ display: "block", marginTop: 4 * s }}>
            <path d="M6.5 6.5l11 11 M17.5 6.5l-11 11" stroke={p.ink3} strokeWidth={(STROKE.ring * s * 24) / closeIcon} strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ position: "absolute", left: P, top: zoneTop, width: zoneW, height: zoneH, transform: `scale(${1 + 0.012 * hover})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, background: p.fill }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * s, background: p.accent, opacity: 0.06 * hover }} />
          <svg width={zoneW} height={zoneH} style={{ position: "absolute", left: 0, top: 0, display: "block" }}>
            {[
              { color: p.ink, op: 0.2 * (1 - hover) },
              { color: p.accent, op: hover },
            ].map((r, i) => (
              <rect
                key={i}
                x={STROKE.ring * s * 0.5}
                y={STROKE.ring * s * 0.5}
                width={zoneW - STROKE.ring * s}
                height={zoneH - STROKE.ring * s}
                rx={RADIUS.button * s - STROKE.ring * s * 0.5}
                fill="none"
                stroke={r.color}
                strokeOpacity={r.op}
                strokeWidth={STROKE.ring * s}
                strokeDasharray={`${12 * s} ${9 * s}`}
              />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: zoneIdle }}>
            <div
              style={{
                width: 68 * s,
                height: 68 * s,
                borderRadius: RADIUS.button * s,
                background: p.card,
                boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={upIcon} height={upIcon} viewBox="0 0 24 24" style={{ display: "block" }}>
                <path
                  d="M12 15.5V5 M7.5 9.5L12 5l4.5 4.5 M5 15v2.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15"
                  fill="none"
                  stroke={p.ink2}
                  strokeWidth={(STROKE.ring * s * 24) / upIcon}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: 25 * s, color: p.ink2, marginTop: 20 * s, letterSpacing: "-0.015em" }}>
              Drop files here or <span style={{ color: p.ink, fontWeight: 500 }}>browse</span>
            </div>
            <div style={{ fontSize: 19 * s, color: p.ink3, marginTop: 8 * s }}>PDF, PNG or ZIP · up to 500 MB</div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: P,
            top: rowTop,
            width: zoneW,
            height: rowH,
            borderRadius: RADIUS.button * s,
            border: `${hair}px solid ${p.line}`,
            boxSizing: "border-box",
            padding: `0 ${26 * s}px 0 ${100 * s}px`,
            display: "flex",
            alignItems: "center",
            gap: 24 * s,
            opacity: rowIn,
            transform: `translateY(${(1 - rowIn) * 12 * s}px)`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 25 * s, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{p.fileName}</div>
            <div style={{ position: "relative", height: 26 * s, marginTop: 4 * s, fontSize: 19 * s, color: p.ink2, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: 1 - done }}>
                {(v * size).toFixed(1)} of {size} MB · {speed.toFixed(1)} MB/s · {left}s left
              </span>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: done }}>{size} MB · Uploaded just now</span>
            </div>
            <div style={{ position: "relative", height: STROKE.bar * s, marginTop: 14 * s, borderRadius: 999, background: p.fill, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 999, background: p.accent }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", borderRadius: 999, background: p.success, opacity: done }} />
            </div>
          </div>
          <div style={{ position: "relative", width: 86 * s, height: checkIcon }}>
            <span
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                lineHeight: `${checkIcon}px`,
                fontFamily: FONT_MONO,
                fontSize: 22 * s,
                fontWeight: 500,
                color: p.ink2,
                opacity: 1 - done,
              }}
            >
              {pct}%
            </span>
            <svg width={checkIcon} height={checkIcon} viewBox="0 0 24 24" style={{ position: "absolute", right: 0, top: 0, opacity: done, transform: `scale(${mix(0.6, 1, pop)})` }}>
              <circle cx={12} cy={12} r={11} fill={p.success} />
              <path
                d="M7 12.4l3.2 3.2L17 8.8"
                fill="none"
                stroke={p.card}
                strokeWidth={(STROKE.ring * s * 24) / checkIcon}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={16}
                strokeDashoffset={16 * (1 - tick)}
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: cx - iconW / 2,
            top: cy - (iconW * 1.2) / 2,
            opacity: progress(f, T.drop, T.drop + ENTER, "enter"),
            transform: `rotate(${(1 - fall) * -6}deg) scale(${1 + 0.05 * squash}, ${1 - 0.08 * squash})`,
            transformOrigin: "50% 100%",
          }}
        >
          {dark ? null : (
            <div
              style={{
                position: "absolute",
                left: iconW * 0.1,
                right: iconW * 0.1,
                bottom: -iconW * 0.04,
                height: iconW * 0.12,
                borderRadius: 999,
                background: alpha(p.ink, 0.18),
                filter: `blur(${mix(18, 6, fall) * s}px)`,
                opacity: mix(0.3, 1, fall) * (1 - travel * 0.7),
              }}
            />
          )}
          <FileIcon w={iconW} s={s} page={p.card} outline={p.ink3} fold={p.fill} chip={p.accent} onChip={p.onAccent} ext={extOf(p.fileName)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
