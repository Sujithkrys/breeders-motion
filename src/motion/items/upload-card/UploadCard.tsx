import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type UploadCardProps = {
  background: string;
  card: string;
  ink: string;
  accent: string;
  success: string;
  fileName: string;
  sizeMb: number;
  ease: string;
};

export const T = { drop: 14, land: 38, travel: 46, upStart: 62, upEnd: 126, done: 140 };

const hexMix = (a: string, b: string, t: number) => {
  const rgb = (h: string) => {
    const s = h.replace("#", "");
    const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const x = rgb(a);
  const y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

export const extOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "FILE";
};

const FileIcon: React.FC<{ w: number; color: string; ext: string }> = ({ w, color, ext }) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg width={w} height={w * 1.2} viewBox="0 0 60 72" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`pg${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={hexMix(color, "#FFFFFF", 0.18)} />
          <stop offset="1" stopColor={hexMix(color, "#000000", 0.12)} />
        </linearGradient>
      </defs>
      <path d="M8 1h31l20 20v44a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6z" fill={`url(#pg${id})`} />
      <path d="M39 1v14a6 6 0 0 0 6 6h14z" fill={hexMix(color, "#FFFFFF", 0.45)} />
      <rect x={9} y={44} width={42} height={18} rx={5} fill="rgba(255,255,255,0.22)" />
      <text x={30} y={57.5} textAnchor="middle" fontFamily={FONT_SANS} fontSize={12.5} fontWeight={700} letterSpacing={0.6} fill="#FFFFFF">
        {ext}
      </text>
    </svg>
  );
};

export const UploadCard: React.FC<UploadCardProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const muted = alpha(p.ink, 0.56);
  const size = Math.max(1, Math.round(p.sizeMb * 10) / 10);

  const W = (ratio === "9:16" ? 820 : 760) * u;
  const P = 40 * u;
  const zoneTop = 144 * u;
  const zoneH = 300 * u;
  const zoneW = W - 2 * P;
  const rowTop = zoneTop + zoneH + 24 * u;
  const rowH = 112 * u;
  const H = rowTop + rowH + P;

  const enter = progress(f, 0, 18, p.ease);
  const fall = progress(f, T.drop, T.land, "soft");
  const hover = progress(f, T.drop + 8, T.drop + 20, p.ease) * (1 - progress(f, T.travel + 6, T.travel + 18, p.ease));
  const squash = progress(f, T.land, T.land + 3, "soft") - progress(f, T.land + 3, T.land + 10, "soft");
  const travel = progress(f, T.travel, T.travel + 16, p.ease);
  const rowIn = progress(f, T.travel + 2, T.travel + 16, p.ease);

  const bigW = 120 * u;
  const smallW = 56 * u;
  const iconW = mix(bigW, smallW, travel);
  const cx = mix(W / 2, P + 24 * u + smallW / 2, travel);
  const cy = mix(zoneTop + zoneH / 2 - (1 - fall) * 460 * u, rowTop + rowH / 2, travel);

  const raw = progress(f, T.upStart, T.upEnd, "soft");
  // A small wobble on top of the eased curve so the upload reads as real network progress; it stays monotonic.
  const v = Math.min(1, Math.max(0, raw + 0.03 * Math.sin(raw * Math.PI * 3) * (1 - raw)));
  const pct = Math.round(v * 100);
  const speed = 5.2 + 1.4 * Math.sin(f * 0.23) + 0.6 * Math.sin(f * 0.61);
  const left = Math.max(1, Math.ceil(((1 - v) * size) / speed));
  const done = progress(f, T.done, T.done + 14, p.ease);
  const tick = progress(f, T.done + 6, T.done + 22, "smooth");
  const zoneStroke = hexMix(hexMix(p.card, p.ink, 0.24), p.accent, hover);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          borderRadius: 40 * u,
          background: p.card,
          border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
          boxShadow: `0 ${40 * u}px ${100 * u}px rgba(0,0,0,0.24), 0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.08)`,
          boxSizing: "border-box",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30 * u}px)`,
        }}
      >
        <div style={{ position: "absolute", left: P, top: P, right: P, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 34 * u, fontWeight: 650, letterSpacing: "-0.035em", color: p.ink }}>Upload files</div>
            <div style={{ fontSize: 21 * u, color: muted, marginTop: 6 * u }}>Add documents to the shared workspace</div>
          </div>
          <svg width={30 * u} height={30 * u} viewBox="0 0 24 24" style={{ display: "block", marginTop: 4 * u }}>
            <path d="M6.5 6.5l11 11 M17.5 6.5l-11 11" stroke={muted} strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ position: "absolute", left: P, top: zoneTop, width: zoneW, height: zoneH, borderRadius: 28 * u, background: alpha(p.accent, 0.03 + 0.07 * hover), transform: `scale(${1 + 0.012 * hover})` }}>
          <svg width={zoneW} height={zoneH} style={{ position: "absolute", left: 0, top: 0, display: "block" }}>
            <rect x={1 * u} y={1 * u} width={zoneW - 2 * u} height={zoneH - 2 * u} rx={27 * u} fill="none" stroke={zoneStroke} strokeWidth={2 * u} strokeDasharray={`${12 * u} ${9 * u}`} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 1 - progress(f, T.drop + 4, T.drop + 14) + progress(f, T.travel + 10, T.travel + 22),
            }}
          >
            <div style={{ width: 68 * u, height: 68 * u, borderRadius: 20 * u, background: alpha(p.accent, 0.14), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" style={{ display: "block" }}>
                <path d="M12 15.5V5 M7.5 9.5L12 5l4.5 4.5 M5 15v2.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke={p.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 25 * u, fontWeight: 500, color: p.ink, marginTop: 20 * u, letterSpacing: "-0.015em" }}>
              Drop files here or <span style={{ color: p.accent, fontWeight: 600 }}>browse</span>
            </div>
            <div style={{ fontSize: 19 * u, color: muted, marginTop: 8 * u }}>PDF, PNG or ZIP · up to 500 MB</div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: P,
            top: rowTop,
            width: zoneW,
            height: rowH,
            borderRadius: 24 * u,
            border: `${1.5 * u}px solid ${alpha(p.ink, 0.1)}`,
            boxSizing: "border-box",
            padding: `0 ${26 * u}px 0 ${100 * u}px`,
            display: "flex",
            alignItems: "center",
            gap: 24 * u,
            opacity: rowIn,
            transform: `translateY(${(1 - rowIn) * 12 * u}px)`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 25 * u, fontWeight: 600, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{p.fileName}</span>
            </div>
            <div style={{ position: "relative", height: 26 * u, marginTop: 4 * u, fontSize: 19 * u, color: muted, whiteSpace: "nowrap" }}>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: 1 - done }}>
                {(v * size).toFixed(1)} of {size} MB · {speed.toFixed(1)} MB/s · {left}s left
              </span>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: done }}>
                {size} MB · <span style={{ color: p.success, fontWeight: 500 }}>Uploaded just now</span>
              </span>
            </div>
            <div style={{ position: "relative", height: 8 * u, marginTop: 12 * u, borderRadius: 4 * u, background: alpha(p.ink, 0.1), overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 4 * u, background: `linear-gradient(90deg, ${hexMix(p.accent, "#FFFFFF", 0.2)}, ${p.accent})` }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", borderRadius: 4 * u, background: p.success, opacity: done }} />
            </div>
          </div>
          <div style={{ position: "relative", width: 86 * u, height: 48 * u }}>
            <span style={{ position: "absolute", right: 0, top: 8 * u, fontFamily: FONT_MONO, fontSize: 24 * u, fontWeight: 500, color: p.ink, opacity: 1 - done }}>{pct}%</span>
            <svg width={48 * u} height={48 * u} viewBox="0 0 24 24" style={{ position: "absolute", right: 0, top: 0, opacity: done, transform: `scale(${mix(0.4, 1, progress(f, T.done, T.done + 14, "bouncy"))})` }}>
              <circle cx={12} cy={12} r={11} fill={p.success} />
              <path d="M7 12.4l3.2 3.2L17 8.8" fill="none" stroke={p.card} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={16} strokeDashoffset={16 * (1 - tick)} />
            </svg>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: cx - iconW / 2,
            top: cy - (iconW * 1.2) / 2,
            opacity: progress(f, T.drop, T.drop + 6),
            transform: `rotate(${(1 - fall) * -10}deg) scale(${1 + 0.05 * squash}, ${1 - 0.08 * squash})`,
            transformOrigin: "50% 100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: iconW * 0.1,
              right: iconW * 0.1,
              bottom: -iconW * 0.04,
              height: iconW * 0.12,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.3)",
              filter: `blur(${mix(18, 6, fall) * u}px)`,
              opacity: mix(0.3, 0.8, fall) * (1 - travel * 0.6),
            }}
          />
          <FileIcon w={iconW} color={p.accent} ext={extOf(p.fileName)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
