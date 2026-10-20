// Edited props travel in the URL as `?p=`: base64url-encoded JSON holding only the keys that differ from the
// component's defaults, so shared links stay short and unedited pages keep a clean URL.
import { isAreaValue, isPointValue } from "@/motion/placement";
import type { AnyMotionDef, ControlDef, MotionProps, PropValue } from "@/motion/types";

const HEX_COLOR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

// Colours compare case-insensitively: the native colour picker reports lowercase hex while defs use uppercase.
export const sameValue = (a: PropValue | undefined, b: PropValue | undefined) => {
  if (typeof a === "string" && typeof b === "string" && HEX_COLOR.test(a) && HEX_COLOR.test(b)) return a.toLowerCase() === b.toLowerCase();
  return a === b;
};

export const propsEqual = (a: MotionProps, b: MotionProps) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (!sameValue(a[key], b[key])) return false;
  return true;
};

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (raw: string) => {
  const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

// Uploads live only in this browser, so a shared link falls back to the sample image.
const isLocalFile = (value: PropValue | undefined) => typeof value === "string" && /^(blob|data):/.test(value);

// Returns "" when nothing differs from the defaults.
export const encodeProps = (def: AnyMotionDef, props: MotionProps): string => {
  const defaults = def.defaultProps as MotionProps;
  const changed: MotionProps = {};
  for (const key of Object.keys(defaults)) {
    if (key in props && !sameValue(props[key], defaults[key]) && !isLocalFile(props[key])) changed[key] = props[key];
  }
  return Object.keys(changed).length ? toBase64Url(JSON.stringify(changed)) : "";
};

// A value from the URL is untrusted: keep it only if it matches the default's type and, where a control
// describes the key, the control's constraints.
const acceptValue = (control: ControlDef | undefined, fallback: PropValue, value: unknown): PropValue | undefined => {
  if (typeof value !== typeof fallback) return undefined;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    return control?.type === "number" ? Math.min(control.max, Math.max(control.min, value)) : value;
  }
  if (typeof value === "string") {
    if (control?.type === "select" && !control.options.some((o) => o.value === value)) return undefined;
    if (control?.type === "color" && !HEX_COLOR.test(value) && value !== "transparent") return undefined;
    // Only bundled sample images are linkable; anything else could point the player at an outside URL.
    if (control?.type === "image" && !value.startsWith("/templates/")) return undefined;
    if (control?.type === "area" && !isAreaValue(value)) return undefined;
    if (control?.type === "point" && !isPointValue(value)) return undefined;
    if (control?.type === "text" && control.maxLength !== undefined) return value.slice(0, control.maxLength);
    return value.slice(0, 500);
  }
  if (typeof value === "boolean") return value;
  return undefined;
};

// Returns the full props: defaults with every valid override from `raw` applied. Unknown keys are dropped.
export const decodeProps = (def: AnyMotionDef, raw: string | null | undefined): MotionProps => {
  const defaults = { ...(def.defaultProps as MotionProps) };
  if (!raw) return defaults;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(raw));
  } catch {
    return defaults;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
  const controls = new Map(def.controls.map((c): [string, ControlDef] => [c.key, c]));
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
    const accepted = acceptValue(controls.get(key), defaults[key], value);
    if (accepted !== undefined) defaults[key] = accepted;
  }
  return defaults;
};
