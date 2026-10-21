import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type KanbanMoveProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  board: string;
  col1: string;
  col2: string;
  col3: string;
  task: string; // the card that moves
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
// 16:9 and 1:1 lay the board out as three columns; 9:16 re-flows it into three stacked lanes.
export const SCALE: Record<Ratio, number> = { "16:9": 1.62, "1:1": 1.22, "9:16": 1.3 };
export const CARD_W = 236;
export const CARD_H = 104;
export const CARD_GAP = 10;
export const COL_PAD = 12;
export const COL_HEAD = 48;
export const COL_GAP = 14;
export const BOARD_HEAD = 56;
export const COL_W = CARD_W + 2 * COL_PAD;
export const COL_H = COL_HEAD + 3 * CARD_H + 2 * CARD_GAP + COL_PAD;
export const LANE_W = 3 * CARD_W + 2 * CARD_GAP + 2 * COL_PAD;
export const LANE_H = COL_HEAD + CARD_H + COL_PAD;

export type Task = { title: string; tag: string; id: string; who: string };
export const TODO: Task[] = [
  { title: "Write the onboarding emails", tag: "COPY", id: "BRD-131", who: "M" },
  { title: "Audit empty states", tag: "DESIGN", id: "BRD-138", who: "L" },
];
export const DOING: Task[] = [
  { title: "Migrate auth to passkeys", tag: "API", id: "BRD-127", who: "N" },
  { title: "Fix chart tooltip overlap", tag: "BUG", id: "BRD-145", who: "I" },
];
export const DONE: Task[] = [
  { title: "Set up the status page", tag: "INFRA", id: "BRD-119", who: "L" },
  { title: "Draft the launch post", tag: "COPY", id: "BRD-124", who: "M" },
];
export const MOVER = { tag: "WEB", id: "BRD-142", who: "A" };

// ---------- timeline (150-frame loop) ----------
export const T = {
  mv1A: 6, mv1B: 24, grab: 27,
  liftA: 27, liftB: 39,
  dragA: 34, dragB: 74,
  closeA: 42, openA: 50, settle: 18,
  cnt1A: 44, cnt1B: 52,
  drop: 76, dropA: 76, dropB: 90,
  cnt2A: 78, cnt2B: 86,
  mv2A: 82, mv2B: 100,
  backA: 110, backB: 134,
  cnt3A: 112, cnt3B: 120,
  cnt4A: 128, cnt4B: 136,
} as const;

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number, bend = 0.08): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * bend;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// A count that rolls to its new value: up when it grows, down when it shrinks.
const Roll: React.FC<{ from: number; to: number; t: number; k: number; color: string }> = ({ from, to, t, k, color }) => {
  const h = 16 * k;
  const dir = to >= from ? 1 : -1;
  const st: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center" };
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10 * k, height: h, lineHeight: `${h}px`, overflow: "hidden", fontFamily: FONT_MONO, fontSize: 12 * k, color }}>
      {t < 1 ? <span style={{ ...st, top: -dir * t * h, opacity: 1 - t }}>{String(from)}</span> : null}
      {t > 0 ? <span style={{ ...st, top: dir * (1 - t) * h, opacity: t }}>{String(to)}</span> : null}
    </span>
  );
};

// Linear-style status glyphs: to do (open ring), in progress (half pie), done (filled with a tick).
const StatusIcon: React.FC<{ kind: number; size: number; color: string; bg: string }> = ({ kind, size, color, bg }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
    <circle cx={7} cy={7} r={5.5} fill="none" stroke={color} strokeWidth={STROKE.hair} />
    {kind === 1 ? <path d="M7 3.5A3.5 3.5 0 0 1 7 10.5Z" fill={color} /> : null}
    {kind === 2 ? <circle cx={7} cy={7} r={5.5} fill={color} /> : null}
    {kind === 2 ? <path d="M4.6 7.2 6.3 8.8 9.4 5.6" fill="none" stroke={bg} strokeWidth={STROKE.hair} strokeLinecap="round" strokeLinejoin="round" /> : null}
  </svg>
);

export const KanbanMove: React.FC<KanbanMoveProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio, isVertical } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const lanes = isVertical;

  // ---- layout (board coords)
  const boardW = lanes ? LANE_W : 3 * COL_W + 2 * COL_GAP;
  const boardH = BOARD_HEAD + (lanes ? 3 * LANE_H + 2 * COL_GAP : COL_H);
  const colBox = (c: number): [number, number, number, number] =>
    lanes ? [0, BOARD_HEAD + c * (LANE_H + COL_GAP), LANE_W, LANE_H] : [c * (COL_W + COL_GAP), BOARD_HEAD, COL_W, COL_H];
  const slotPos = (c: number, s: number): Pt => {
    const [x, y] = colBox(c);
    return lanes ? [x + COL_PAD + s * (CARD_W + CARD_GAP), y + COL_HEAD] : [x + COL_PAD, y + COL_HEAD + s * (CARD_H + CARD_GAP)];
  };

  // ---- state
  const looping = frame >= T.backA;
  const close = looping ? 1 - progress(frame, T.backA + 8, T.backA + 8 + T.settle, "spring") : progress(frame, T.closeA, T.closeA + T.settle, "spring");
  const open = looping ? 1 - progress(frame, T.backA + 4, T.backA + 4 + T.settle, "spring") : progress(frame, T.openA, T.openA + T.settle, "spring");
  const held = clamp01(progress(frame, T.liftA, T.liftB, "spring") - progress(frame, T.dropA, T.dropB, "spring"));
  const backT = progress(frame, T.backA, T.backB, "travel");
  const lift = Math.max(held, Math.sin(Math.PI * backT) * 0.6);
  const from = slotPos(1, 0);
  const to = slotPos(2, 0);
  let pos: Pt = from;
  // both legs arc upward (columns) / outward (lanes)
  if (looping) pos = glide(to, from, backT, 0.06);
  else if (frame >= T.dragA) pos = glide(from, to, progress(frame, T.dragA, T.dragB, p.ease), -0.06);
  const placeholder = looping ? 0 : open * (1 - progress(frame, T.drop, T.drop + 6, "exit"));

  // counts: in progress 3 → 2 → 3, done 2 → 3 → 2
  const doingCount = looping
    ? { from: 2, to: 3, t: progress(frame, T.cnt4A, T.cnt4B, "enter") }
    : { from: 3, to: 2, t: progress(frame, T.cnt1A, T.cnt1B, "enter") };
  const doneCount = looping
    ? { from: 3, to: 2, t: progress(frame, T.cnt3A, T.cnt3B, "enter") }
    : { from: 2, to: 3, t: progress(frame, T.cnt2A, T.cnt2B, "enter") };

  // ---- cursor (board coords): grabs the card a little right of centre
  const grabOff: Pt = [CARD_W * 0.58, CARD_H * 0.44];
  const P0: Pt = lanes ? [LANE_W * 0.7, boardH + 40] : [boardW * 0.62, boardH + 36];
  const onCard = (q: Pt): Pt => [q[0] + grabOff[0], q[1] + grabOff[1] - 4 * held];
  let cur: Pt = P0;
  if (frame >= T.mv2A) cur = glide(onCard(to), P0, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.grab) cur = onCard(pos);
  else if (frame >= T.mv1A) cur = glide(P0, onCard(from), progress(frame, T.mv1A, T.mv1B, "travel"));
  const press = clamp01(
    interpolate(frame, [T.grab - 3, T.grab], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) -
      interpolate(frame, [T.drop, T.drop + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left: left * k, top: top * k, width: width * k, height: height * k });
  const rest = dark ? `inset 0 0 0 ${hair}px ${p.line}` : `inset 0 0 0 ${hair}px ${p.line}, 0 ${u}px ${2 * u}px rgba(0,0,0,0.04)`;
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 10 * k, letterSpacing: "0.1em", whiteSpace: "nowrap" };

  const card = (key: string, t: Task, at: Pt, extra: React.CSSProperties = {}) => (
    <div
      key={key}
      style={{
        ...abs(at[0], at[1], CARD_W, CARD_H),
        borderRadius: RADIUS.button * u,
        background: p.card,
        boxShadow: rest,
        ...extra,
      }}
    >
      <div style={{ ...abs(14, 13, CARD_W - 28, 40), fontSize: 14.5 * k, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.38, color: p.ink, overflow: "hidden" }}>{t.title}</div>
      <div style={{ ...abs(14, CARD_H - 14 - 22, CARD_W - 28, 22), display: "flex", alignItems: "center", gap: 8 * k }}>
        <span style={{ ...mono, color: p.ink2, background: p.fill, borderRadius: RADIUS.chip * u, padding: `${3 * k}px ${7 * k}px`, lineHeight: 1 }}>{t.tag}</span>
        <span style={{ ...mono, color: p.ink3 }}>{t.id}</span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            width: 22 * k,
            height: 22 * k,
            borderRadius: 999,
            background: p.fill,
            boxShadow: dark ? `inset 0 0 0 ${hair}px ${p.line}` : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10 * k,
            fontWeight: 500,
            color: p.ink2,
          }}
        >
          {t.who}
        </span>
      </div>
    </div>
  );

  const cols = [p.col1, p.col2, p.col3];
  const counts = [
    <span key="c0" style={{ fontFamily: FONT_MONO, fontSize: 12 * k, color: p.ink2 }}>2</span>,
    <Roll key="c1" from={doingCount.from} to={doingCount.to} t={doingCount.t} k={k} color={p.ink2} />,
    <Roll key="c2" from={doneCount.from} to={doneCount.to} t={doneCount.t} k={k} color={p.ink2} />,
  ];

  // placeholder: a dashed accent outline in Done's first slot
  const ph = slotPos(2, 0);
  const phScale = 0.94 + 0.06 * open;

  const liftShadow = dark
    ? `inset 0 0 0 ${hair}px ${p.line}`
    : `inset 0 0 0 ${hair}px ${p.line}, 0 ${16 * lift * u}px ${36 * u}px rgba(0,0,0,${(0.13 * lift).toFixed(3)}), 0 ${2 * lift * u}px ${6 * u}px rgba(0,0,0,${(0.05 * lift).toFixed(3)})`;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: boardW * k, height: boardH * k }}>
        {/* board header */}
        <div style={{ ...abs(4, 0, boardW - 8, BOARD_HEAD - 16), display: "flex", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 22 * k, fontWeight: 500, letterSpacing: "-0.03em", color: p.ink }}>{p.board}</span>
          <span style={{ ...mono, fontSize: 11 * k, letterSpacing: "0.12em", color: p.ink3 }}>OCT 14 – OCT 28</span>
        </div>

        {/* columns */}
        {cols.map((name, c) => {
          const [x, y, w, h] = colBox(c);
          return (
            <div key={`col${c}`} style={{ ...abs(x, y, w, h), borderRadius: RADIUS.card * u, background: p.fill }}>
              <div style={{ ...abs(COL_PAD + 2, 0, w - 2 * COL_PAD, COL_HEAD), display: "flex", alignItems: "center", gap: 8 * k, whiteSpace: "nowrap" }}>
                <StatusIcon kind={c} size={14 * k} color={c === 0 ? p.ink3 : p.ink2} bg={p.fill} />
                <span style={{ fontSize: 14 * k, fontWeight: 500, letterSpacing: "-0.01em", color: p.ink }}>{name}</span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20 * k, padding: `0 ${5 * k}px`, borderRadius: RADIUS.chip * u, background: p.card, boxShadow: `inset 0 0 0 ${hair}px ${p.line}` }}>
                  {counts[c]}
                </span>
              </div>
            </div>
          );
        })}

        {/* resting cards */}
        {TODO.map((t, s) => card(`a${s}`, t, slotPos(0, s)))}
        {DOING.map((t, s) => card(`b${s}`, t, slotPos(1, s + 1 - close)))}
        {DONE.map((t, s) => card(`c${s}`, t, slotPos(2, s + open)))}

        {placeholder > 0.001 ? (
          <svg
            width={CARD_W * k}
            height={CARD_H * k}
            style={{ position: "absolute", left: ph[0] * k, top: ph[1] * k, opacity: placeholder, transform: `scale(${phScale})`, overflow: "visible" }}
          >
            <rect
              x={(STROKE.hair * u) / 2}
              y={(STROKE.hair * u) / 2}
              width={CARD_W * k - STROKE.hair * u}
              height={CARD_H * k - STROKE.hair * u}
              rx={RADIUS.button * u}
              fill={alpha(p.accent, 0.06)}
              stroke={p.accent}
              strokeWidth={STROKE.hair * u}
              strokeDasharray={`${6 * u} ${5 * u}`}
            />
          </svg>
        ) : null}

        {/* the moving card */}
        {card("mover", { title: p.task, ...MOVER }, pos, {
          boxShadow: liftShadow,
          transform: `translateY(${-4 * lift * k}px) rotate(${2 * held}deg) scale(${1 + 0.03 * lift})`,
          zIndex: 5,
        })}

        {/* cursor */}
        <svg
          width={16 * k}
          height={22 * k}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - k, top: cur[1] * k - k, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})`, zIndex: 10 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
