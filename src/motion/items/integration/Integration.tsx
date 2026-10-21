import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { FILM, SAMPLE, useShot } from "../../film";
import { CANVAS, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, easing, mix, progress, useLayout } from "../../kit";

export type IntegrationProps = {
  brand: string;
  partner: string;
  logo: string; // the user's app icon or logo
  partnerLogo: string; // the partner's app icon
  event1: string; // the booking on the event card
  event2: string; // the message the partner app receives
  headline: string;
  cta: string;
  field: string; // shots 1–2
  end: string; // shot 3: the title card
  accent: string; // data pulses, event bar, badge, CTA dot
  iconTile: boolean; // white tile behind both icons (for transparent logos)
};

// ---------- timeline (frames of the 240-frame film) ----------
// Shots 1–2 share one field and one camera (the cut at 72 is invisible); 168 is a hard cut to the title card.
export const SHOTS = [0, 72, 168] as const;
export const T = {
  // shot 1 (film frames)
  marks: [4, 22] as const, // corner marks fade in
  tileA: [0, 26] as const, // the user's icon slides in (spring)
  tileB: [3, 29] as const, // the partner icon slides in (spring)
  captions: [16, 34] as const,
  draw: [22, 42] as const, // the connector draws on
  chip: [34, 52] as const, // the "+" chip pops (spring)
  pulseStart: 40, // data pulses run from here (linear)
  pulsePeriod: 30, // frames for one dot to cross
  pulseGap: 10, // frames between dots
  pulses: 3,
  // shot 2 (local)
  camera: [0, 40] as const, // pull back (travel)
  card1: [8, 40] as const, // event card flies (spring)
  card2: [30, 62] as const, // message card flies (spring)
  badge: [54, 70] as const, // unread badge on the partner icon (spring)
  // shot 3 (local)
  wordStart: 2,
  wordDur: 16,
  maxStagger: 8,
  rule: [6, 34] as const, // hairline draws across (travel)
  icons: [12, 30] as const, // end icons rise (enter), siblings 3f apart
  cta: [21, 39] as const,
} as const;

// ---------- sizes (px at 1080 on the short side) ----------
// Icons, connector and captions are sized in world units (as drawn in shot 1, before the camera pulls back).
// Card sizes (cardW and every size inside the cards) are given as rendered after the pull-back, so card text stays
// at least 28px on screen; in the world they are drawn at size / CAMERA.scale.
export const SIZE = {
  wide: {
    tile: 280, gap: 560, pad: 36, port: 36, arc: 56, caption: 22, captionGap: 24,
    cardW: 560, title: 120, titleMaxW: 1400, maxLines: 2, endIcon: 72, cta: 24,
  },
  tall: {
    tile: 240, gap: 640, pad: 36, port: 90, arc: 48, caption: 22, captionGap: 24,
    cardW: 660, title: 110, titleMaxW: 936, maxLines: 4, endIcon: 80, cta: 24,
  },
} as const;
// The pull-back ends at CAMERA.scale. Wide: the icon row ends wideDy above the frame centre. Tall: the icon column
// glides left to x = tallX, leaving room for the cards on its right.
export const CAMERA = { scale: 0.82, wideDy: -56, tallX: 180 } as const;
export const K = 1 / CAMERA.scale; // rendered card px → world px
// Where each card peels off the connector (0 = the user's icon, 1 = the partner's).
export const PEEL = { wide: [0.12, 0.88], tall: [0.1, 0.9] } as const;
// Final card places, in screen px after the camera lands. Wide: the event card hangs above the user's icon (bottom-
// centre anchor), the message card below the partner's (top-centre anchor); dx from the frame centre, dy from the icon
// row. Together with the icons they span 1440px, 75% of the width. Tall: each card's left edge at x, vertically
// centred on its own icon; icons + cards span 81–999px, 85% of the width.
export const CARD_WIDE = [{ dx: -440, dy: -151 }, { dx: 440, dy: 189 }] as const;
export const CARD_TALL = { x: 339 } as const;
export const MARGIN = 72;
export const MARK = 18; // corner marks, Geist Mono
export const TRACK = -0.045;
export const LINE_H = 1.0;
export const TITLE_LIFT = 0.2;
export const CHIP = 64;
export const PULSE_R = 8;
export const BADGE = 56;
export const FLY_FROM = 0.4; // card scale as it leaves the icon
export const MESSAGE_TIME = "2:58 PM";

// ---------- colour ----------
export const isDark = (hex: string) => {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5;
};
export const textOn = (bg: string) => (isDark(bg) ? FILM.white : FILM.black);
// Deep green takes its pale green ink, as in the Figma films; every other field takes black or white.
export const endInk = (bg: string) => ((bg || "").toLowerCase() === FILM.green.toLowerCase() ? FILM.greenInk : textOn(bg));
export const softShadow = (u: number) => `0 ${u}px ${2 * u}px ${alpha(FILM.black, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(FILM.black, 0.06)}`;
const ring = (u: number, a = 0.07) => `0 0 0 ${u}px ${alpha(FILM.black, a)}`;

// ---------- geometry (shared with the prompt) ----------
type Pt = { x: number; y: number };
export const bez = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const m = 1 - t;
  return { x: m * m * a.x + 2 * m * t * c.x + t * t * b.x, y: m * m * a.y + 2 * m * t * c.y + t * t * b.y };
};
const bezLength = (a: Pt, c: Pt, b: Pt) => {
  let len = 0;
  let prev = a;
  for (let i = 1; i <= 32; i++) {
    const p = bez(a, c, b, i / 32);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
};

export const geometry = (W: number, H: number, u: number, tall: boolean) => {
  const L = tall ? SIZE.tall : SIZE.wide;
  const half = (L.tile / 2) * u;
  const S = CAMERA.scale;
  const cx = W / 2;
  const ym = H / 2;
  const P = { x: cx, y: ym };
  if (!tall) {
    const A = { x: cx - (L.gap / 2) * u - half, y: ym };
    const B = { x: cx + (L.gap / 2) * u + half, y: ym };
    const a = { x: A.x + half + L.pad * u, y: ym };
    const b = { x: B.x - half - L.port * u, y: ym };
    const c = { x: cx, y: ym - L.arc * u };
    const Q = { x: cx, y: ym + CAMERA.wideDy * u };
    const world = (sx: number, sy: number) => ({ x: P.x + (sx - Q.x) / S, y: P.y + (sy - Q.y) / S });
    return {
      tall, L, half, A, B, a, b, c, P, Q, S,
      fromA: { x: -half - 20 * u, y: ym },
      fromB: { x: W + half + 20 * u, y: ym },
      cards: [
        { at: world(cx + CARD_WIDE[0].dx * u, Q.y + CARD_WIDE[0].dy * u), anchor: [0.5, 1] as const },
        { at: world(cx + CARD_WIDE[1].dx * u, Q.y + CARD_WIDE[1].dy * u), anchor: [0.5, 0] as const },
      ],
      peel: PEEL.wide,
      len: bezLength(a, c, b),
    };
  }
  const A = { x: cx, y: ym - (L.gap / 2) * u - half };
  const B = { x: cx, y: ym + (L.gap / 2) * u + half };
  const a = { x: cx, y: A.y + half + L.port * u };
  const b = { x: cx, y: B.y - half - L.pad * u };
  const c = { x: cx + L.arc * u, y: (a.y + b.y) / 2 };
  const Q = { x: CAMERA.tallX * u, y: ym };
  const wx = P.x + (CARD_TALL.x * u - Q.x) / S;
  return {
    tall, L, half, A, B, a, b, c, P, Q, S,
    fromA: { x: cx, y: -half - 20 * u },
    fromB: { x: cx, y: H + half + 20 * u },
    cards: [
      { at: { x: wx, y: A.y }, anchor: [0, 0.5] as const },
      { at: { x: wx, y: B.y }, anchor: [0, 0.5] as const },
    ],
    peel: PEEL.tall,
    len: bezLength(a, c, b),
  };
};
export type Geometry = ReturnType<typeof geometry>;

// ---------- type layout: balanced rows, shrunk to fit ----------
// Inter 600 at -0.045em averages ~0.52em per character; 0.56 keeps a margin so a row never overflows.
const EM_PER_CHAR = 0.56;
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
  const words = text.trim().split(/\s+/).filter(Boolean);
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

// ---------- pieces ----------
// Each row is its own mask: padding keeps descenders inside the clip, the negative margin gives the space back.
const Rise: React.FC<{ rows: string[][]; local: number }> = ({ rows, local }) => {
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
                const s = T.wordStart + STAGGER * Math.min(first + i, T.maxStagger);
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

// An app icon tile: white behind the image (so transparent logos read as an icon), the image at 100% with contain,
// a hairline and an optional soft shadow.
// `tile` puts a white tile behind the image (for transparent logos); off, the image is the icon itself (an app icon
// that already is a tile). The clip keeps the token radius either way.
const Tile: React.FC<{ src: string; size: number; radius: number; u: number; tile: boolean; shadow?: boolean; style?: React.CSSProperties }> = ({
  src,
  size,
  radius,
  u,
  tile,
  shadow,
  style,
}) => (
  <div
    style={{
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: radius,
      overflow: "hidden",
      background: tile ? FILM.white : "transparent",
      boxShadow: shadow ? softShadow(u) : undefined,
      ...style,
    }}
  >
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    {tile ? <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: `inset ${ring(u, 0.06)}` }} /> : null}
  </div>
);

// Card type and spacing, in px as rendered once the camera has pulled back (drawn at size × K in the world).
export const CARD = {
  pad: 28,
  icon: 32, // header icon, event card
  name: 24, // header brand, event card
  meta: 20, // mono timestamps and the partner label
  gap: 24,
  title: 34, // "New booking"
  body: 28, // event1, event2, the bold sender name
  avatar: 56,
  initial: 24,
  partnerIcon: 28,
  tag: 15,
} as const;

const cardStyle = (u: number, k: number, w: number): React.CSSProperties => ({
  width: w,
  padding: CARD.pad * k * u,
  boxSizing: "border-box",
  background: FILM.white,
  borderRadius: RADIUS.card * k * u,
  boxShadow: `${ring(u, 0.08)}, ${softShadow(u)}`,
  fontFamily: FONT_SANS,
});

const EventCard: React.FC<{ p: IntegrationProps; u: number; k: number; w: number }> = ({ p, u, k, w }) => {
  const C = CANVAS.paper;
  const n = (v: number) => v * k * u;
  const initial = (p.event2.trim().charAt(0) || p.brand.trim().charAt(0) || "M").toUpperCase();
  return (
    <div style={cardStyle(u, k, w)}>
      <div style={{ display: "flex", alignItems: "center", gap: n(12) }}>
        <Tile src={p.logo || SAMPLE.logo} size={n(CARD.icon)} radius={RADIUS.chip * k * u} u={u} tile={p.iconTile} />
        <div style={{ fontSize: n(CARD.name), fontWeight: 500, color: C.ink, letterSpacing: "-0.01em", lineHeight: 1, whiteSpace: "nowrap" }}>{p.brand}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: FONT_MONO, fontSize: n(CARD.meta), color: C.ink3, lineHeight: 1 }}>now</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: n(20), marginTop: n(CARD.gap) }}>
        <div style={{ width: STROKE.bar * k * u, alignSelf: "stretch", borderRadius: 999, background: p.accent }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: n(CARD.title), fontWeight: 600, color: C.ink, letterSpacing: "-0.025em", lineHeight: 1.15, whiteSpace: "nowrap" }}>New booking</div>
          <div style={{ fontSize: n(CARD.body), color: C.ink2, letterSpacing: "-0.01em", lineHeight: 1.3, marginTop: n(6) }}>{p.event1}</div>
        </div>
        <div
          style={{
            width: n(CARD.avatar),
            height: n(CARD.avatar),
            flexShrink: 0,
            borderRadius: 999,
            background: C.fill,
            color: C.ink2,
            fontSize: n(CARD.initial),
            fontWeight: 500,
            lineHeight: `${n(CARD.avatar)}px`,
            textAlign: "center",
          }}
        >
          {initial}
        </div>
      </div>
    </div>
  );
};

const MessageCard: React.FC<{ p: IntegrationProps; u: number; k: number; w: number }> = ({ p, u, k, w }) => {
  const C = CANVAS.paper;
  const n = (v: number) => v * k * u;
  return (
    <div style={cardStyle(u, k, w)}>
      <div style={{ display: "flex", alignItems: "center", gap: n(12) }}>
        <Tile src={p.partnerLogo || SAMPLE.partnerIcon} size={n(CARD.partnerIcon)} radius={RADIUS.chip * k * u} u={u} tile={p.iconTile} />
        <div style={{ fontFamily: FONT_MONO, fontSize: n(CARD.meta), color: C.ink3, letterSpacing: "0.1em", lineHeight: 1, whiteSpace: "nowrap" }}>
          {p.partner.toUpperCase()}
        </div>
      </div>
      <div style={{ height: STROKE.hair * u, background: C.line, margin: `${n(20)}px 0 ${n(22)}px` }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: n(18) }}>
        <Tile src={p.logo || SAMPLE.logo} size={n(CARD.avatar)} radius={RADIUS.button * k * u} u={u} tile={p.iconTile} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: n(12), height: n(32) }}>
            <div style={{ fontSize: n(CARD.body), fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1, whiteSpace: "nowrap" }}>{p.brand}</div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: n(CARD.tag),
                letterSpacing: "0.08em",
                color: C.ink2,
                background: C.fill,
                borderRadius: RADIUS.chip * u,
                padding: `${n(5)}px ${n(8)}px`,
                lineHeight: 1,
              }}
            >
              APP
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: n(CARD.meta), color: C.ink3, lineHeight: 1, whiteSpace: "nowrap" }}>{MESSAGE_TIME}</div>
          </div>
          <div style={{ fontSize: n(CARD.body), color: C.ink, letterSpacing: "-0.01em", lineHeight: 1.35, marginTop: n(8) }}>{p.event2}</div>
        </div>
      </div>
    </div>
  );
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const enterEase = easing("enter");

// A card leaves the user's icon, runs along the connector to its peel point, then lifts off to its resting place.
export const flight = (G: Geometry, i: 0 | 1, a: number) => {
  const along = bez(G.a, G.c, G.b, G.peel[i] * clamp01(a / 0.6));
  const lift = enterEase(clamp01((a - 0.3) / 0.7));
  const to = G.cards[i].at;
  return { x: mix(along.x, to.x, lift), y: mix(along.y, to.y, lift), scale: mix(FLY_FROM, 1, a), opacity: clamp01(a * 3) };
};

// ---------- shots 1–2: one field, one camera ----------
const Scene: React.FC<{ p: IntegrationProps; frame: number }> = ({ p, frame }) => {
  const { u, width: W, height: H, isVertical, fps } = useLayout();
  const G = geometry(W, H, u, isVertical);
  const L = G.L;
  const ink = textOn(p.field);
  const l2 = frame - SHOTS[1];

  // camera: world → screen is Q(z) + s · (world − P)
  const z = progress(l2, T.camera[0], T.camera[1], "travel");
  const s = mix(1, G.S, z);
  const tx = mix(G.P.x, G.Q.x, z) - s * G.P.x;
  const ty = mix(G.P.y, G.Q.y, z) - s * G.P.y;

  // tiles slide in from the edges
  const ta = progress(frame, T.tileA[0], T.tileA[1], "spring");
  const tb = progress(frame, T.tileB[0], T.tileB[1], "spring");
  const A = { x: mix(G.fromA.x, G.A.x, ta), y: mix(G.fromA.y, G.A.y, ta) };
  const B = { x: mix(G.fromB.x, G.B.x, tb), y: mix(G.fromB.y, G.B.y, tb) };
  const cap = progress(frame, T.captions[0], T.captions[1], "enter");
  const marks = progress(frame, T.marks[0], T.marks[1], "enter");

  // connector, chip and pulses
  const d = progress(frame, T.draw[0], T.draw[1], "enter");
  const ch = progress(frame, T.chip[0], T.chip[1], "spring");
  const mid = bez(G.a, G.c, G.b, 0.5);
  const pathD = `M ${G.a.x} ${G.a.y} Q ${G.c.x} ${G.c.y} ${G.b.x} ${G.b.y}`;
  const pulses = Array.from({ length: T.pulses }, (_, i) => {
    const local = frame - T.pulseStart - i * T.pulseGap;
    if (local < 0) return null;
    const t = (local % T.pulsePeriod) / T.pulsePeriod;
    return { ...bez(G.a, G.c, G.b, t), o: Math.sin(Math.PI * t) };
  });

  // cards and badge
  const a1 = progress(l2, T.card1[0], T.card1[1], "spring");
  const a2 = progress(l2, T.card2[0], T.card2[1], "spring");
  const badge = progress(l2, T.badge[0], T.badge[1], "spring");

  const caption = (text: string, at: Pt): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        left: at.x,
        top: at.y + G.half + L.captionGap * u,
        transform: `translate(-50%, ${((1 - cap) * 12 * u).toFixed(3)}px)`,
        opacity: cap,
        fontFamily: FONT_MONO,
        fontSize: L.caption * u,
        letterSpacing: "0.1em",
        lineHeight: 1.2,
        color: alpha(ink, 0.55),
        whiteSpace: "nowrap",
      }}
    >
      {text.toUpperCase()}
    </div>
  );

  const card = (i: 0 | 1, a: number) => {
    if (a <= 0) return null;
    const f = flight(G, i, a);
    const [ax, ay] = G.cards[i].anchor;
    const w = L.cardW * K * u;
    return (
      <div
        style={{
          position: "absolute",
          left: f.x,
          top: f.y,
          opacity: f.opacity,
          transformOrigin: `${ax * 100}% ${ay * 100}%`,
          transform: `translate(${-ax * 100}%, ${-ay * 100}%) scale(${f.scale.toFixed(4)})`,
        }}
      >
        {i === 0 ? <EventCard p={p} u={u} k={K} w={w} /> : <MessageCard p={p} u={u} k={K} w={w} />}
      </div>
    );
  };

  const sec = Math.floor(frame / fps);
  const ff = frame % fps;
  const timecode = `00:00:${String(sec).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
  const mark: React.CSSProperties = {
    position: "absolute",
    top: MARGIN * u,
    fontFamily: FONT_MONO,
    fontSize: MARK * u,
    letterSpacing: "0.1em",
    lineHeight: 1,
    color: alpha(ink, 0.5),
    opacity: marks,
    whiteSpace: "nowrap",
  };

  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path
            d={pathD}
            fill="none"
            stroke={alpha(ink, 0.28)}
            strokeWidth={STROKE.hair * u}
            strokeLinecap="round"
            strokeDasharray={`${G.len} ${G.len}`}
            strokeDashoffset={G.len * (1 - d)}
          />
          <circle cx={G.a.x} cy={G.a.y} r={5 * u} fill={alpha(ink, 0.35)} opacity={clamp01(d * 4)} />
          <circle cx={G.b.x} cy={G.b.y} r={5 * u} fill={alpha(ink, 0.35)} opacity={clamp01((d - 0.9) * 10)} />
          {pulses.map((q, i) => (q ? <circle key={i} cx={q.x} cy={q.y} r={PULSE_R * u} fill={p.accent} opacity={q.o} /> : null))}
        </svg>
        {ch > 0 ? (
          <div
            style={{
              position: "absolute",
              left: mid.x - (CHIP / 2) * u,
              top: mid.y - (CHIP / 2) * u,
              width: CHIP * u,
              height: CHIP * u,
              borderRadius: 999,
              background: FILM.white,
              boxShadow: `${ring(u, 0.08)}, ${softShadow(u)}`,
              opacity: ch,
              transform: `scale(${mix(0.85, 1, ch).toFixed(4)})`,
            }}
          >
            <svg width={CHIP * u} height={CHIP * u} style={{ display: "block" }}>
              <g stroke={CANVAS.paper.ink} strokeWidth={STROKE.ring * u} strokeLinecap="round">
                <line x1={(CHIP / 2 - 11) * u} y1={(CHIP / 2) * u} x2={(CHIP / 2 + 11) * u} y2={(CHIP / 2) * u} />
                <line x1={(CHIP / 2) * u} y1={(CHIP / 2 - 11) * u} x2={(CHIP / 2) * u} y2={(CHIP / 2 + 11) * u} />
              </g>
            </svg>
          </div>
        ) : null}
        <Tile src={p.logo || SAMPLE.logo} size={L.tile * u} radius={RADIUS.hero * u} u={u} tile={p.iconTile} shadow style={{ position: "absolute", left: A.x - G.half, top: A.y - G.half }} />
        <Tile
          src={p.partnerLogo || SAMPLE.partnerIcon}
          size={L.tile * u}
          radius={RADIUS.hero * u}
          u={u}
          tile={p.iconTile}
          shadow
          style={{ position: "absolute", left: B.x - G.half, top: B.y - G.half }}
        />
        {badge > 0 ? (
          <div
            style={{
              position: "absolute",
              left: B.x + G.half - 14 * u - (BADGE / 2) * u,
              top: B.y - G.half + 14 * u - (BADGE / 2) * u,
              width: BADGE * u,
              height: BADGE * u,
              borderRadius: 999,
              background: p.accent,
              boxShadow: `0 0 0 ${3 * u}px ${p.field}`,
              color: FILM.white,
              fontFamily: FONT_SANS,
              fontSize: 28 * u,
              fontWeight: 500,
              lineHeight: `${BADGE * u}px`,
              textAlign: "center",
              opacity: badge,
              transform: `scale(${mix(0.6, 1, badge).toFixed(4)})`,
            }}
          >
            1
          </div>
        ) : null}
        {caption(p.brand, A)}
        {caption(p.partner, B)}
        {card(0, a1)}
        {card(1, a2)}
      </div>
      <div style={{ ...mark, left: MARGIN * u }}>{`${p.brand} × ${p.partner}`.toUpperCase()}</div>
      <div style={{ ...mark, right: MARGIN * u }}>{timecode}</div>
    </>
  );
};

// ---------- shot 3: the title card ----------
const EndCard: React.FC<{ p: IntegrationProps; local: number }> = ({ p, local }) => {
  const { u, width: W, isVertical } = useLayout();
  const L = isVertical ? SIZE.tall : SIZE.wide;
  const ink = endInk(p.end);
  const { rows, size } = fitRows(p.headline, L.titleMaxW * u, L.title * u, L.maxLines);
  const rule = progress(local, T.rule[0], T.rule[1], "travel");
  const rise = (i: number) => progress(local, T.icons[0] + STAGGER * i, T.icons[1] + STAGGER * i, "enter");
  const ctaT = progress(local, T.cta[0], T.cta[1], "enter");
  const up = (t: number): React.CSSProperties => ({ opacity: t, transform: `translateY(${((1 - t) * 16 * u).toFixed(3)}px)` });
  const icon = L.endIcon * u;
  const x = 9 * u;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          top: MARGIN * u - TITLE_LIFT * size,
          fontFamily: FONT_SANS,
          fontSize: size,
          fontWeight: 600,
          letterSpacing: `${TRACK}em`,
          color: ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Rise rows={rows} local={local} />
      </div>
      <div
        style={{
          position: "absolute",
          left: MARGIN * u,
          bottom: (MARGIN + L.endIcon + 40) * u,
          width: W - 2 * MARGIN * u,
          height: STROKE.hair * u,
          background: alpha(ink, 0.22),
          transformOrigin: "0 50%",
          transform: `scaleX(${rule.toFixed(4)})`,
        }}
      />
      <div style={{ position: "absolute", left: MARGIN * u, bottom: MARGIN * u, display: "flex", alignItems: "center", gap: 20 * u }}>
        <div style={up(rise(0))}>
          <Tile src={p.logo || SAMPLE.logo} size={icon} radius={RADIUS.button * u} u={u} tile={p.iconTile} shadow />
        </div>
        <svg width={2 * x} height={2 * x} style={{ display: "block", ...up(rise(1)) }}>
          <g stroke={alpha(ink, 0.55)} strokeWidth={STROKE.ring * u} strokeLinecap="round">
            <line x1={2 * u} y1={2 * u} x2={2 * x - 2 * u} y2={2 * x - 2 * u} />
            <line x1={2 * x - 2 * u} y1={2 * u} x2={2 * u} y2={2 * x - 2 * u} />
          </g>
        </svg>
        <div style={up(rise(2))}>
          <Tile src={p.partnerLogo || SAMPLE.partnerIcon} size={icon} radius={RADIUS.button * u} u={u} tile={p.iconTile} shadow />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: MARGIN * u,
          bottom: MARGIN * u,
          height: icon,
          display: "flex",
          alignItems: "center",
          gap: 14 * u,
          ...up(ctaT),
        }}
      >
        <div style={{ width: 10 * u, height: 10 * u, borderRadius: 999, background: p.accent }} />
        <div style={{ fontFamily: FONT_MONO, fontSize: L.cta * u, color: ink, lineHeight: 1, whiteSpace: "nowrap" }}>{p.cta}</div>
      </div>
    </>
  );
};

export const Integration: React.FC<IntegrationProps> = (p) => {
  const { index, local, frame } = useShot(SHOTS);
  return (
    <AbsoluteFill style={{ background: index === 2 ? p.end : p.field, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {index < 2 ? <Scene p={p} frame={frame} /> : <EndCard p={p} local={local} />}
    </AbsoluteFill>
  );
};
