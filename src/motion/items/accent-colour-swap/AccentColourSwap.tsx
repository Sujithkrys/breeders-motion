import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

// A landing-page hero on a canvas, edited live from a Framer-style "Color · Accent" panel. A name-tag cursor selects
// the hero, clicks a second swatch (the hero's accent re-colours as a soft cascade), then clicks the first swatch
// again so the loop ends exactly where it started. Ported from the colour-style shot of our Framer film.

export type AccentColourSwapProps = {
  background: string; // canvas
  page: string; // the hero artboard's page colour; a dark page switches the whole UI to its dark theme
  headline1: string;
  headline2: string; // its last word takes the accent
  subline: string;
  buttonLabel: string;
  swatch1: string;
  swatch2: string;
  swatch3: string;
  swatch4: string;
  swatch5: string;
  startSwatch: number; // 1–5, the selected swatch at the start and end of the loop
  secondSwatch: number; // 1–5, the swatch the cursor clicks
  cursorName: string;
  ease: string;
};

// ---------- timing (frames on a 180-frame loop; scaled if the duration changes) ----------
export const TIMING = {
  base: 180,
  heroClick: 8, // the cursor clicks the hero; the selection box appears
  selIn: [8, 15] as const,
  move1: [20, 48] as const, // hero → second swatch
  click1: 52,
  move2: [96, 120] as const, // second swatch → first swatch
  click2: 126,
  move3: [140, 170] as const, // back to the hero
  selOut: [164, 176] as const,
  fade: 18, // each accent element's cross-fade
  ring: 10, // selection ring glide
};
// delay (frames after a click) before each accent element starts to cross-fade, nearest the panel first
const DELAY = { panel: 0, button: 0, word: 3, tag: 5, mark: 6, progress: 8, bar: (j: number) => 9 + j };

const BLUE = "#0099FF";
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
const INK: RGB = [14, 15, 18];
const WHITE: RGB = [255, 255, 255];
const textOn = (c: RGB): RGB => (lum(c) > 0.62 ? INK : WHITE);
export const isDarkPage = (hex: string) => lum(toRgb(hex)) < 0.4;

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
  sub: string;
  line: string;
  tray: string;
  card: string;
  field: string;
  panel: string;
  navBg: string;
  navFg: string;
  selFill: string;
  shadow: string;
};
const LIGHT: Theme = {
  dark: false,
  ink: "#0E0F12",
  ink2: "#3B3D44",
  sub: "#7B7E87",
  line: "#E8E8EC",
  tray: "#F2F2EF",
  card: "#FFFFFF",
  field: "#F4F4F2",
  panel: "#FFFFFF",
  navBg: "#0E0F12",
  navFg: "#FFFFFF",
  selFill: "#E5F4FF",
  shadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
};
const DARK: Theme = {
  dark: true,
  ink: "#FFFFFF",
  ink2: "#C9CBD1",
  sub: "#8B8E97",
  line: "#2A2B31",
  tray: "#1C1D22",
  card: "#202127",
  field: "#2A2B31",
  panel: "#18191D",
  navBg: "#FFFFFF",
  navFg: "#0E0F12",
  selFill: "rgba(0,153,255,0.16)",
  shadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)",
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
    const AW = 1150, DW = 1200, DH = 820, AH = (AW * DH) / DW, PW = 400, PH = 318, gapX = 48;
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
const press = (f: number, at: number, w = 5) => Math.max(0, 1 - Math.abs(f - at) / w);

// a soft arc between two points, eased
const glide = (f: number, range: readonly [number, number], a: [number, number], b: [number, number], ease: string): [number, number] => {
  const k = progress(f, range[0], range[1], ease);
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const arc = Math.min(70, len * 0.14) * Math.sin(Math.PI * clamp01(k));
  return [a[0] + dx * k + (dy / len) * arc, a[1] + dy * k - (dx / len) * arc];
};

type Accent = (d: number, len?: number) => RGB;

const Hero: React.FC<{ g: Geo; th: Theme; page: string; p: AccentColourSwapProps; ac: Accent; on: Accent }> = ({ g, th, page, p, ac, on }) => {
  const [lead, word] = splitAccentWord(p.headline2);
  const pageRgb = toRgb(page), cardRgb = toRgb(th.card);
  const tag = ac(DELAY.tag);
  return (
    <div style={{ width: g.DW, height: g.DH, background: page, display: "flex", flexDirection: "column", color: th.ink, fontFamily: FONT_SANS }}>
      {/* nav */}
      <div style={{ height: 76, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 40px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <svg width={26} height={26} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={10} fill={css(ac(DELAY.mark))} />
            <path d="M12 6.5V12l3.6 2.2" stroke={css(on(DELAY.mark))} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          </svg>
          Tempo
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 30, fontSize: 15, color: th.ink2 }}>
          {LINKS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
        <span style={{ marginLeft: 30, fontSize: 15, color: th.ink2 }}>Sign in</span>
        <span style={{ marginLeft: 18, padding: "10px 16px", borderRadius: 9, background: th.navBg, color: th.navFg, fontSize: 14, fontWeight: 600 }}>Get Tempo</span>
      </div>

      {/* copy */}
      <div style={{ marginTop: g.topPad, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "5px 14px 5px 5px", borderRadius: 999, border: `1px solid ${th.line}`, background: th.card, fontSize: 14, color: th.ink2 }}>
          <span style={{ padding: "3px 10px", borderRadius: 999, background: css(lerpRgb(pageRgb, tag, 0.12)), color: css(tag), fontWeight: 600, fontSize: 13 }}>New</span>
          Tempo AI now plans your team’s week →
        </span>
        <div style={{ marginTop: 26, fontSize: g.hl, fontWeight: 500, letterSpacing: "-0.045em", lineHeight: 1.02, whiteSpace: "nowrap" }}>
          <div>{p.headline1}</div>
          <div>
            {lead ? `${lead} ` : ""}
            <span style={{ color: css(ac(DELAY.word)) }}>{word}</span>
          </div>
        </div>
        <div style={{ marginTop: 24, maxWidth: 600, fontSize: 19, lineHeight: 1.5, color: th.sub }}>{p.subline}</div>
        <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
          <span
            style={{
              padding: "15px 24px",
              borderRadius: 11,
              fontSize: 16,
              fontWeight: 600,
              background: css(ac(DELAY.button)),
              color: css(on(DELAY.button)),
              boxShadow: "0 1px 2px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.16)",
              whiteSpace: "nowrap",
            }}
          >
            {p.buttonLabel}
          </span>
          <span style={{ padding: "14px 22px", borderRadius: 11, fontSize: 16, fontWeight: 600, border: `1px solid ${th.line}`, color: th.ink, background: th.card }}>Watch demo</span>
        </div>
      </div>

      {/* product preview strip, bleeding off the bottom of the page */}
      <div style={{ flex: 1, minHeight: 0, marginTop: g.trayGap, marginLeft: 56, marginRight: 56, borderRadius: "22px 22px 0 0", background: th.tray, padding: "20px 20px 0", display: "flex" }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "14px 14px 0 0",
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
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>This week</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: th.sub }}>June 8 – 12</span>
            <span style={{ marginLeft: "auto", display: "flex", padding: 3, borderRadius: 8, background: th.field, fontSize: 13, fontWeight: 500 }}>
              <span style={{ padding: "5px 12px", borderRadius: 6, background: th.card, color: th.ink, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>Week</span>
              <span style={{ padding: "5px 12px", color: th.sub }}>Month</span>
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0, marginTop: 18, paddingBottom: 22, display: "flex", flexDirection: g.tall ? "column" : "row", gap: g.tall ? 28 : 36 }}>
            <div style={{ width: g.tall ? 420 : 220, flexShrink: 0 }}>
              <div style={{ fontSize: 14, color: th.sub }}>Focus time</div>
              <div style={{ marginTop: 4, fontSize: 46, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.1 }}>24.5h</div>
              <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: th.field, overflow: "hidden" }}>
                <div style={{ width: "62%", height: "100%", borderRadius: 3, background: css(ac(DELAY.progress)) }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: th.sub }}>62% of weekly goal</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>
              {BARS.map((h, j) => {
                const a = ac(DELAY.bar(j));
                return <div key={j} style={{ flex: 1, height: `${h}%`, borderRadius: 6, background: css(HOT.includes(j) ? a : lerpRgb(cardRgb, a, th.dark ? 0.3 : 0.2)) }} />;
              })}
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
      borderRadius: 10 * u,
      background: on ? th.selFill : th.field,
      display: "flex",
      alignItems: "center",
      gap: 10 * u,
      padding: `0 ${14 * u}px`,
      boxSizing: "border-box",
      color: on ? BLUE : th.ink2,
      fontWeight: on ? 600 : 500,
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
  swatches: string[];
  ringX: number;
  pressed: [number, number]; // [swatch index, press amount]
  chip: RGB;
  hexA: string;
  hexB: string;
  hexW: number;
}> = ({ g, u, th, swatches, ringX, pressed, chip, hexA, hexB, hexW }) => {
  const label: React.CSSProperties = { fontSize: 15 * u, color: th.sub, whiteSpace: "nowrap" };
  const chipEl = <span style={{ width: 16 * u, height: 16 * u, borderRadius: 4 * u, flexShrink: 0, background: css(chip), boxShadow: `inset 0 0 0 ${u}px rgba(0,0,0,0.08)` }} />;
  const hex = (
    <span style={{ display: "grid", overflow: "hidden", fontFamily: FONT_MONO, fontSize: 15 * u, letterSpacing: "0.02em" }}>
      <span style={{ gridArea: "1 / 1", opacity: 1 - hexW, transform: `translateY(${-hexW * 10 * u}px)` }}>{hexA}</span>
      <span style={{ gridArea: "1 / 1", opacity: hexW, transform: `translateY(${(1 - hexW) * 10 * u}px)` }}>{hexB}</span>
    </span>
  );
  const used = (
    <>
      <svg width={16 * u} height={16 * u} viewBox="0 0 16 16" fill="none" stroke={th.sub} strokeWidth={1.4} strokeLinejoin="round">
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
        borderRadius: 14 * u,
        background: th.panel,
        boxShadow: `0 0 0 ${u}px ${th.line}, ${th.shadow}`,
        color: th.ink,
        fontFamily: FONT_SANS,
      }}
    >
      {/* header */}
      <div style={{ position: "absolute", left: g.pad * u, right: g.pad * u, top: 22 * u, height: 26 * u, display: "flex", alignItems: "center", gap: 10 * u }}>
        <span style={{ width: 18 * u, height: 18 * u, borderRadius: 5 * u, background: css(chip), boxShadow: `inset 0 0 0 ${u}px rgba(0,0,0,0.08)` }} />
        <span style={{ fontSize: 16 * u, fontWeight: 600, letterSpacing: "-0.01em" }}>Color · Accent</span>
        <svg width={18 * u} height={18 * u} viewBox="0 0 18 18" style={{ marginLeft: "auto" }}>
          {[4, 9, 14].map((x) => (
            <circle key={x} cx={x} cy={9} r={1.5} fill={th.sub} />
          ))}
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 62 * u, height: u, background: th.line }} />

      {g.wide ? null : <div style={{ ...label, position: "absolute", left: g.pad * u, top: 82 * u, fontSize: 14 * u, fontWeight: 500 }}>Swatches</div>}

      {/* swatches + the selection ring */}
      {swatches.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: (g.pad + i * (g.S + g.gap)) * u,
            top: g.swY * u,
            width: g.S * u,
            height: g.S * u,
            borderRadius: g.S * 0.25 * u,
            background: c,
            boxShadow: `inset 0 0 0 ${u}px ${th.dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
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
          borderRadius: (g.S * 0.25 + 5) * u,
          border: `${2 * u}px solid ${BLUE}`,
          boxSizing: "border-box",
        }}
      />

      {g.wide ? (
        <>
          <div style={{ position: "absolute", left: (g.pad + 5 * g.S + 4 * g.gap + 18) * u, top: g.swY * u, width: u, height: g.S * u, background: th.line }} />
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

const Cursor: React.FC<{ x: number; y: number; u: number; name: string; down: number }> = ({ x, y, u, name, down }) => (
  <div style={{ position: "absolute", left: x * u, top: y * u, transform: `scale(${1 - 0.12 * down})`, transformOrigin: "0 0" }}>
    <svg width={24 * u} height={26 * u} viewBox="0 0 24 26" style={{ position: "absolute", left: -2 * u, top: -2 * u, overflow: "visible" }}>
      <defs>
        <filter id="acs-cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
      </defs>
      <path d="M2 2 L2 21 L7.2 16.3 L10.6 24 L14 22.5 L10.7 15 L17.6 15 Z" transform="translate(0 1.2)" fill="rgba(0,0,0,0.28)" filter="url(#acs-cursor-shadow)" />
      <path d="M2 2 L2 21 L7.2 16.3 L10.6 24 L14 22.5 L10.7 15 L17.6 15 Z" fill={BLUE} stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 16 * u,
        top: 24 * u,
        padding: `${5 * u}px ${10 * u}px`,
        borderRadius: `${3 * u}px ${9 * u}px ${9 * u}px ${9 * u}px`,
        background: BLUE,
        color: "#FFFFFF",
        fontFamily: FONT_SANS,
        fontSize: 14 * u,
        fontWeight: 500,
        whiteSpace: "nowrap",
        boxShadow: `0 ${2 * u}px ${6 * u}px rgba(0,0,0,0.14)`,
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

  const swatches = [p.swatch1, p.swatch2, p.swatch3, p.swatch4, p.swatch5];
  const [ia, ib] = swatchIndices(p.startSwatch, p.secondSwatch);
  const A = toRgb(swatches[ia]), B = toRgb(swatches[ib]);
  const th = isDarkPage(p.page) ? DARK : LIGHT;

  // 0 = first colour, 1 = second colour; each element runs its own cross-fade, delayed by d frames after each click
  const w = (d: number, len: number = T.fade) =>
    clamp01(progress(f, T.click1 + d, T.click1 + d + len, p.ease) - progress(f, T.click2 + d, T.click2 + d + len, p.ease));
  const ac: Accent = (d, len) => lerpRgb(A, B, w(d, len));
  const onA = textOn(A), onB = textOn(B);
  const on: Accent = (d, len) => lerpRgb(onA, onB, w(d, len));

  // selection ring glides between swatches (may overshoot with a bouncy ease)
  const sx = (i: number) => g.pad + i * (g.S + g.gap);
  const r = progress(f, T.click1, T.click1 + T.ring, p.ease) - progress(f, T.click2, T.click2 + T.ring, p.ease);
  const hexW = w(DELAY.panel, 10);

  // cursor
  const target = (i: number): [number, number] => [g.PX + sx(i) + g.S / 2 + 2, g.PY + g.swY + g.S / 2 + 4];
  const [cx, cy] =
    f < T.move1[0]
      ? g.park
      : f < T.move2[0]
        ? glide(f, T.move1, g.park, target(ib), p.ease)
        : f < T.move3[0]
          ? glide(f, T.move2, target(ib), target(ia), p.ease)
          : glide(f, T.move3, target(ia), g.park, p.ease);
  const down = Math.max(press(f, T.heroClick), press(f, T.click1), press(f, T.click2));
  const swPress: [number, number] = f < (T.click1 + T.click2) / 2 ? [ib, press(f, T.click1)] : [ia, press(f, T.click2)];

  // selection box on the hero
  const sel = clamp01(progress(f, T.selIn[0], T.selIn[1], "smooth") - progress(f, T.selOut[0], T.selOut[1], "smooth"));
  const handle = 10 * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* frame name, Framer-style */}
      <div style={{ position: "absolute", left: g.AX * u, top: (g.AY - 30) * u, fontSize: 15 * u, fontWeight: 500, color: css(lerpRgb(toRgb(th.sub), toRgb(BLUE), sel)) }}>Hero</div>

      {/* the hero artboard */}
      <div style={{ position: "absolute", left: g.AX * u, top: g.AY * u, width: g.AW * u, height: g.AH * u, overflow: "hidden", boxShadow: `0 0 0 ${u}px ${th.line}, ${th.shadow}` }}>
        <div style={{ transform: `scale(${(g.AW * u) / g.DW})`, transformOrigin: "0 0" }}>
          <Hero g={g} th={th} page={p.page} p={p} ac={ac} on={on} />
        </div>
      </div>

      {/* selection box + size label */}
      <div style={{ position: "absolute", left: g.AX * u, top: g.AY * u, width: g.AW * u, height: g.AH * u, opacity: sel }}>
        <div style={{ position: "absolute", inset: 0, border: `${1.5 * u}px solid ${BLUE}` }} />
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
              background: "#FFFFFF",
              border: `${1.5 * u}px solid ${BLUE}`,
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
            borderRadius: 5 * u,
            background: BLUE,
            color: "#FFFFFF",
            fontSize: 13 * u,
            fontWeight: 600,
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
        swatches={swatches}
        ringX={mix(sx(ia), sx(ib), r)}
        pressed={swPress}
        chip={ac(DELAY.panel, 10)}
        hexA={swatches[ia].toUpperCase()}
        hexB={swatches[ib].toUpperCase()}
        hexW={hexW}
      />

      <Cursor x={cx} y={cy} u={u} name={p.cursorName} down={down} />
    </AbsoluteFill>
  );
};
