import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

// A landing-page hero on a canvas, edited live from a Framer-style "Color · Accent" panel. A name-tag cursor selects
// the hero, clicks a second swatch (the hero's accent re-colours as a soft cascade), then clicks the first swatch
// again so the loop ends exactly where it started. The editor chrome is neutral; the selection ring and box take the
// live accent, so only one hue is ever in use outside the swatch row.

export type AccentColourSwapProps = {
  background: string; // canvas
  card: string; // hero page, panel and cards
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string;
  onButton: string;
  onAccent: string; // text on a dark swatch
  accent: string; // swatch 1
  swatch2: string;
  swatch3: string;
  swatch4: string;
  swatch5: string;
  headline1: string;
  headline2: string; // its last word takes the accent
  subline: string;
  buttonLabel: string;
  startSwatch: number; // 1–5, the selected swatch at the start and end of the loop
  secondSwatch: number; // 1–5, the swatch the cursor clicks
  cursorName: string;
  ease: string;
};

// ---------- timing (frames on a 180-frame loop; scaled if the duration changes) ----------
export const TIMING = {
  base: 180,
  heroClick: 8, // the cursor clicks the hero; the selection box appears
  selIn: [8, 26] as const,
  move1: [20, 48] as const, // hero → second swatch
  click1: 52,
  move2: [96, 120] as const, // second swatch → first swatch
  click2: 126,
  move3: [140, 164] as const, // back to the hero
  selOut: [150, 164] as const,
  fade: 18, // each accent element's cross-fade
  ring: 14, // selection ring glide
};
// delay (frames after a click) before each accent element starts to cross-fade, nearest the panel first
export const DELAY = { panel: 0, button: 0, word: 3, tag: 5, mark: 6, progress: 8, bar: (j: number) => 9 + j };

const BARS = [38, 62, 48, 86, 54, 70, 44, 92, 58, 40, 76, 64];
const HOT = [3, 7, 10];
const LINKS = ["Product", "Pricing", "Customers", "Changelog"];

// ---------- colour ----------
type RGB = [number, number, number];
const toRgb = (hex: string): RGB => {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 || h.length === 4 ? h.slice(0, 3).split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lerpRgb = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const css = (c: RGB, a = 1) => {
  const [r, g, b] = c.map((v) => Math.round(Math.max(0, Math.min(255, v))));
  return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
};
const lum = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const isDark = (hex: string) => lum(toRgb(hex)) < 0.4;

export const swatchIndices = (start: number, second: number): [number, number] => {
  const a = Math.min(5, Math.max(1, Math.round(start))) - 1;
  let b = Math.min(5, Math.max(1, Math.round(second))) - 1;
  if (b === a) b = (a + 1) % 5;
  return [a, b];
};
export const splitAccentWord = (line: string): [string, string] => {
  const s = line.trim();
  const i = s.lastIndexOf(" ");
  return i < 0 ? ["", s] : [s.slice(0, i), s.slice(i + 1)];
};

type Theme = {
  dark: boolean;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  fill: string;
  card: string;
  button: string;
  onButton: string;
};

// ---------- layout (all in design units: 1 = 1px at 1080 on the short side) ----------
export type Geo = {
  wide: boolean; // panel sits under the hero as a wide bar (1:1, 9:16) instead of beside it (16:9)
  AX: number;
  AY: number;
  AW: number;
  AH: number;
  DW: number; // the hero is designed at DW × DH page pixels and scaled into the artboard
  DH: number;
  hl: number; // headline size in page pixels
  topPad: number;
  trayGap: number;
  tall: boolean;
  PX: number;
  PY: number;
  PW: number;
  PH: number;
  pad: number;
  S: number; // swatch size
  gap: number;
  swY: number;
  park: [number, number]; // where the cursor rests on the hero
};
export const geometry = (ratio: Ratio, WU: number, HU: number): Geo => {
  if (ratio === "16:9") {
    const AW = 1080, DW = 1200, DH = 820, AH = (AW * DH) / DW, PW = 400, PH = 318, gapX = 48;
    const AX = (WU - (AW + gapX + PW)) / 2, AY = (HU - AH) / 2 + 8;
    return {
      wide: false, AX, AY, AW, AH, DW, DH, hl: 100, topPad: 52, trayGap: 48, tall: false,
      PX: AX + AW + gapX, PY: AY + (AH - PH) / 2 - 30, PW, PH, pad: 24, S: 56, gap: (PW - 48 - 5 * 56) / 4, swY: 114,
      park: [AX + AW * 0.71, AY + AH * 0.36],
    };
  }
  const tall = ratio === "9:16";
  const AW = Math.min(960, WU - 120), DW = tall ? 1000 : 1100, DH = tall ? 1300 : 760, AH = (AW * DH) / DW, PH = 156, gapY = 56;
  const AX = (WU - AW) / 2, AY = (HU - (30 + AH + gapY + PH)) / 2 + 30;
  return {
    wide: true, AX, AY, AW, AH, DW, DH, hl: tall ? 108 : 84, topPad: tall ? 80 : 36, trayGap: tall ? 64 : 40, tall,
    PX: AX, PY: AY + AH + gapY, PW: AW, PH, pad: 24, S: 52, gap: 12, swY: 82,
    park: tall ? [AX + AW * 0.76, AY + AH * 0.3] : [AX + AW * 0.73, AY + AH * 0.42],
  };
};

// ---------- pieces ----------
// 0 → 1 → 0 around a click: down over 3 frames, back up over 6.
const press = (f: number, at: number) => progress(f, at - 3, at, "travel") - progress(f, at, at + 6, "travel");

// a soft arc between two points, on the travel curve
const glide = (f: number, range: readonly [number, number], a: [number, number], b: [number, number]): [number, number] => {
  const k = progress(f, range[0], range[1], "travel");
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const arc = Math.min(70, len * 0.14) * Math.sin(Math.PI * clamp01(k));
  return [a[0] + dx * k + (dy / len) * arc, a[1] + dy * k - (dx / len) * arc];
};

type Accent = (d: number, len?: number) => RGB;

const Hero: React.FC<{ g: Geo; th: Theme; p: AccentColourSwapProps; ac: Accent; on: Accent }> = ({ g, th, p, ac, on }) => {
  const [lead, word] = splitAccentWord(p.headline2);
  const pageRgb = toRgb(th.card);
  const tag = ac(DELAY.tag);
  const chipR = `${RADIUS.chip}px ${RADIUS.chip}px 0 0`;
  return (
    <div style={{ width: g.DW, height: g.DH, background: th.card, display: "flex", flexDirection: "column", color: th.ink, fontFamily: FONT_SANS }}>
      {/* nav */}
      <div style={{ height: 76, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 40px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 21, fontWeight: 500, letterSpacing: "-0.02em" }}>
          <svg width={26} height={26} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={10} fill={css(ac(DELAY.mark))} />
            <path d="M12 6.5V12l3.6 2.2" stroke={css(on(DELAY.mark))} strokeWidth={(STROKE.ring * 24) / 26} strokeLinecap="round" fill="none" />
          </svg>
          Tempo
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 30, fontSize: 15, color: th.ink2 }}>
          {LINKS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
        <span style={{ marginLeft: 30, fontSize: 15, color: th.ink2 }}>Sign in</span>
        <span style={{ marginLeft: 18, padding: "10px 16px", borderRadius: RADIUS.button, background: th.button, color: th.onButton, fontSize: 14, fontWeight: 500 }}>Get Tempo</span>
      </div>

      {/* copy */}
      <div style={{ marginTop: g.topPad, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "5px 14px 5px 5px", borderRadius: 999, border: `1px solid ${th.line}`, background: th.card, fontSize: 14, color: th.ink2 }}>
          <span style={{ padding: "3px 10px", borderRadius: 999, background: css(lerpRgb(pageRgb, tag, 0.12)), color: css(tag), fontWeight: 500, fontSize: 13 }}>New</span>
          Tempo AI now plans your team’s week →
        </span>
        <div style={{ marginTop: 26, fontSize: g.hl, fontWeight: 400, letterSpacing: "-0.045em", lineHeight: 1.02, whiteSpace: "nowrap" }}>
          <div>{p.headline1}</div>
          <div>
            {lead ? `${lead} ` : ""}
            <span style={{ color: css(ac(DELAY.word)) }}>{word}</span>
          </div>
        </div>
        <div style={{ marginTop: 24, maxWidth: 600, fontSize: 19, lineHeight: 1.5, color: th.ink2 }}>{p.subline}</div>
        <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
          <span
            style={{
              padding: "15px 24px",
              borderRadius: RADIUS.button,
              fontSize: 16,
              fontWeight: 500,
              background: css(ac(DELAY.button)),
              color: css(on(DELAY.button)),
              whiteSpace: "nowrap",
            }}
          >
            {p.buttonLabel}
          </span>
          <span style={{ padding: "14px 22px", borderRadius: RADIUS.button, fontSize: 16, fontWeight: 500, border: `1px solid ${th.line}`, color: th.ink, background: th.card }}>Watch demo</span>
        </div>
      </div>

      {/* product preview strip, bleeding off the bottom of the page */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          marginTop: g.trayGap,
          marginLeft: 56,
          marginRight: 56,
          borderRadius: `${RADIUS.card}px ${RADIUS.card}px 0 0`,
          background: th.fill,
          padding: "20px 20px 0",
          display: "flex",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: `${RADIUS.button}px ${RADIUS.button}px 0 0`,
            background: th.card,
            border: `1px solid ${th.line}`,
            borderBottom: "none",
            padding: "20px 24px 0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>This week</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: th.ink3 }}>June 8 – 12</span>
            <span style={{ marginLeft: "auto", display: "flex", padding: 3, borderRadius: RADIUS.chip, background: th.fill, fontSize: 13, fontWeight: 500 }}>
              <span style={{ padding: "5px 12px", borderRadius: RADIUS.chip, background: th.card, color: th.ink, boxShadow: `0 0 0 1px ${th.line}` }}>Week</span>
              <span style={{ padding: "5px 12px", color: th.ink2 }}>Month</span>
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0, marginTop: 18, paddingBottom: 22, display: "flex", flexDirection: g.tall ? "column" : "row", gap: g.tall ? 28 : 36 }}>
            <div style={{ width: g.tall ? 420 : 220, flexShrink: 0 }}>
              <div style={{ fontSize: 14, color: th.ink2 }}>Focus time</div>
              <div style={{ marginTop: 4, fontSize: 46, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.1 }}>24.5h</div>
              <div style={{ marginTop: 16, height: STROKE.bar, borderRadius: 999, background: th.fill, overflow: "hidden" }}>
                <div style={{ width: "62%", height: "100%", borderRadius: 999, background: css(ac(DELAY.progress)) }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: th.ink3 }}>62% of weekly goal</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>
              {BARS.map((h, j) => (
                <div key={j} style={{ flex: 1, height: `${h}%`, borderRadius: chipR, background: HOT.includes(j) ? css(ac(DELAY.bar(j))) : th.line }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ u: number; th: Theme; on?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ u, th, on, children, style }) => (
  <div
    style={{
      height: 44 * u,
      borderRadius: RADIUS.button * u,
      background: th.fill,
      display: "flex",
      alignItems: "center",
      gap: 10 * u,
      padding: `0 ${14 * u}px`,
      boxSizing: "border-box",
      color: on ? th.ink : th.ink2,
      fontWeight: 500,
      fontSize: 15 * u,
      ...style,
    }}
  >
    {children}
  </div>
);

const Panel: React.FC<{
  g: Geo;
  u: number;
  th: Theme;
  shadow: string;
  swatches: string[];
  ringX: number;
  pressed: [number, number]; // [swatch index, press amount]
  chip: RGB;
  hexA: string;
  hexB: string;
  hexW: number;
}> = ({ g, u, th, shadow, swatches, ringX, pressed, chip, hexA, hexB, hexW }) => {
  const label: React.CSSProperties = { fontSize: 15 * u, color: th.ink2, whiteSpace: "nowrap" };
  const outline = `inset 0 0 0 ${u}px ${alpha(th.ink, 0.08)}`;
  const chipEl = <span style={{ width: 16 * u, height: 16 * u, borderRadius: 999, flexShrink: 0, background: css(chip), boxShadow: outline }} />;
  const hex = (
    <span style={{ display: "grid", overflow: "hidden", fontFamily: FONT_MONO, fontSize: 15 * u, fontWeight: 400, letterSpacing: "0.02em" }}>
      <span style={{ gridArea: "1 / 1", opacity: 1 - hexW, transform: `translateY(${-hexW * 10 * u}px)` }}>{hexA}</span>
      <span style={{ gridArea: "1 / 1", opacity: hexW, transform: `translateY(${(1 - hexW) * 10 * u}px)` }}>{hexB}</span>
    </span>
  );
  const used = (
    <>
      <svg width={16 * u} height={16 * u} viewBox="0 0 16 16" fill="none" stroke={th.ink3} strokeWidth={STROKE.hair} strokeLinejoin="round">
        <path d="M8 2.5l5.5 3L8 8.5l-5.5-3z M2.5 8.5L8 11.5l5.5-3 M2.5 11L8 14l5.5-3" />
      </svg>
      12 layers
    </>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: g.PX * u,
        top: g.PY * u,
        width: g.PW * u,
        height: g.PH * u,
        borderRadius: RADIUS.button * u,
        background: th.card,
        boxShadow: shadow === "none" ? `0 0 0 ${u}px ${th.line}` : `0 0 0 ${u}px ${th.line}, ${shadow}`,
        color: th.ink,
        fontFamily: FONT_SANS,
      }}
    >
      {/* header */}
      <div style={{ position: "absolute", left: g.pad * u, right: g.pad * u, top: 22 * u, height: 26 * u, display: "flex", alignItems: "center", gap: 10 * u }}>
        <span style={{ width: 18 * u, height: 18 * u, borderRadius: 999, background: css(chip), boxShadow: outline }} />
        <span style={{ fontSize: 16 * u, fontWeight: 500, letterSpacing: "-0.01em" }}>Color · Accent</span>
        <svg width={18 * u} height={18 * u} viewBox="0 0 18 18" style={{ marginLeft: "auto" }}>
          {[4, 9, 14].map((x) => (
            <circle key={x} cx={x} cy={9} r={1.5} fill={th.ink3} />
          ))}
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 62 * u, height: STROKE.hair * u, background: th.line }} />

      {g.wide ? null : <div style={{ ...label, position: "absolute", left: g.pad * u, top: 82 * u, fontSize: 14 * u, fontWeight: 500 }}>Swatches</div>}

      {/* swatches + the selection ring (the ring wears the live accent) */}
      {swatches.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: (g.pad + i * (g.S + g.gap)) * u,
            top: g.swY * u,
            width: g.S * u,
            height: g.S * u,
            borderRadius: 999,
            background: c,
            boxShadow: outline,
            transform: pressed[0] === i ? `scale(${1 - 0.08 * pressed[1]})` : undefined,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: (ringX - 5) * u,
          top: (g.swY - 5) * u,
          width: (g.S + 10) * u,
          height: (g.S + 10) * u,
          borderRadius: 999,
          border: `${STROKE.ring * u}px solid ${css(chip)}`,
          boxSizing: "border-box",
        }}
      />

      {g.wide ? (
        <>
          <div style={{ position: "absolute", left: (g.pad + 5 * g.S + 4 * g.gap + 18) * u, top: g.swY * u, width: STROKE.hair * u, height: g.S * u, background: th.line }} />
          <div style={{ position: "absolute", left: (g.pad + 5 * g.S + 4 * g.gap + 36) * u, right: g.pad * u, top: (g.swY + (g.S - 44) / 2) * u, display: "flex", gap: 20 * u }}>
            <div style={{ flex: 1.15, display: "flex", alignItems: "center", gap: 12 * u, minWidth: 0 }}>
              <span style={label}>Hex</span>
              <Field u={u} th={th} on style={{ flex: 1 }}>
                {chipEl}
                {hex}
              </Field>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 * u, minWidth: 0 }}>
              <span style={label}>Used in</span>
              <Field u={u} th={th} style={{ flex: 1 }}>
                {used}
              </Field>
            </div>
          </div>
        </>
      ) : (
        <>
          {(
            [
              ["Hex", 196, true],
              ["Used in", 250, false],
            ] as const
          ).map(([l, y, isHex]) => (
            <div key={l} style={{ position: "absolute", left: g.pad * u, right: g.pad * u, top: y * u, display: "flex", alignItems: "center" }}>
              <span style={{ ...label, width: 86 * u }}>{l}</span>
              <Field u={u} th={th} on={isHex} style={{ flex: 1 }}>
                {isHex ? (
                  <>
                    {chipEl}
                    {hex}
                  </>
                ) : (
                  used
                )}
              </Field>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const Cursor: React.FC<{ x: number; y: number; u: number; th: Theme; name: string; down: number }> = ({ x, y, u, th, name, down }) => (
  <div style={{ position: "absolute", left: x * u, top: y * u, transform: `scale(${1 - 0.12 * down})`, transformOrigin: "0 0" }}>
    <svg width={24 * u} height={26 * u} viewBox="0 0 24 26" style={{ position: "absolute", left: -2 * u, top: -2 * u, overflow: "visible" }}>
      <path d="M2 2 L2 21 L7.2 16.3 L10.6 24 L14 22.5 L10.7 15 L17.6 15 Z" fill={th.ink} stroke={th.card} strokeWidth={STROKE.hair} strokeLinejoin="round" />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 16 * u,
        top: 24 * u,
        padding: `${5 * u}px ${10 * u}px`,
        borderRadius: RADIUS.chip * u,
        background: th.ink,
        color: th.card,
        fontFamily: FONT_SANS,
        fontSize: 14 * u,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </div>
  </div>
);

export const AccentColourSwap: React.FC<AccentColourSwapProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, u, ratio } = useLayout();
  const T = TIMING;
  const f = (frame * T.base) / durationInFrames;
  const g = geometry(ratio, width / u, height / u);

  const swatches = [p.accent, p.swatch2, p.swatch3, p.swatch4, p.swatch5];
  const [ia, ib] = swatchIndices(p.startSwatch, p.secondSwatch);
  const A = toRgb(swatches[ia]), B = toRgb(swatches[ib]);
  const dark = isDark(p.background);
  const th: Theme = { dark, ink: p.ink, ink2: p.ink2, ink3: p.ink3, line: p.line, fill: p.fill, card: p.card, button: p.button, onButton: p.onButton };
  const shadow = dark ? "none" : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  // text on an accent fill: onAccent on dark swatches, the darker of ink/background on light ones
  const inkRgb = toRgb(p.ink), bgRgb = toRgb(p.background);
  const darkText = lum(inkRgb) < lum(bgRgb) ? inkRgb : bgRgb;
  const lightText = toRgb(p.onAccent);
  const textOn = (c: RGB): RGB => (lum(c) > 0.62 ? darkText : lightText);

  // 0 = first colour, 1 = second colour; each element runs its own cross-fade, delayed by d frames after each click
  const w = (d: number, len: number = T.fade) =>
    clamp01(progress(f, T.click1 + d, T.click1 + d + len, p.ease) - progress(f, T.click2 + d, T.click2 + d + len, p.ease));
  const ac: Accent = (d, len) => lerpRgb(A, B, w(d, len));
  const onA = textOn(A), onB = textOn(B);
  const on: Accent = (d, len) => lerpRgb(onA, onB, w(d, len));

  // selection ring glides between swatches
  const sx = (i: number) => g.pad + i * (g.S + g.gap);
  const r = progress(f, T.click1, T.click1 + T.ring, "travel") - progress(f, T.click2, T.click2 + T.ring, "travel");
  const hexW = w(DELAY.panel, T.ring);
  const live = ac(DELAY.panel, T.ring);

  // cursor
  const target = (i: number): [number, number] => [g.PX + sx(i) + g.S / 2 + 2, g.PY + g.swY + g.S / 2 + 4];
  const [cx, cy] =
    f < T.move1[0]
      ? g.park
      : f < T.move2[0]
        ? glide(f, T.move1, g.park, target(ib))
        : f < T.move3[0]
          ? glide(f, T.move2, target(ib), target(ia))
          : glide(f, T.move3, target(ia), g.park);
  const down = Math.max(press(f, T.heroClick), press(f, T.click1), press(f, T.click2));
  const swPress: [number, number] = f < (T.click1 + T.click2) / 2 ? [ib, press(f, T.click1)] : [ia, press(f, T.click2)];

  // selection box on the hero, in the live accent
  const sel = clamp01(progress(f, T.selIn[0], T.selIn[1], p.ease) - progress(f, T.selOut[0], T.selOut[1], "exit"));
  const handle = 10 * u;
  const selC = css(live);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* frame name, Framer-style */}
      <div style={{ position: "absolute", left: g.AX * u, top: (g.AY - 30) * u, fontSize: 15 * u, fontWeight: 500, color: css(lerpRgb(toRgb(p.ink3), live, sel)) }}>Hero</div>

      {/* the hero artboard */}
      <div
        style={{
          position: "absolute",
          left: g.AX * u,
          top: g.AY * u,
          width: g.AW * u,
          height: g.AH * u,
          overflow: "hidden",
          boxShadow: shadow === "none" ? `0 0 0 ${u}px ${p.line}` : `0 0 0 ${u}px ${p.line}, ${shadow}`,
        }}
      >
        <div style={{ transform: `scale(${(g.AW * u) / g.DW})`, transformOrigin: "0 0" }}>
          <Hero g={g} th={th} p={p} ac={ac} on={on} />
        </div>
      </div>

      {/* selection box + size label */}
      <div style={{ position: "absolute", left: g.AX * u, top: g.AY * u, width: g.AW * u, height: g.AH * u, opacity: sel }}>
        <div style={{ position: "absolute", inset: 0, border: `${STROKE.hair * u}px solid ${selC}` }} />
        {[
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([a, b], j) => (
          <div
            key={j}
            style={{
              position: "absolute",
              left: a * g.AW * u - handle / 2 + 0.75 * u * (a ? -1 : 1),
              top: b * g.AH * u - handle / 2 + 0.75 * u * (b ? -1 : 1),
              width: handle,
              height: handle,
              boxSizing: "border-box",
              background: p.card,
              border: `${STROKE.hair * u}px solid ${selC}`,
              transform: `scale(${mix(0.4, 1, sel)})`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: (g.AH + 12) * u,
            transform: "translateX(-50%)",
            padding: `${3 * u}px ${8 * u}px`,
            borderRadius: RADIUS.chip * u,
            background: selC,
            color: css(on(DELAY.panel, T.ring)),
            fontFamily: FONT_MONO,
            fontSize: 13 * u,
            fontWeight: 400,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {g.DW} × {g.DH}
        </div>
      </div>

      <Panel
        g={g}
        u={u}
        th={th}
        shadow={shadow}
        swatches={swatches}
        ringX={mix(sx(ia), sx(ib), r)}
        pressed={swPress}
        chip={live}
        hexA={swatches[ia].toUpperCase()}
        hexB={swatches[ib].toUpperCase()}
        hexW={hexW}
      />

      <Cursor x={cx} y={cy} u={u} th={th} name={p.cursorName} down={down} />
    </AbsoluteFill>
  );
};
