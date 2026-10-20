import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type AmountReceiptProps = {
  background: string;
  card: string;
  accent: string;
  recipient: string;
  initials: string;
  currency: string;
  amount: string;
  note: string;
  buttonLabel: string;
  reference: string;
  ease: string;
};

// Timeline (frames at 30fps, 180 total). The morph runs LEN frames from MORPH; at BACK the same windows play mirrored.
export const T = {
  cursorFrom: 4,
  press: 24,
  morph: 30,
  len: 44,
  back: 130,
  cursorOut: [40, 54] as const,
  cursorIn: [164, 178] as const,
};

// ---------------------------------------------------------------------------------------------------------------
// Layout, in px at 1080 on the short side. Every position is measured from the card's top-left in that state.
// Sheet amount x = centre; receipt amount x = left edge. Sheet note x = left edge; receipt note x = right edge.
type Geo = {
  w: number;
  h: number;
  p: number;
  r: number;
  amount: { x: number; cy: number; size: number; maxW: number };
  avatar: { x: number; y: number; d: number };
  name: { x: number; y: number; size: number };
  note: { x: number; cy: number; size: number };
  button: { x: number; y: number; w: number; h: number; size: number };
};
type SheetExtra = {
  header: { cy: number; size: number; close: number };
  to: { y: number; size: number };
  divY: number;
  chip: { cy: number; h: number; size: number };
  field: { y: number; h: number; label: number };
};
type ReceiptExtra = {
  split: number | null; // 16:9 only: x of the vertical hairline between the two columns
  check: { x: number; y: number; d: number };
  sent: { x: number; cy: number; size: number };
  now: { right: number; size: number };
  title: { cy: number; size: number } | null;
  rows: { x: number; right: number; y0: number; rh: number; size: number };
};
export type ReceiptLayout = { S: Geo; R: Geo; sheet: SheetExtra; receipt: ReceiptExtra };

export const layoutFor = (ratio: Ratio): ReceiptLayout => {
  if (ratio === "16:9") {
    return {
      S: {
        w: 1160, h: 880, p: 64, r: 44,
        amount: { x: 580, cy: 418, size: 184, maxW: 1032 },
        avatar: { x: 64, y: 148, d: 88 },
        name: { x: 180, y: 190, size: 36 },
        note: { x: 180, cy: 628, size: 28 },
        button: { x: 64, y: 704, w: 1032, h: 112, size: 34 },
      },
      R: {
        w: 1520, h: 880, p: 64, r: 44,
        amount: { x: 64, cy: 448, size: 128, maxW: 592 },
        avatar: { x: 64, y: 268, d: 56 },
        name: { x: 138, y: 282, size: 28 },
        note: { x: 1456, cy: 136 + 136 * 2.5, size: 28 },
        button: { x: 64, y: 704, w: 592, h: 112, size: 32 },
      },
      sheet: {
        header: { cy: 92, size: 30, close: 56 },
        to: { y: 156, size: 24 },
        divY: 276,
        chip: { cy: 526, h: 48, size: 24 },
        field: { y: 584, h: 88, label: 26 },
      },
      receipt: {
        split: 720,
        check: { x: 64, y: 64, d: 64 },
        sent: { x: 148, cy: 96, size: 32 },
        now: { right: 656, size: 26 },
        title: { cy: 96, size: 26 },
        rows: { x: 784, right: 1456, y0: 136, rh: 136, size: 28 },
      },
    };
  }
  if (ratio === "9:16") {
    return {
      S: {
        w: 960, h: 1240, p: 64, r: 48,
        amount: { x: 480, cy: 580, size: 176, maxW: 832 },
        avatar: { x: 64, y: 164, d: 104 },
        name: { x: 196, y: 214, size: 40 },
        note: { x: 196, cy: 970, size: 30 },
        button: { x: 64, y: 1056, w: 832, h: 120, size: 36 },
      },
      R: {
        w: 960, h: 1360, p: 64, r: 48,
        amount: { x: 64, cy: 330, size: 136, maxW: 832 },
        avatar: { x: 64, y: 184, d: 60 },
        name: { x: 144, y: 197, size: 34 },
        note: { x: 896, cy: 448 + 136 * 2.5, size: 30 },
        button: { x: 64, y: 1176, w: 832, h: 120, size: 34 },
      },
      sheet: {
        header: { cy: 94, size: 32, close: 60 },
        to: { y: 180, size: 26 },
        divY: 324,
        chip: { cy: 712, h: 52, size: 26 },
        field: { y: 920, h: 100, label: 28 },
      },
      receipt: {
        split: null,
        check: { x: 64, y: 64, d: 72 },
        sent: { x: 160, cy: 100, size: 36 },
        now: { right: 896, size: 28 },
        title: null,
        rows: { x: 64, right: 896, y0: 448, rh: 136, size: 30 },
      },
    };
  }
  return {
    S: {
      w: 880, h: 920, p: 56, r: 40,
      amount: { x: 440, cy: 372, size: 156, maxW: 768 },
      avatar: { x: 56, y: 128, d: 80 },
      name: { x: 160, y: 168, size: 32 },
      note: { x: 160, cy: 682, size: 26 },
      button: { x: 56, y: 760, w: 768, h: 104, size: 32 },
    },
    R: {
      w: 880, h: 960, p: 56, r: 40,
      amount: { x: 56, cy: 262, size: 112, maxW: 768 },
      avatar: { x: 56, y: 148, d: 48 },
      name: { x: 120, y: 159, size: 26 },
      note: { x: 824, cy: 344 + 80 * 2.5, size: 24 },
      button: { x: 56, y: 800, w: 768, h: 104, size: 30 },
    },
    sheet: {
      header: { cy: 82, size: 28, close: 52 },
      to: { y: 138, size: 22 },
      divY: 244,
      chip: { cy: 474, h: 44, size: 22 },
      field: { y: 640, h: 84, label: 24 },
    },
    receipt: {
      split: null,
      check: { x: 56, y: 56, d: 56 },
      sent: { x: 132, cy: 84, size: 30 },
      now: { right: 824, size: 24 },
      title: null,
      rows: { x: 56, right: 824, y0: 344, rh: 80, size: 24 },
    },
  };
};

// Rough Geist advance widths (em) so long amounts shrink to fit instead of overflowing the card.
const amountEm = (s: string) =>
  s.split("").reduce((a, c) => a + (/[0-9]/.test(c) ? 0.6 : /[.,' ]/.test(c) ? 0.28 : 0.64) - 0.045, 0);
export const fitSize = (s: string, size: number, maxW: number) => Math.min(size, maxW / Math.max(amountEm(s), 0.5));

export const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const tones = (card: string, accent: string, background: string) => {
  const light = isLight(card);
  return {
    light,
    darkCanvas: !isLight(background),
    text: light ? "#0E0F12" : "#FFFFFF",
    sub: light ? "#7B7E87" : "rgba(255,255,255,0.56)",
    hair: light ? "#E8E8EC" : "rgba(255,255,255,0.10)",
    fill: light ? "#F2F2EF" : "rgba(255,255,255,0.07)",
    onAccent: isLight(accent) ? "#0E0F12" : "#FFFFFF",
  };
};

export const DATE_TEXT = "Oct 20, 2026 · 9:41 AM";
export const CHIP_TEXT = "From Checking •• 4821";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const c01 = (v: number) => Math.min(1, Math.max(0, v));

export const AmountReceipt: React.FC<AmountReceiptProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const L = layoutFor(ratio);
  const { S, R, sheet, receipt } = L;
  const c = tones(p.card, p.accent, p.background);

  // A window [a, b] inside the morph. Forward from MORPH; mirrored from BACK so the receipt folds back last-in first-out.
  const win = (a: number, b: number, ease: string = p.ease) =>
    frame < T.back
      ? progress(frame, T.morph + a, T.morph + b, ease)
      : 1 - progress(frame, T.back + T.len - b, T.back + T.len - a, ease);

  const mOut = win(0, 10, "soft");
  const mCard = win(2, 28);
  const mAmt = win(2, 28);
  const mBtn = win(4, 30);
  const mWho = win(5, 31);
  const mNote = win(8, 34);
  const lblOut = win(4, 12, "soft");
  const lblIn = win(10, 20, "soft");
  const mCheck = win(12, 24);
  const mDraw = win(16, 30, "soft");
  const mHead = win(14, 26, "soft");
  const rowIn = (i: number) => win(16 + 3 * i, 30 + 3 * i, "soft");

  // Card box, centred on the canvas.
  const cw = mix(S.w, R.w, mCard) * u;
  const ch = mix(S.h, R.h, mCard) * u;
  const cl = -cw / 2;
  const ct = -ch / 2;
  const cr = cw / 2;

  // Shared anchors: interpolate between the two states, measured from the canvas centre.
  const lerpX = (a: number, aw: number, b: number, bw: number, t: number) => mix(a - aw / 2, b - bw / 2, t) * u;
  const lerpY = (a: number, ah: number, b: number, bh: number, t: number) => mix(a - ah / 2, b - bh / 2, t) * u;

  const amountText = `${p.currency}${p.amount}`;
  const sSize = fitSize(amountText, S.amount.size, S.amount.maxW);
  const rSize = fitSize(amountText, R.amount.size, R.amount.maxW);
  const kA = c01(mAmt);

  const blur = (v: number) => (v > 0.002 && v < 0.998 ? `blur(${v * 6 * u}px)` : undefined);
  const fadeOut = (extra = ""): React.CSSProperties => ({
    opacity: 1 - mOut,
    filter: blur(mOut),
    transform: `${extra} translateY(${-mOut * 8 * u}px)`,
  });
  const fadeIn = (t: number, extra = ""): React.CSSProperties => ({
    opacity: c01(t),
    filter: blur(1 - c01(t)),
    transform: `${extra} translateY(${(1 - t) * 14 * u}px)`,
  });

  const abs: React.CSSProperties = { position: "absolute", whiteSpace: "nowrap", lineHeight: 1 };

  // Button press.
  const press = interpolate(frame, [T.press, T.press + 3, T.press + 9], [1, 0.965, 1], clamp);
  const bx = lerpX(S.button.x, S.w, R.button.x, R.w, mBtn);
  const by = lerpY(S.button.y, S.h, R.button.y, R.h, mBtn);
  const bw = mix(S.button.w, R.button.w, mBtn) * u;
  const bh = mix(S.button.h, R.button.h, mBtn) * u;

  // Cursor: rests just under the button, glides in on a slight arc, presses, then fades; returns before the loop point.
  const tip = { x: (S.button.x + S.button.w * 0.62 - S.w / 2) * u, y: (S.button.y + S.button.h * 0.56 - S.h / 2) * u };
  const rest = { x: tip.x + 170 * u, y: (S.button.y + S.button.h + 36 - S.h / 2) * u };
  const go = progress(frame, T.cursorFrom, T.press, "smooth");
  const gone = progress(frame, T.cursorOut[0], T.cursorOut[1], "soft");
  const back = progress(frame, T.cursorIn[0], T.cursorIn[1], "soft");
  const returning = frame >= T.cursorIn[0];
  const curX = returning ? rest.x + (1 - back) * 20 * u : mix(rest.x, tip.x, go) + gone * 22 * u;
  const curY = returning ? rest.y + (1 - back) * 20 * u : mix(rest.y, tip.y, go) - Math.sin(Math.PI * go) * 46 * u + gone * 26 * u;
  const curO = returning ? back : 1 - gone;
  const curS = interpolate(frame, [T.press, T.press + 3, T.press + 9], [1, 0.9, 1], clamp);
  const curD = 42 * u;

  const rows: { label: string; value: string; mono?: boolean; strong?: boolean }[] = [
    { label: "Date", value: DATE_TEXT },
    { label: "Reference", value: p.reference, mono: true },
    { label: "Note", value: "" }, // the note text itself travels here from the sheet
    { label: "Fee", value: `${p.currency}0.00` },
    { label: "Total", value: amountText, strong: true },
  ];
  const rx = cl + receipt.rows.x * u;
  const rRight = cr - (R.w - receipt.rows.right) * u;
  const rTop = (y: number) => ct + y * u;

  const cardBorder = c.light || c.darkCanvas ? `${1 * u}px solid ${c.light ? "#E8E8EC" : "rgba(255,255,255,0.07)"}` : "none";
  const cardShadow = c.darkCanvas
    ? "none"
    : c.light
      ? `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`
      : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.08), 0 ${14 * u}px ${36 * u}px rgba(0,0,0,0.12)`;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, color: c.text }}>
        {/* Card */}
        <div
          style={{
            position: "absolute",
            left: cl,
            top: ct,
            width: cw,
            height: ch,
            borderRadius: mix(S.r, R.r, mCard) * u,
            background: p.card,
            border: cardBorder,
            boxShadow: cardShadow,
            boxSizing: "border-box",
          }}
        />

        {/* ---- Sheet-only parts (leave first, return last) ---- */}
        {mOut < 1 && (
          <>
            <div style={{ ...abs, left: cl + S.p * u, top: ct + sheet.header.cy * u, fontSize: sheet.header.size * u, fontWeight: 500, letterSpacing: "-0.02em", ...fadeOut("translateY(-50%)") }}>
              Send money
            </div>
            <div
              style={{
                ...abs,
                left: cr - (S.p + sheet.header.close) * u,
                top: ct + (sheet.header.cy - sheet.header.close / 2) * u,
                width: sheet.header.close * u,
                height: sheet.header.close * u,
                borderRadius: "50%",
                background: c.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...fadeOut(),
              }}
            >
              <svg width={sheet.header.close * 0.42 * u} height={sheet.header.close * 0.42 * u} viewBox="0 0 24 24" fill="none" stroke={c.sub} strokeWidth={2.4} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </div>
            <div style={{ ...abs, left: cl + S.name.x * u, top: ct + sheet.to.y * u, fontSize: sheet.to.size * u, color: c.sub, ...fadeOut() }}>To</div>
            <div style={{ ...abs, left: cl + S.p * u, top: ct + sheet.divY * u, width: (S.w - 2 * S.p) * u, height: Math.max(1, u), background: c.hair, ...fadeOut() }} />
            <div
              style={{
                ...abs,
                left: 0,
                top: ct + sheet.chip.cy * u,
                height: sheet.chip.h * u,
                padding: `0 ${sheet.chip.h * 0.42 * u}px`,
                borderRadius: sheet.chip.h * u,
                background: c.fill,
                color: c.sub,
                fontSize: sheet.chip.size * u,
                display: "flex",
                alignItems: "center",
                ...fadeOut("translate(-50%, -50%)"),
              }}
            >
              {CHIP_TEXT}
            </div>
            <div
              style={{
                ...abs,
                left: cl + S.p * u,
                top: ct + sheet.field.y * u,
                width: (S.w - 2 * S.p) * u,
                height: sheet.field.h * u,
                borderRadius: 22 * u,
                background: c.fill,
                ...fadeOut(),
              }}
            >
              <span style={{ position: "absolute", left: 32 * u, top: "50%", transform: "translateY(-50%)", fontSize: sheet.field.label * u, color: c.sub }}>Note</span>
            </div>
          </>
        )}

        {/* ---- Receipt-only parts (arrive after the anchors start moving) ---- */}
        {mHead > 0 && (
          <>
            {receipt.split !== null && (
              <div style={{ ...abs, left: cl + receipt.split * u, top: ct, width: Math.max(1, u), height: ch, background: c.hair, opacity: c01(mHead) }} />
            )}
            {receipt.title && (
              <div style={{ ...abs, left: rx, top: ct + receipt.title.cy * u, fontSize: receipt.title.size * u, color: c.sub, ...fadeIn(mHead, "translateY(-50%)") }}>Details</div>
            )}
            <div style={{ ...abs, left: cl + receipt.sent.x * u, top: ct + receipt.sent.cy * u, fontSize: receipt.sent.size * u, fontWeight: 500, letterSpacing: "-0.02em", ...fadeIn(mHead, "translateY(-50%)") }}>
              Sent
            </div>
            <div
              style={{
                ...abs,
                left: (receipt.split !== null ? cl + receipt.now.right * u : cr - (R.w - receipt.now.right) * u),
                top: ct + receipt.sent.cy * u,
                fontSize: receipt.now.size * u,
                color: c.sub,
                ...fadeIn(mHead, "translate(-100%, -50%)"),
              }}
            >
              Just now
            </div>
          </>
        )}
        {mCheck > 0 && (
          <div
            style={{
              ...abs,
              left: cl + receipt.check.x * u,
              top: ct + receipt.check.y * u,
              width: receipt.check.d * u,
              height: receipt.check.d * u,
              borderRadius: "50%",
              background: p.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: c01(mCheck),
              transform: `scale(${mix(0.6, 1, mCheck)})`,
            }}
          >
            <svg width={receipt.check.d * 0.56 * u} height={receipt.check.d * 0.56 * u} viewBox="0 0 24 24" fill="none" stroke={c.onAccent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 12.5l3.6 3.6L17.5 8.6" strokeDasharray={15} strokeDashoffset={15 * (1 - c01(mDraw))} />
            </svg>
          </div>
        )}
        {rows.map((row, i) => {
          const t = rowIn(i);
          if (t <= 0) return null;
          const cy = rTop(receipt.rows.y0 + receipt.rows.rh * (i + 0.5));
          const fs = receipt.rows.size * u;
          return (
            <React.Fragment key={row.label}>
              <div style={{ ...abs, left: rx, top: rTop(receipt.rows.y0 + receipt.rows.rh * i), width: rRight - rx, height: Math.max(1, u), background: c.hair, opacity: c01(t) }} />
              <div style={{ ...abs, left: rx, top: cy, fontSize: fs, color: row.strong ? c.text : c.sub, fontWeight: row.strong ? 500 : 400, ...fadeIn(t, "translateY(-50%)") }}>{row.label}</div>
              {row.value !== "" && (
                <div
                  style={{
                    ...abs,
                    left: rRight,
                    top: cy,
                    fontSize: row.mono ? fs * 0.92 : fs,
                    fontFamily: row.mono ? FONT_MONO : FONT_SANS,
                    fontWeight: row.strong ? 600 : 500,
                    letterSpacing: row.mono ? "0.02em" : "-0.01em",
                    ...fadeIn(t, "translate(-100%, -50%)"),
                  }}
                >
                  {row.value}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* ---- Anchors: these never disappear ---- */}
        {/* Avatar */}
        {(() => {
          const d = mix(S.avatar.d, R.avatar.d, mWho) * u;
          return (
            <div
              style={{
                ...abs,
                left: lerpX(S.avatar.x, S.w, R.avatar.x, R.w, mWho),
                top: lerpY(S.avatar.y, S.h, R.avatar.y, R.h, mWho),
                width: d,
                height: d,
                borderRadius: "50%",
                background: c.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: d * 0.36,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              {p.initials}
            </div>
          );
        })()}
        {/* Name */}
        <div
          style={{
            ...abs,
            left: lerpX(S.name.x, S.w, R.name.x, R.w, mWho),
            top: lerpY(S.name.y, S.h, R.name.y, R.h, mWho),
            fontSize: S.name.size * u,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            transformOrigin: "0 0",
            transform: `scale(${mix(1, R.name.size / S.name.size, mWho)})`,
          }}
        >
          {p.recipient}
        </div>
        {/* Note text: from the note field (left-aligned) to the Note row value (right-aligned) */}
        {(() => {
          const k = c01(mNote);
          return (
            <div
              style={{
                ...abs,
                left: lerpX(S.note.x, S.w, R.note.x, R.w, mNote),
                top: lerpY(S.note.cy, S.h, R.note.cy, R.h, mNote),
                fontSize: S.note.size * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                transformOrigin: `${100 * k}% 50%`,
                transform: `translate(${-100 * k}%, -50%) scale(${mix(1, R.note.size / S.note.size, mNote)})`,
              }}
            >
              {p.note}
            </div>
          );
        })()}
        {/* Amount: the hero. Centre-anchored on the sheet, left-anchored as the receipt headline. */}
        <div
          style={{
            ...abs,
            left: lerpX(S.amount.x, S.w, R.amount.x, R.w, mAmt),
            top: lerpY(S.amount.cy, S.h, R.amount.cy, R.h, mAmt),
            fontSize: sSize * u,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            transformOrigin: `${50 * (1 - kA)}% 50%`,
            transform: `translate(${-50 * (1 - kA)}%, -50%) scale(${mix(1, rSize / sSize, mAmt)})`,
          }}
        >
          {amountText}
        </div>
        {/* Button: Send → Share receipt */}
        <div
          style={{
            position: "absolute",
            left: bx,
            top: by,
            width: bw,
            height: bh,
            borderRadius: bh / 2,
            background: p.accent,
            color: c.onAccent,
            overflow: "hidden",
            transform: `scale(${press})`,
          }}
        >
          {lblOut < 1 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: S.button.size * u,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                opacity: 1 - lblOut,
                filter: blur(lblOut * 0.7),
                transform: `translateY(${-lblOut * bh * 0.4}px)`,
              }}
            >
              {p.buttonLabel}
            </div>
          )}
          {lblIn > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: R.button.size * 0.45 * u,
                fontSize: R.button.size * u,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                opacity: c01(lblIn),
                filter: blur((1 - c01(lblIn)) * 0.7),
                transform: `translateY(${(1 - lblIn) * bh * 0.4}px)`,
              }}
            >
              <svg width={R.button.size * 0.95 * u} height={R.button.size * 0.95 * u} viewBox="0 0 24 24" fill="none" stroke={c.onAccent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5v11M8 7.5l4-4 4 4M6 11.5v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7" />
              </svg>
              Share receipt
            </div>
          )}
        </div>

        {/* Cursor */}
        {curO > 0 && (
          <svg
            width={curD}
            height={curD}
            viewBox="0 0 28 28"
            style={{
              position: "absolute",
              left: curX - (3 / 28) * curD,
              top: curY - (2.5 / 28) * curD,
              opacity: curO,
              transformOrigin: `${(3 / 28) * 100}% ${(2.5 / 28) * 100}%`,
              transform: `scale(${curS})`,
              overflow: "visible",
            }}
          >
            <path
              d="M3 2.5 L3 21.5 L8.3 16.6 L11.8 24.4 L15 23 L11.6 15.4 L18.8 15.4 Z"
              fill={c.light ? "#0E0F12" : "#FFFFFF"}
              stroke={c.light ? "#FFFFFF" : "#0E0F12"}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};
