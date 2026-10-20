import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, envelope, useLayout } from "../../kit";

export type TiltCard3DProps = {
  background: string;
  card: string;
  accentA: string;
  accentB: string;
  ink: string;
  badge: string;
  title: string;
  price: string;
  tilt: number; // degrees
  depth: number; // px at 1080 between the card and the front layer
  ease: string;
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace("#", "").slice(0, 6), 16);
  const pb = parseInt(b.replace("#", "").slice(0, 6), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const isLight = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const TiltCard3D: React.FC<TiltCard3DProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, u } = useLayout();
  const env = envelope(frame, durationInFrames, durationInFrames * 0.25, durationInFrames * 0.82, p.ease);
  const theta = (frame / durationInFrames) * Math.PI * 2;
  const ry = p.tilt * Math.sin(theta) * env;
  const rx = p.tilt * 0.5 * Math.sin(theta * 2) * env;
  const dz = p.depth * u * env;
  const lift = 1 + 0.03 * env;

  const W = 560 * u;
  const H = 760 * u;
  const pad = 36 * u;
  const imgH = H * 0.56;
  const light = isLight(p.background);

  // Each layer carries the full perspective + rotation itself, with no preserve-3d parent, so the browser and the
  // canvas exporter both draw the layers flat in DOM order and the result matches.
  const layer = (left: number, top: number, z: number): React.CSSProperties => ({
    position: "absolute",
    left,
    top,
    transformOrigin: `${W / 2 - left}px ${H / 2 - top}px`,
    transform: `perspective(${1700 * u}px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${z}px) scale(${lift})`,
  });

  const sheenShift = (ry / Math.max(p.tilt, 1)) * W * 0.95;
  const sheen = (w: number, h: number, strength: number): React.CSSProperties => ({
    position: "absolute",
    left: -w * 0.5,
    top: 0,
    width: w * 2,
    height: h,
    background: `linear-gradient(105deg, rgba(255,255,255,0) 38%, rgba(255,255,255,${strength}) 50%, rgba(255,255,255,0) 62%)`,
    transform: `translateX(${sheenShift}px)`,
    opacity: 0.35 + 0.65 * env,
  });

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: W, height: H }}>
        <div
          style={{
            position: "absolute",
            left: W * 0.12,
            top: H - 40 * u,
            width: W * 0.76,
            height: 80 * u,
            borderRadius: "50%",
            background: alpha("#000000", light ? 0.22 : 0.6),
            filter: `blur(${36 * u}px)`,
            transform: `translateX(${-ry * 5 * u}px) translateY(${20 * u * env}px) scaleX(${1 - 0.08 * env})`,
          }}
        />

        <div
          style={{
            ...layer(0, 0, 0),
            width: W,
            height: H,
            borderRadius: 44 * u,
            overflow: "hidden",
            background: `linear-gradient(160deg, ${mixHex(p.card, "#FFFFFF", light ? 0.5 : 0.07)}, ${p.card} 55%, ${mixHex(p.card, "#000000", 0.08)})`,
            border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
            boxSizing: "border-box",
            boxShadow: `0 ${40 * u}px ${90 * u}px ${alpha(light ? "#3A2A1A" : "#000000", light ? 0.16 : 0.5)}`,
          }}
        >
          <div style={sheen(W, H, light ? 0.55 : 0.12)} />
        </div>

        <div
          style={{
            ...layer(pad, pad, dz * 0.55),
            width: W - pad * 2,
            height: imgH,
            borderRadius: 30 * u,
            overflow: "hidden",
            background: `linear-gradient(150deg, ${mixHex(p.accentA, "#FFFFFF", 0.25)}, ${p.accentA} 45%, ${p.accentB})`,
            boxShadow: `0 ${18 * u}px ${40 * u}px ${alpha(p.accentB, 0.28 * env)}`,
          }}
        >
          <svg width={W - pad * 2} height={imgH} viewBox="0 0 488 426" style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <radialGradient id="tc-orb" cx="0.36" cy="0.3" r="0.75">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
                <stop offset="0.35" stopColor={mixHex(p.accentA, "#FFFFFF", 0.35)} />
                <stop offset="1" stopColor={mixHex(p.accentB, "#000000", 0.25)} />
              </radialGradient>
              <radialGradient id="tc-floor" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#000000" stopOpacity={0.35} />
                <stop offset="1" stopColor="#000000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx="244" cy="336" rx="132" ry="22" fill="url(#tc-floor)" />
            <circle cx="244" cy="210" r="112" fill="url(#tc-orb)" />
            <ellipse cx="244" cy="226" rx="111" ry="26" fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2.5} />
            <ellipse cx="244" cy="226" rx="111" ry="26" fill="none" stroke="#000000" strokeOpacity={0.12} strokeWidth={2.5} strokeDasharray="2 7" transform="translate(0 6)" />
          </svg>
          <div style={sheen(W - pad * 2, imgH, 0.3)} />
        </div>

        <div style={{ ...layer(pad + 4 * u, pad + imgH + 38 * u, dz * 0.8), width: W - pad * 2 - 8 * u, color: p.ink }}>
          <div style={{ fontSize: 46 * u, fontWeight: 650, letterSpacing: "-0.035em", lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 * u }}>
            <span style={{ fontSize: 32 * u, fontWeight: 500, letterSpacing: "-0.02em", color: alpha(p.ink, 0.62) }}>{p.price}</span>
            <span style={{ display: "flex", gap: 10 * u }}>
              {[p.accentA, p.accentB, p.ink].map((c, i) => (
                <span key={i} style={{ width: 24 * u, height: 24 * u, borderRadius: "50%", background: c, boxShadow: `0 0 0 ${3 * u}px ${p.card}, 0 0 0 ${4.5 * u}px ${alpha(p.ink, i === 0 ? 0.5 : 0.1)}` }} />
              ))}
            </span>
          </div>
        </div>

        <div
          style={{
            ...layer(pad + 26 * u, pad + 26 * u, dz * 1.3),
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            height: 50 * u,
            padding: `0 ${22 * u}px`,
            borderRadius: 25 * u,
            background: p.ink,
            color: p.card,
            fontSize: 22 * u,
            fontWeight: 600,
            letterSpacing: "0.01em",
            boxShadow: `0 ${14 * u}px ${30 * u}px ${alpha("#000000", 0.18 + 0.12 * env)}`,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 10 * u, height: 10 * u, borderRadius: "50%", background: p.accentA }} />
          {p.badge}
        </div>
      </div>
    </AbsoluteFill>
  );
};
