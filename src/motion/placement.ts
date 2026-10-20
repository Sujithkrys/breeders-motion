// Placements: where on an uploaded image a template puts its cursor click or its selection box. Stored as plain
// strings so they travel in props, prompts and shared links like any other value. All numbers are fractions of the
// image (0–1): an area is "x,y,w,h", a point is "x,y". The Edit tab writes them; templates read them with the parsers.

export type Area = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

export const MIN_AREA = 0.04; // smallest side, so a box can't collapse to nothing

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number) => Math.round(n * 1000) / 1000;
const numbers = (value: unknown, count: number) => {
  if (typeof value !== "string") return null;
  const parts = value.split(",").map(Number);
  return parts.length === count && parts.every((n) => Number.isFinite(n)) ? parts : null;
};

// Keeps an area inside the image and at least MIN_AREA on each side.
export const clampArea = (a: Area): Area => {
  const w = Math.min(1, Math.max(MIN_AREA, a.w));
  const h = Math.min(1, Math.max(MIN_AREA, a.h));
  return { x: Math.min(1 - w, Math.max(0, a.x)), y: Math.min(1 - h, Math.max(0, a.y)), w, h };
};
export const clampPoint = (p: Point): Point => ({ x: clamp01(p.x), y: clamp01(p.y) });

export const areaValue = (a: Area) => {
  const c = clampArea(a);
  return [c.x, c.y, c.w, c.h].map(round).join(",");
};
export const pointValue = (p: Point) => {
  const c = clampPoint(p);
  return [c.x, c.y].map(round).join(",");
};

// Parsers never throw: anything malformed falls back to the template's default placement.
export const parseArea = (value: unknown, fallback: Area): Area => {
  const n = numbers(value, 4);
  return n ? clampArea({ x: n[0], y: n[1], w: n[2], h: n[3] }) : fallback;
};
export const parsePoint = (value: unknown, fallback: Point): Point => {
  const n = numbers(value, 2);
  return n ? clampPoint({ x: n[0], y: n[1] }) : fallback;
};

export const isAreaValue = (value: string) => {
  const n = numbers(value, 4);
  return !!n && n.every((v) => v >= 0 && v <= 1);
};
export const isPointValue = (value: string) => {
  const n = numbers(value, 2);
  return !!n && n.every((v) => v >= 0 && v <= 1);
};

// Maps a placement onto an image drawn at (left, top, width, height) in frame pixels.
export const areaOn = (a: Area, left: number, top: number, width: number, height: number) => ({
  x: left + a.x * width,
  y: top + a.y * height,
  w: a.w * width,
  h: a.h * height,
});
export const pointOn = (p: Point, left: number, top: number, width: number, height: number) => ({ x: left + p.x * width, y: top + p.y * height });

// For prompts: "x 30–70%, y 12–62%" / "x 52%, y 40%".
export const areaText = (a: Area) =>
  `x ${Math.round(a.x * 100)}–${Math.round((a.x + a.w) * 100)}%, y ${Math.round(a.y * 100)}–${Math.round((a.y + a.h) * 100)}%`;
export const pointText = (p: Point) => `x ${Math.round(p.x * 100)}%, y ${Math.round(p.y * 100)}%`;
