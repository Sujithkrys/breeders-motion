// Shared pieces for templates: short designed films (6–10s) in the look of the Figma, OpenAI, Spotify and Elon films.
// Templates cut between full-frame shots on a steady rhythm; these helpers keep the shot timing, the film palette and
// the recurring props (code texture, multiplayer cursors, selection boxes, logo and screenshot slots) identical across
// every template. Sizes are in design units: pass `u` from useLayout().
import React from "react";
import { Img, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_MONO, FONT_SANS } from "./kit";

// ---- Film palette (from the reference films; see out/Breeders-Templates-look-frames.png). Flat fields of colour,
// never gradients. Each shot uses one field colour plus black or white type; orange is kept for data and calls to action.
export const FILM = {
  black: "#000000",
  white: "#FFFFFF",
  cream: "#F2EFE8",
  canvas: "#E6E6E6",
  lavender: "#C4B9FD",
  lime: "#E3F79C",
  green: "#0C5A2F",
  greenInk: "#E6F5C2",
  plum: "#5B2A5E",
  select: "#0D99FF",
  orange: "#FF5A1F",
} as const;

// Multiplayer cursor colours, as in Figma's own films.
export const CURSOR_COLORS = { pink: "#F24E9C", green: "#14AE5C", blue: "#0D99FF", orange: "#FF7A00", purple: "#9747FF" } as const;

// Bundled sample brand. Image controls default to these; users replace them with their own uploads.
export const SAMPLE = {
  brand: "Lumen",
  logo: "/templates/lumen-logo.svg", // black tile; `Logo` swaps in logoLight on dark backgrounds
  logoLight: "/templates/lumen-logo-light.svg",
  site: "/templates/lumen-site.png", // 1440 × 900 landing page at 2x
  phone: "/templates/lumen-phone.png", // 390 × 844 phone screen at 3x
  appDark: "/templates/lumen-app-dark.png", // 1440 × 900 dark-mode app at 2x
  phoneDark: "/templates/lumen-phone-dark.png", // 390 × 844 dark-mode phone screen at 3x
  partner: "Relay",
  partnerIcon: "/templates/relay-icon.png", // 512 × 512 app icon (lime tile)
  avatar: "/templates/avatar-mj.png", // 512 × 512 round monogram for "Maya Jensen"
} as const;

// Fictional customer logos (mark + wordmark, transparent PNG, ~3:1), in ink (#111) and white versions.
export const CUSTOMER_LOGOS = ["northwind", "halcyon", "quanta", "fieldwork", "orbital", "parallel", "kite", "monolith", "sable", "arcadia"] as const;
export const customerLogo = (name: (typeof CUSTOMER_LOGOS)[number], tone: "ink" | "white" = "ink") => `/templates/logos/${tone}/${name}.png`;

// Templates run 6–10s at 30fps.
export const TEMPLATE_DURATIONS = [180, 210, 240, 270, 300] as const;
// Default shot length: a cut every 1.5s reads as calm but alive (the Figma film cuts every 1–2s).
export const SHOT = 45;

// ---- Shot timing. `starts` are the first frames of each shot, beginning with 0; the last shot runs to the end.
export const useShot = (starts: readonly number[]) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let index = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) index = i;
  const start = starts[index];
  const end = starts[index + 1] ?? durationInFrames;
  return { index, local: frame - start, length: end - start, frame };
};

// ---- Code texture: dim monospace source filling a black field (the Figma film's opening cards). Deterministic, so
// every render of the same seed is identical. `drift` is px per frame of slow upward scroll.
const WORDS = [
  "const", "frame", "=", "useCurrentFrame()", "return", "<Layer", "opacity={1}", "/>", "export", "function", "motion", "ease",
  "spring", "interpolate(", "0,", "1)", "props", "{", "}", "x:", "y:", "width", "height", "fill", "stroke", "#0D99FF", "radius",
  "layout", "auto", "grid", "gap:", "16", "24", "32", "selection", "node.children", "await", "render()", "if", "else", "=>",
];
const seeded = (seed: number) => {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

export const CodeTexture: React.FC<{ u: number; color?: string; opacity?: number; size?: number; seed?: number; drift?: number }> = ({
  u,
  color = FILM.white,
  opacity = 0.16,
  size = 15,
  seed = 7,
  drift = 0.4,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const lineH = size * 1.7 * u;
  const charW = size * 0.6 * u; // Geist Mono advance
  // Enough rows to scroll for the whole film without wrapping, so the drift never jumps.
  const rows = Math.ceil((height + durationInFrames * drift * u) / lineH) + 2;
  const chars = Math.ceil(width / charW);
  const lines = React.useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: rows }, () => {
      const indent = Math.floor(rnd() * 4) * 2;
      let line = "";
      while (line.length < chars - indent) line += WORDS[Math.floor(rnd() * WORDS.length)] + " ";
      return { indent, text: line.trimEnd() };
    });
  }, [rows, chars, seed]);
  const offset = frame * drift * u;
  // One SVG, not one element per line: the exporter rasterises an SVG in a single draw, which keeps exports fast.
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <g fill={color} opacity={opacity} fontFamily={FONT_MONO} fontSize={size * u}>
        {lines.map((l, i) => {
          const y = (i + 0.75) * lineH - offset;
          if (y < -lineH || y > height + lineH) return null;
          return (
            <text key={i} x={24 * u + l.indent * charW} y={y}>
              {l.text}
            </text>
          );
        })}
      </g>
    </svg>
  );
};

// ---- Multiplayer cursor with a name tag. (x, y) is the arrow's tip. `press` 0–1 dips it for a click.
export const Cursor: React.FC<{ u: number; x: number; y: number; name?: string; color?: string; press?: number; scale?: number }> = ({
  u,
  x,
  y,
  name,
  color = CURSOR_COLORS.pink,
  press = 0,
  scale = 1,
}) => {
  const s = scale * u * (1 - 0.1 * press);
  return (
    <div style={{ position: "absolute", left: x, top: y, transformOrigin: "0 0", transform: `scale(${s})` }}>
      <svg width={30} height={34} viewBox="0 0 22 25" style={{ position: "absolute", left: -2, top: -2, overflow: "visible" }}>
        <path d="M2 2 L2 20.5 L7.2 15.6 L10.6 23 L13.8 21.6 L10.5 14.4 L17.6 14.4 Z" fill={color} stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      {name ? (
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 26,
            height: 30,
            padding: "0 11px",
            borderRadius: 9,
            background: color,
            color: "#FFFFFF",
            fontFamily: FONT_SANS,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: "30px",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
      ) : null}
    </div>
  );
};

// ---- Selection box: hairline frame, corner handles and a dimension tag, as on a design canvas. `t` 0–1 draws it on.
export const SelectionBox: React.FC<{ u: number; x: number; y: number; w: number; h: number; color?: string; label?: string; t?: number }> = ({
  u,
  x,
  y,
  w,
  h,
  color = FILM.select,
  label,
  t = 1,
}) => {
  if (t <= 0) return null;
  const hs = 11 * u;
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, t * 1.5) }}>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, boxShadow: `inset 0 0 0 ${2 * u}px ${color}` }} />
      {corners.map(([cx, cy], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: cx - hs / 2,
            top: cy - hs / 2,
            width: hs,
            height: hs,
            background: "#FFFFFF",
            boxShadow: `inset 0 0 0 ${2 * u}px ${color}`,
            transform: `scale(${Math.min(1, t * 1.2)})`,
          }}
        />
      ))}
      {label ? (
        <div
          style={{
            position: "absolute",
            left: x + w / 2,
            top: y + h + 12 * u,
            transform: "translateX(-50%)",
            height: 30 * u,
            padding: `0 ${10 * u}px`,
            borderRadius: 6 * u,
            background: color,
            color: "#FFFFFF",
            fontFamily: FONT_SANS,
            fontSize: 16 * u,
            fontWeight: 500,
            lineHeight: `${30 * u}px`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

// ---- Logo slot: the uploaded mark at `size` px tall, followed by the brand name. Without an image, a tile with the
// brand's initial stands in, so the slot never renders empty.
// The sample logo is a black tile, which vanishes on dark fields. Light type (`color`) means a dark field, so the
// sample swaps to its white-tile version there. Uploaded logos are never changed.
const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6;
};
const sampleLogoFor = (src: string, color: string) => (src === SAMPLE.logo && isLight(color) ? SAMPLE.logoLight : src);

export const Logo: React.FC<{ src?: string; name?: string; size: number; color: string; tile?: string; onTile?: string; showName?: boolean }> = ({
  src,
  name = "",
  size,
  color,
  tile = color,
  onTile = "#FFFFFF",
  showName = true,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.32, fontFamily: FONT_SANS, color }}>
    {src ? (
      <Img src={sampleLogoFor(src, color)} style={{ height: size, width: "auto", display: "block" }} />
    ) : (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          background: tile,
          color: onTile,
          fontSize: size * 0.58,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {name.trim().charAt(0).toUpperCase()}
      </div>
    )}
    {showName && name ? <span style={{ fontSize: size * 0.82, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>{name}</span> : null}
  </div>
);

// ---- Screenshot slot: the image fills the frame's width and crops from the top, the way a page screenshot should
// read. (The exporter supports object-fit but not object-position, so cropping is done with overflow instead.)
// `line` draws a hairline over the image's edge, `shadow` a CSS box-shadow.
export const Screenshot: React.FC<{ src: string; x: number; y: number; w: number; h: number; radius: number; line?: string; shadow?: string; style?: React.CSSProperties }> = ({
  src,
  x,
  y,
  w,
  h,
  radius,
  line,
  shadow,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      overflow: "hidden",
      background: "#FFFFFF",
      boxShadow: shadow,
      ...style,
    }}
  >
    <Img src={src} style={{ width: "100%", height: "auto", display: "block" }} />
    {line ? <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 1px ${line}` }} /> : null}
  </div>
);
