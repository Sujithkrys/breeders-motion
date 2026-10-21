import React from "react";
import { AbsoluteFill, random } from "remotion";
import { FILM, Logo, SAMPLE, Screenshot, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STATE, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type BeforeAfterProps = {
  problem: string; // hook statement
  beforeLabel: string;
  afterLabel: string;
  counterLabel: string; // "Hours lost this week"
  hoursFrom: number;
  hoursTo: number;
  win1: string;
  win2: string;
  win3: string;
  solution: string; // end title
  brand: string;
  logo: string;
  screenshot: string;
  phoneShot: string;
  hookField: string; // shot 1
  beforeField: string; // shots 2–3: the old way
  afterField: string; // shots 4–5: the new way
  endField: string; // shot 6: the title card
  accent: string; // the split line, checks and the after counter
};

// ---------- timeline (frames of the 480-frame film) ----------
// 0 hook · 80 the old way, wide · 140 the old way, close · 200 the sweep · 260 the new way · 400 the title card.
// The sweep and the new way are one continuous scene: the line wipes the old way off the new one.
export const SHOTS = [0, 80, 140, 200, 260, 400] as const;
export const T = {
  hookBar: [0, 18] as const, // shot 1: the accent bar draws down beside the problem
  hookWords: 0, // shot 1: first word starts rising (local)
  wordDur: 16,
  maxStagger: 8,
  cardDur: 24, // each card's spring
  ticks: [96, 188] as const, // the counter ticks between these frames
  tickRise: 8, // a new number rising into its mask
  shake: { len: 8, amp: 3 }, // frames and px of the pile's flinch on every tick
  badges: [150, 160, 170] as const,
  badgeDur: 18,
  sweep: [200, 248] as const, // the split line crosses the frame
  push: [200, 400] as const, // slow push-in on the after window
  chips: [272, 290, 308] as const,
  chipDur: 22,
  endBar: [0, 22] as const, // shot 6 (local): the full-height line shortens to the title block
  endWords: 8,
  logo: [16, 34] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
export const MARGIN = 72;
export const LINE_H = 1.02;
export const TRACK = -0.04;
export const CAPTION = 22; // Geist Mono captions
export const SHADOW = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
export const TITLE = {
  wide: { barX: 160, gap: 44, right: 160, hook: 110, end: 120, maxLines: 2, logo: 48 },
  tall: { barX: 72, gap: 36, right: 72, hook: 104, end: 120, maxLines: 4, logo: 60 },
} as const;
// Camera on the pile: a slow push on the wide shot, then a cut to a closer framing around the calendar conflicts.
export const CAM = { wideEnd: 1.03, close: 1.32, closeEnd: 1.36, focus: [980, 480] as const, focusTall: [540, 820] as const } as const;
export const AFTER = {
  wide: { winX: 140, winW: 1040, chrome: 48, chipX: 1240, chipW: 560, chipH: 96, chipGap: 20, chipText: 32, push: 1.05 },
  tall: { phoneW: 540, phoneY: 190, chipW: 820, chipH: 104, chipGap: 16, chipText: 38, chipTop: 1408, push: 1.04 },
} as const;

// ---------- the old way: six UI fragments that pile in ----------
export type CardId = "calendar" | "email" | "sheet" | "sticky" | "invite" | "conflict";
export type CardDef = { id: CardId; w: number; h: number; rot: number; at: number; wide: readonly [number, number]; tall: readonly [number, number]; badge?: string };
// Centres in px at 1080 on the short side; `at` is the frame each one lands from.
export const CARDS: CardDef[] = [
  { id: "calendar", w: 720, h: 440, rot: -2, at: 84, wide: [800, 540], tall: [500, 700], badge: "4" },
  { id: "email", w: 520, h: 330, rot: 2.5, at: 94, wide: [1270, 440], tall: [650, 1080], badge: "14" },
  { id: "sheet", w: 560, h: 250, rot: 1.5, at: 104, wide: [640, 800], tall: [430, 1340] },
  { id: "sticky", w: 260, h: 260, rot: -3, at: 114, wide: [1440, 760], tall: [840, 1460] },
  { id: "invite", w: 460, h: 104, rot: -1, at: 124, wide: [1110, 250], tall: [600, 370], badge: "3" },
  { id: "conflict", w: 420, h: 88, rot: 2, at: 134, wide: [1060, 870], tall: [560, 1600] },
];
const BADGED = CARDS.filter((c) => c.badge);

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
const P = CANVAS.paper;

// ---------- type layout: balanced rows, shrunk to fit ----------
const EM_PER_CHAR = 0.54;
const est = (words: string[]) => words.join(" ").length * EM_PER_CHAR;
const greedy = (words: string[], maxEm: number) => {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if (cur.length && est([...cur, w]) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else cur = [...cur, w];
  }
  if (cur.length) rows.push(cur);
  return rows;
};
const wrapBalanced = (text: string, maxEm: number) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const n = greedy(words, maxEm).length;
  let lo = 0;
  let hi = maxEm;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(words, mid).length <= n) hi = mid;
    else lo = mid;
  }
  return greedy(words, hi);
};
export const fitRows = (text: string, maxW: number, base: number, maxLines: number) => {
  let size = base;
  let rows = wrapBalanced(text, maxW / size);
  for (let i = 0; i < 7; i++) {
    const longest = Math.max(0, ...rows.map(est)) * size;
    if (rows.length <= maxLines && longest <= maxW) break;
    size *= 0.9;
    rows = wrapBalanced(text, maxW / size);
  }
  return { rows, size };
};

// A masked row is LINE_H + 0.08em tall (padding 0.04 + 0.18, margin −0.14). From Inter's metrics (ascent 0.969,
// descent 0.242, cap height 0.727) the first cap top and each baseline sit at fixed offsets inside it, so the accent
// bar can run exactly from the first row's cap top to the last row's baseline.
export const STRIDE = LINE_H + 0.08;
const BASELINE = 0.04 + (LINE_H - 1.211) / 2 + 0.969;
const CAP_TOP = BASELINE - 0.727;

// The title block shared by the hook and the end card: bar at the left, type beside it, centred vertically on the bar.
export const titleLayout = (text: string, kind: "hook" | "end", tall: boolean, W: number, H: number, u: number) => {
  const L = tall ? TITLE.tall : TITLE.wide;
  const barX = L.barX * u;
  const textX = barX + STROKE.bar * u + L.gap * u;
  const maxW = W - textX - L.right * u;
  const { rows, size } = fitRows(text, maxW, L[kind] * u, L.maxLines);
  const n = Math.max(1, rows.length);
  const capTop = CAP_TOP * size;
  const lastBase = ((n - 1) * STRIDE + BASELINE) * size;
  const blockTop = H / 2 - (capTop + lastBase) / 2;
  return { rows, size, barX, textX, maxW, blockTop, barTop: blockTop + capTop, barBottom: blockTop + lastBase };
};

// Counter values: the hours tick from `from` to `to` in at most 10 even steps between T.ticks.
export const tickPlan = (from: number, to: number) => {
  const a = Math.round(Number(from) || 0);
  const b = Math.round(Number(to) || 0);
  const n = Math.max(0, Math.min(10, b - a));
  const step = n ? (T.ticks[1] - T.ticks[0]) / n : 0;
  const ticks = Array.from({ length: n }, (_, i) => Math.round(T.ticks[0] + step * (i + 1) - step / 2));
  const values = Array.from({ length: n }, (_, i) => Math.round(mix(a, b, (i + 1) / n)));
  return { a, ticks, values };
};

// Chip copy shrinks only if it would overflow its chip.
const fitText = (text: string, room: number, base: number) => Math.min(base, room / Math.max(1, (text || "").length * 0.55));

// ---------- pieces ----------
const Rise: React.FC<{ rows: string[][]; local: number; start: number }> = ({ rows, local, start }) => {
  let k = 0;
  return (
    <>
      {rows.map((words, r) => {
        const first = k;
        k += words.length;
        return (
          <div key={r} style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em -0.08em" }}>
            <div style={{ display: "flex", gap: "0.25em", whiteSpace: "nowrap", lineHeight: LINE_H }}>
              {words.map((w, i) => {
                const s = start + STAGGER * Math.min(first + i, T.maxStagger);
                const t = progress(local, s, s + T.wordDur, "enter");
                return (
                  <span key={i} style={{ display: "inline-block", transform: `translateY(${((1 - t) * 115).toFixed(3)}%)` }}>
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

const TitleType: React.FC<{ lay: ReturnType<typeof titleLayout>; ink: string; local: number; start: number }> = ({ lay, ink, local, start }) => (
  <div
    style={{
      position: "absolute",
      left: lay.textX,
      top: lay.blockTop,
      fontFamily: FONT_SANS,
      fontSize: lay.size,
      fontWeight: 500,
      letterSpacing: `${TRACK}em`,
      color: ink,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
    }}
  >
    <Rise rows={lay.rows} local={local} start={start} />
  </div>
);

// Top-left caption: a state dot and the label, Geist Mono.
const Caption: React.FC<{ u: number; text: string; dot: string; ink: string }> = ({ u, text, dot, ink }) => (
  <div style={{ position: "absolute", left: MARGIN * u, top: MARGIN * u, display: "flex", alignItems: "center", gap: 12 * u }}>
    <div style={{ width: 10 * u, height: 10 * u, borderRadius: 5 * u, background: dot }} />
    <div style={{ fontFamily: FONT_MONO, fontSize: CAPTION * u, lineHeight: 1, color: alpha(ink, 0.55), whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

// Top-right counter: "Hours lost this week: 9". A new value rises into its mask on every tick.
const Counter: React.FC<{ u: number; label: string; value: number; since: number; ink: string; numColor: string; frame: number }> = ({
  u,
  label,
  value,
  since,
  ink,
  numColor,
  frame,
}) => {
  const t = since < 0 ? 1 : progress(frame, since, since + T.tickRise, "enter");
  return (
    <div style={{ position: "absolute", right: MARGIN * u, top: MARGIN * u, display: "flex", alignItems: "center", gap: 10 * u, fontFamily: FONT_MONO, fontSize: CAPTION * u, lineHeight: 1 }}>
      <div style={{ color: alpha(ink, 0.55), whiteSpace: "nowrap" }}>{`${label}:`}</div>
      <div style={{ overflow: "hidden", padding: `${2 * u}px 0` }}>
        <div style={{ color: numColor, fontWeight: 500, transform: `translateY(${((1 - t) * 110).toFixed(3)}%)` }}>{`${value}`}</div>
      </div>
    </div>
  );
};

// ---------- the fragments (each one surface + one SVG, so text stays cheap to export) ----------
const fmt = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
type Block = { d: number; s: number; len: number; label: string; bad?: boolean; off?: boolean; time?: boolean };
const CAL = { gridX: 64, gridR: 696, top: 112, bottom: 424, startH: 9, hours: 5 } as const;
const CAL_BLOCKS: Block[] = [
  { d: 0, s: 9, len: 0.5, label: "Standup" },
  { d: 0, s: 10, len: 1.5, label: "Planning sync", bad: true },
  { d: 0, s: 10.5, len: 1.25, label: "Roadmap", bad: true, off: true },
  { d: 1, s: 9.5, len: 1, label: "Weekly sync", bad: true },
  { d: 1, s: 10, len: 1, label: "Sync (2)", bad: true, off: true },
  { d: 1, s: 12, len: 1, label: "1:1 Maya", time: true },
  { d: 2, s: 9, len: 1, label: "All hands", time: true },
  { d: 2, s: 11, len: 1, label: "Agenda", bad: true },
  { d: 2, s: 11.5, len: 1, label: "Planning", bad: true, off: true },
  { d: 3, s: 9, len: 1.5, label: "Re-plan week", bad: true },
  { d: 3, s: 9.5, len: 1, label: "Focus", off: true },
  { d: 4, s: 9, len: 0.5, label: "Sync" },
  { d: 4, s: 12, len: 1, label: "Retro", time: true },
];
const DAYS = ["Mon 8", "Tue 9", "Wed 10", "Thu 11", "Fri 12"];

const CalendarBody: React.FC = () => {
  const colW = (CAL.gridR - CAL.gridX) / 5;
  const rowH = (CAL.bottom - CAL.top) / CAL.hours;
  let grid = `M0 68 H720 `;
  for (let i = 0; i <= CAL.hours; i++) grid += `M${CAL.gridX} ${CAL.top + i * rowH} H${CAL.gridR} `;
  for (let d = 0; d <= 5; d++) grid += `M${CAL.gridX + d * colW} 80 V${CAL.bottom} `;
  return (
    <svg viewBox="0 0 720 440" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
      <path d={grid} stroke={P.line} strokeWidth={STROKE.hair} fill="none" />
      <text x={24} y={46} fontSize={22} fontWeight={500} fill={P.ink} letterSpacing={-0.3}>
        June 8 – 12
      </text>
      <text x={168} y={46} fontSize={18} fill={P.ink3}>
        Week 24
      </text>
      <circle cx={566} cy={40} r={5} fill={STATE.error} />
      <text x={580} y={46} fontSize={15} fontFamily={FONT_MONO} fill={STATE.error}>
        4 conflicts
      </text>
      {DAYS.map((d, i) => (
        <text key={d} x={CAL.gridX + i * colW + 10} y={100} fontSize={15} fill={P.ink2}>
          {d}
        </text>
      ))}
      {Array.from({ length: CAL.hours }, (_, i) => (
        <text key={i} x={24} y={CAL.top + i * rowH + 16} fontSize={13} fontFamily={FONT_MONO} fill={P.ink3}>
          {`${CAL.startH + i}`}
        </text>
      ))}
      {CAL_BLOCKS.map((b, i) => {
        const shift = b.off ? 30 : 0;
        const x = CAL.gridX + b.d * colW + 4 + shift;
        const y = CAL.top + (b.s - CAL.startH) * rowH + 2;
        const w = colW - 8 - shift;
        const h = b.len * rowH - 4;
        return (
          <g key={i}>
            {b.off ? <rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx={7} fill={FILM.white} /> : null}
            <rect x={x} y={y} width={w} height={h} rx={6} fill={b.bad ? FILM.white : P.fill} />
            {b.bad ? <rect x={x} y={y} width={w} height={h} rx={6} fill={alpha(STATE.error, 0.12)} /> : null}
            {b.bad ? <rect x={x} y={y} width={3} height={h} fill={STATE.error} /> : null}
            <text x={x + 10} y={y + 19} fontSize={13} fontWeight={500} fill={b.bad ? STATE.error : P.ink2}>
              {b.label}
            </text>
            {b.time ? (
              <text x={x + 10} y={y + 36} fontSize={11} fontFamily={FONT_MONO} fill={P.ink3}>
                {fmt(b.s)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

const MAIL = [
  { name: "Ana Kovac", line: "Re: Re: Fwd: Planning for next week", time: "9:41", ini: "AK" },
  { name: "Leo Tanaka", line: "Can we move Thursday? Again.", time: "9:38", ini: "LT" },
  { name: "Ravi Shah", line: "Re: Who owns the launch spec?", time: "9:12", ini: "RS" },
  { name: "Dana Noor", line: "Agenda (v4) for the planning sync", time: "8:57", ini: "DN" },
];
const EmailBody: React.FC = () => {
  let lines = "M0 62 H520 ";
  for (let i = 1; i < MAIL.length; i++) lines += `M72 ${62 + i * 66} H520 `;
  return (
    <svg viewBox="0 0 520 330" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
      <path d={lines} stroke={P.line} strokeWidth={STROKE.hair} fill="none" />
      <text x={24} y={40} fontSize={20} fontWeight={500} fill={P.ink} letterSpacing={-0.2}>
        Inbox
      </text>
      <text x={496} y={40} fontSize={14} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="end">
        14 unread
      </text>
      {MAIL.map((m, i) => {
        const y0 = 62 + i * 66;
        return (
          <g key={m.name}>
            <circle cx={42} cy={y0 + 33} r={16} fill={P.fill} />
            <text x={42} y={y0 + 37.5} fontSize={12} fontWeight={500} fill={P.ink2} textAnchor="middle">
              {m.ini}
            </text>
            <text x={72} y={y0 + 28} fontSize={16} fontWeight={500} fill={P.ink}>
              {m.name}
            </text>
            <text x={72} y={y0 + 50} fontSize={14} fill={P.ink2}>
              {m.line}
            </text>
            <text x={496} y={y0 + 28} fontSize={12} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="end">
              {m.time}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SHEET_COLS = [36, 232, 336, 426, 560];
const SHEET_ROWS = [
  ["Task", "Owner", "Hours", "Status"],
  ["Launch spec", "Maya", "6", "Blocked"],
  ["Design review", "Ana", "3", "?"],
  ["Roadmap", "Leo", "#REF!", "Late"],
  ["Sync prep", "Ravi", "4", "Moved"],
];
const SheetBody: React.FC = () => {
  const rowY = (r: number) => 64 + r * 34;
  let grid = "M0 40 H560 ";
  for (let r = 0; r <= SHEET_ROWS.length; r++) grid += `M0 ${rowY(r)} H560 `;
  for (let c = 0; c < SHEET_COLS.length - 1; c++) grid += `M${SHEET_COLS[c]} 40 V${rowY(SHEET_ROWS.length)} `;
  return (
    <svg viewBox="0 0 560 250" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
      <rect x={0} y={40} width={560} height={24} fill={P.fill} />
      <rect x={0} y={64} width={36} height={170} fill={P.fill} />
      <path d={grid} stroke={P.line} strokeWidth={STROKE.hair} fill="none" />
      <text x={20} y={26} fontSize={13} fontFamily={FONT_MONO} fill={P.ink2}>
        week-plan-v7-final (2).xlsx
      </text>
      <text x={540} y={26} fontSize={13} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="end">
        Edited 2m ago
      </text>
      {["A", "B", "C", "D"].map((l, i) => (
        <text key={l} x={(SHEET_COLS[i] + SHEET_COLS[i + 1]) / 2} y={57} fontSize={12} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="middle">
          {l}
        </text>
      ))}
      {SHEET_ROWS.map((row, r) => (
        <g key={r}>
          <text x={18} y={rowY(r) + 22} fontSize={12} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="middle">
            {`${r + 1}`}
          </text>
          {row.map((cell, c) => (
            <text
              key={c}
              x={SHEET_COLS[c] + 12}
              y={rowY(r) + 22}
              fontSize={14}
              fontWeight={r === 0 || cell === "#REF!" ? 500 : 400}
              fill={cell === "#REF!" ? STATE.error : cell === "?" ? P.ink3 : r === 0 ? P.ink : P.ink2}
            >
              {cell}
            </text>
          ))}
        </g>
      ))}
      <rect x={SHEET_COLS[3] + 1} y={rowY(1) + 1} width={SHEET_COLS[4] - SHEET_COLS[3] - 2} height={32} fill="none" stroke={P.ink} strokeWidth={STROKE.ring} />
      <rect x={SHEET_COLS[4] - 6} y={rowY(2) - 4} width={6} height={6} fill={P.ink} />
    </svg>
  );
};

const StickyBody: React.FC = () => (
  <svg viewBox="0 0 260 260" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
    <text x={24} y={40} fontSize={13} fontFamily={FONT_MONO} fill={alpha(FILM.black, 0.5)} letterSpacing={1.4}>
      TODO
    </text>
    {[
      ["Ask Ana if Thu", 84],
      ["still works", 112],
      ["Move 1:1 (again)", 156],
      ["Who runs planning?", 200],
    ].map(([t, y]) => (
      <text key={t as string} x={24} y={y as number} fontSize={20} fontWeight={500} fill={FILM.black} letterSpacing={-0.2}>
        {t as string}
      </text>
    ))}
    <path d="M22 150 H186" stroke={FILM.black} strokeWidth={STROKE.hair} />
  </svg>
);

const InviteBody: React.FC = () => (
  <svg viewBox="0 0 460 104" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
    <rect x={20} y={22} width={56} height={60} rx={8} fill={P.fill} />
    <text x={48} y={44} fontSize={11} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="middle" letterSpacing={1}>
      WED
    </text>
    <text x={48} y={70} fontSize={22} fontWeight={500} fill={P.ink} textAnchor="middle">
      10
    </text>
    <text x={92} y={46} fontSize={18} fontWeight={500} fill={P.ink} letterSpacing={-0.2}>
      Planning sync (3rd)
    </text>
    <text x={92} y={72} fontSize={14} fill={P.ink2}>
      10:00 · 8 guests · <tspan fill={STATE.error}>conflict</tspan>
    </text>
    <rect x={356} y={34} width={84} height={36} rx={8} fill={P.button} />
    <text x={398} y={57} fontSize={14} fontWeight={500} fill={P.onButton} textAnchor="middle">
      Accept
    </text>
  </svg>
);

const ConflictBody: React.FC = () => (
  <svg viewBox="0 0 420 88" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} fontFamily={FONT_SANS}>
    <circle cx={30} cy={44} r={6} fill={STATE.error} />
    <text x={48} y={50} fontSize={17} fontWeight={500} fill={P.ink} letterSpacing={-0.2}>
      2 events overlap at 10:00
    </text>
    <text x={396} y={49} fontSize={13} fontFamily={FONT_MONO} fill={P.ink3} textAnchor="end">
      Resolve
    </text>
  </svg>
);

const BODY: Record<CardId, React.FC> = {
  calendar: CalendarBody,
  email: EmailBody,
  sheet: SheetBody,
  sticky: StickyBody,
  invite: InviteBody,
  conflict: ConflictBody,
};
const surfaceOf = (id: CardId) =>
  id === "sticky"
    ? { bg: FILM.lime, radius: RADIUS.chip }
    : id === "invite" || id === "conflict"
      ? { bg: FILM.white, radius: RADIUS.button }
      : { bg: FILM.white, radius: RADIUS.card };

// The pile flinches a few px on every counter tick, decaying over T.shake.len frames.
const shakeAt = (frame: number, ticks: number[], seed: number, u: number): [number, number] => {
  let dx = 0;
  let dy = 0;
  for (const tk of ticks) {
    const k = frame - tk;
    if (k < 0 || k >= T.shake.len) continue;
    const a = (1 - k / T.shake.len) * T.shake.amp * u;
    dx += a * Math.sin(k * 2.4 + seed);
    dy += a * Math.cos(k * 2.1 + seed * 1.7);
  }
  return [dx, dy];
};

// Camera on the pile: slow push about the centre (wide), then the closer framing about the focus point.
export const cameraAt = (frame: number, W: number, H: number, u: number, tall: boolean) => {
  if (frame < SHOTS[2]) return { s: mix(1, CAM.wideEnd, progress(frame, SHOTS[1], SHOTS[2], "travel")), ox: W / 2, oy: H / 2 };
  const fo = tall ? CAM.focusTall : CAM.focus;
  return { s: mix(CAM.close, CAM.closeEnd, progress(frame, SHOTS[2], SHOTS[3], "travel")), ox: fo[0] * u, oy: fo[1] * u };
};

// ---------- scenes ----------
const HookScene: React.FC<{ p: BeforeAfterProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const lay = titleLayout(p.problem, "hook", isVertical, W, H, u);
  const ink = textOn(p.hookField);
  const bar = progress(local, T.hookBar[0], T.hookBar[1], "enter");
  const plan = tickPlan(p.hoursFrom, p.hoursTo);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: lay.barX,
          top: lay.barTop,
          width: STROKE.bar * u,
          height: lay.barBottom - lay.barTop,
          background: p.accent,
          transformOrigin: "50% 0%",
          transform: `scaleY(${bar.toFixed(4)})`,
        }}
      />
      <TitleType lay={lay} ink={ink} local={local} start={T.hookWords} />
      <Counter u={u} label={p.counterLabel} value={plan.a} since={-1} ink={ink} numColor={ink} frame={local} />
    </>
  );
};

const BeforeScene: React.FC<{ p: BeforeAfterProps; frame: number; clip?: string }> = ({ p, frame, clip }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const ink = textOn(p.beforeField);
  const plan = tickPlan(p.hoursFrom, p.hoursTo);
  const passed = plan.ticks.filter((t) => frame >= t).length;
  const value = passed ? plan.values[passed - 1] : plan.a;
  const since = passed ? plan.ticks[passed - 1] : -1;
  const cam = cameraAt(frame, W, H, u, isVertical);
  return (
    <AbsoluteFill style={{ background: p.beforeField, clipPath: clip }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cam.ox}px ${cam.oy}px`, transform: `scale(${cam.s.toFixed(4)})` }}>
        {CARDS.map((c, i) => {
          const t = progress(frame, c.at, c.at + T.cardDur, "spring");
          if (t <= 0) return null;
          const [cx, cy] = isVertical ? c.tall : c.wide;
          const seed = random(`before-after-${c.id}`) * Math.PI * 2;
          const [dx, dy] = shakeAt(frame, plan.ticks, seed, u);
          const bi = BADGED.indexOf(c);
          const bt = bi >= 0 ? progress(frame, T.badges[bi], T.badges[bi] + T.badgeDur, "spring") : 0;
          const s = surfaceOf(c.id);
          const Body = BODY[c.id];
          return (
            <div
              key={c.id}
              style={{
                position: "absolute",
                left: (cx - c.w / 2) * u,
                top: (cy - c.h / 2) * u,
                width: c.w * u,
                height: c.h * u,
                opacity: Math.min(1, t * 2),
                transform: `translate(${dx.toFixed(2)}px, ${(dy + (1 - t) * 180 * u).toFixed(2)}px) rotate(${c.rot}deg)`,
                zIndex: i,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: s.bg,
                  borderRadius: s.radius * u,
                  overflow: "hidden",
                  boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, 0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`,
                }}
              >
                <Body />
              </div>
              {bt > 0 && c.badge ? (
                <div
                  style={{
                    position: "absolute",
                    right: -14 * u,
                    top: -14 * u,
                    minWidth: 40 * u,
                    height: 40 * u,
                    padding: `0 ${10 * u}px`,
                    boxSizing: "border-box",
                    borderRadius: 20 * u,
                    background: STATE.error,
                    color: FILM.white,
                    fontFamily: FONT_SANS,
                    fontSize: 18 * u,
                    fontWeight: 600,
                    lineHeight: `${40 * u}px`,
                    textAlign: "center",
                    opacity: Math.min(1, bt * 1.5),
                    transform: `scale(${mix(0.6, 1, bt).toFixed(4)})`,
                  }}
                >
                  {c.badge}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <Caption u={u} text={p.beforeLabel} dot={STATE.error} ink={ink} />
      <Counter u={u} label={p.counterLabel} value={value} since={since} ink={ink} numColor={ink} frame={frame} />
    </AbsoluteFill>
  );
};

const Check: React.FC<{ size: number; accent: string }> = ({ size, accent }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0, display: "block" }}>
    <circle cx={20} cy={20} r={20} fill={accent} />
    <path d="M12.5 20.5 L17.5 25.5 L27.5 15" stroke={FILM.white} strokeWidth={STROKE.ring} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const afterGeometry = (W: number, H: number, u: number, tall: boolean) => {
  if (tall) {
    const A = AFTER.tall;
    const w = A.phoneW * u;
    const h = (w * 19.5) / 9;
    return { tall, x: (W - w) / 2, y: A.phoneY * u, w, h, chrome: 0, chipX: (W - A.chipW * u) / 2, chipTop: A.chipTop * u, chipW: A.chipW * u, chipH: A.chipH * u, chipGap: A.chipGap * u, chipText: A.chipText * u, push: A.push };
  }
  const A = AFTER.wide;
  const w = A.winW * u;
  const h = (w * 10) / 16 + A.chrome * u;
  const y = (H - h) / 2 + 10 * u;
  const stack = 3 * A.chipH * u + 2 * A.chipGap * u;
  return { tall, x: A.winX * u, y, w, h, chrome: A.chrome * u, chipX: A.chipX * u, chipTop: y + h / 2 - stack / 2, chipW: A.chipW * u, chipH: A.chipH * u, chipGap: A.chipGap * u, chipText: A.chipText * u, push: A.push };
};

const AfterScene: React.FC<{ p: BeforeAfterProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const ink = textOn(p.afterField);
  const G = afterGeometry(W, H, u, isVertical);
  const push = mix(1, G.push, progress(frame, T.push[0], T.push[1], "travel"));
  const soft = `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;
  const host = `${(p.brand || "app").toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
  const wins = [p.win1, p.win2, p.win3];
  return (
    <AbsoluteFill style={{ background: p.afterField }}>
      {isVertical ? (
        <Screenshot
          src={p.phoneShot || SAMPLE.phone}
          x={G.x}
          y={G.y}
          w={G.w}
          h={G.h}
          radius={RADIUS.hero * u}
          line={alpha(FILM.black, 0.06)}
          shadow={soft}
          style={{ transform: `scale(${push.toFixed(4)})` }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            left: G.x,
            top: G.y,
            width: G.w,
            height: G.h,
            borderRadius: RADIUS.card * u,
            overflow: "hidden",
            background: FILM.white,
            boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, ${soft}`,
            transform: `scale(${push.toFixed(4)})`,
          }}
        >
          <svg viewBox={`0 0 ${AFTER.wide.winW} ${AFTER.wide.chrome}`} width={G.w} height={G.chrome} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={`M0 ${AFTER.wide.chrome - 0.5} H${AFTER.wide.winW}`} stroke={P.line} strokeWidth={STROKE.hair} />
            {[28, 48, 68].map((cx) => (
              <circle key={cx} cx={cx} cy={24} r={6} fill={P.line} />
            ))}
            <rect x={AFTER.wide.winW / 2 - 130} y={10} width={260} height={28} rx={8} fill={P.fill} />
            <text x={AFTER.wide.winW / 2} y={29} fontSize={14} fontFamily={FONT_MONO} fill={P.ink2} textAnchor="middle">
              {host}
            </text>
          </svg>
          <Screenshot src={p.screenshot || SAMPLE.site} x={0} y={G.chrome} w={G.w} h={G.h - G.chrome} radius={0} />
        </div>
      )}
      {wins.map((w, i) => {
        const t = progress(frame, T.chips[i], T.chips[i] + T.chipDur, "spring");
        if (t <= 0) return null;
        const check = (isVertical ? 44 : 40) * u;
        const pad = 24 * u;
        const index = 40 * u;
        const size = fitText(w, G.chipW - 2 * pad - check - 20 * u - index, G.chipText);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: G.chipX,
              top: G.chipTop + i * (G.chipH + G.chipGap),
              width: G.chipW,
              height: G.chipH,
              boxSizing: "border-box",
              padding: `0 ${pad}px`,
              borderRadius: RADIUS.button * u,
              background: FILM.white,
              boxShadow: `0 0 0 ${u}px ${alpha(FILM.black, 0.08)}, ${soft}`,
              display: "flex",
              alignItems: "center",
              gap: 20 * u,
              opacity: Math.min(1, t * 1.6),
              transform: `translateY(${((1 - t) * 48 * u).toFixed(2)}px)`,
            }}
          >
            <Check size={check} accent={p.accent} />
            <div style={{ flex: 1, fontFamily: FONT_SANS, fontSize: size, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1, color: FILM.black, whiteSpace: "nowrap" }}>{w}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18 * u, lineHeight: 1, color: alpha(FILM.black, 0.4) }}>{`0${i + 1}`}</div>
          </div>
        );
      })}
      <Caption u={u} text={p.afterLabel} dot={p.accent} ink={ink} />
      <Counter u={u} label={p.counterLabel} value={0} since={-1} ink={ink} numColor={p.accent} frame={frame} />
    </AbsoluteFill>
  );
};

// The split line: full height (16:9) or full width (9:16), crossing on travel. Returns its leading position in px.
export const sweepAt = (frame: number, W: number, H: number, u: number, tall: boolean) => {
  const t = progress(frame, T.sweep[0], T.sweep[1], "travel");
  const half = (STROKE.bar * u) / 2;
  return mix(-half, (tall ? H : W) + half, t);
};

const EndScene: React.FC<{ p: BeforeAfterProps; local: number }> = ({ p, local }) => {
  const { u, width: W, height: H, isVertical } = useLayout();
  const L = isVertical ? TITLE.tall : TITLE.wide;
  const lay = titleLayout(p.solution, "end", isVertical, W, H, u);
  const ink = textOn(p.endField);
  const c = progress(local, T.endBar[0], T.endBar[1], "travel");
  const top = mix(0, lay.barTop, c);
  const bottom = mix(H, lay.barBottom, c);
  const l = progress(local, T.logo[0], T.logo[1], "enter");
  return (
    <>
      <div style={{ position: "absolute", left: lay.barX, top, width: STROKE.bar * u, height: bottom - top, background: p.accent }} />
      <TitleType lay={lay} ink={ink} local={local} start={T.endWords} />
      <div style={{ position: "absolute", left: lay.barX, bottom: MARGIN * u, opacity: l, transform: `translateY(${((1 - l) * 16 * u).toFixed(3)}px)` }}>
        <Logo src={p.logo || undefined} name={p.brand} size={L.logo * u} color={ink} tile={ink} onTile={p.endField} />
      </div>
    </>
  );
};

export const BeforeAfter: React.FC<BeforeAfterProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  const { u, width: W, height: H, isVertical } = useLayout();
  const bg = index === 0 ? p.hookField : index <= 2 ? p.beforeField : index <= 4 ? p.afterField : p.endField;
  const line = sweepAt(frame, W, H, u, isVertical);
  const half = (STROKE.bar * u) / 2;
  const clip = isVertical ? `inset(${Math.max(0, line).toFixed(2)}px 0px 0px 0px)` : `inset(0px 0px 0px ${Math.max(0, line).toFixed(2)}px)`;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index === 0 ? <HookScene p={p} local={local} /> : null}
      {index === 1 || index === 2 ? <BeforeScene p={p} frame={frame} /> : null}
      {index === 3 || index === 4 ? <AfterScene p={p} frame={frame} /> : null}
      {index === 3 && line < (isVertical ? H : W) + half ? (
        <>
          <BeforeScene p={p} frame={frame} clip={clip} />
          <div
            style={
              isVertical
                ? { position: "absolute", left: 0, top: line - half, width: W, height: STROKE.bar * u, background: p.accent }
                : { position: "absolute", left: line - half, top: 0, width: STROKE.bar * u, height: H, background: p.accent }
            }
          />
        </>
      ) : null}
      {index === 5 ? <EndScene p={p} local={local} /> : null}
    </AbsoluteFill>
  );
};
