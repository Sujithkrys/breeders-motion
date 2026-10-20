// Colour maths for the picker. Props hold "#RRGGBB", or "#RRGGBBAA" when opacity is below 100%.

export type RGB = { r: number; g: number; b: number };
export type HSV = { h: number; s: number; v: number }; // h 0–360, s and v 0–1
export type HSL = { h: number; s: number; l: number }; // h 0–360, s and l 0–1

const HEX = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const parseHex = (raw: string): { rgb: RGB; a: number } | null => {
  const m = HEX.exec(raw.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { rgb: { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }, a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
};

const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
// Opaque colours stay 6-digit so they match the defs' palettes and read cleanly in prompts.
export const toHex = ({ r, g, b }: RGB, a = 1) => `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 0.999 ? hex2(a * 255) : ""}`;
// Uppercase "#RRGGBB" or "#RRGGBBAA", or null if `raw` isn't a hex colour.
export const normaliseHex = (raw: string) => {
  const p = parseHex(raw);
  return p ? toHex(p.rgb, p.a) : null;
};

export const rgbToHsv = ({ r, g, b }: RGB): HSV => {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const d = max - Math.min(R, G, B);
  let h = 0;
  if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
};

export const hsvToRgb = ({ h, s, v }: HSV): RGB => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return 255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return { r: f(5), g: f(3), b: f(1) };
};

export const hsvToHsl = ({ h, s, v }: HSV): HSL => {
  const l = v * (1 - s / 2);
  return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
};

export const hslToHsv = ({ h, s, l }: HSL): HSV => {
  const v = l + s * Math.min(l, 1 - l);
  return { h, s: v ? 2 * (1 - l / v) : 0, v };
};
