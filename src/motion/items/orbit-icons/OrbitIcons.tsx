import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type OrbitIconsProps = {
  background: string;
  colorA: string;
  colorB: string;
  colorC: string;
  ink: string;
  caption: string;
  tilt: number; // ring tilt in degrees
  radius: number; // px at 1080
  ease: string;
};

const GLYPHS: React.ReactNode[] = [
  <path key="chat" d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />,
  <g key="cal">
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </g>,
  <path key="bolt" d="M13 2.5 4.5 13.5h6.5l-1 8 8.5-11h-6.5l1-8z" />,
  <g key="photo">
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.7" />
    <path d="m21 15.5-5-5-9 9" />
  </g>,
  <g key="mail">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </g>,
  <path key="code" d="m9 7-5 5 5 5M15 7l5 5-5 5" />,
];

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace("#", "").slice(0, 6), 16);
  const pb = parseInt(b.replace("#", "").slice(0, 6), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

export const OrbitIcons: React.FC<OrbitIconsProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, u, isVertical } = useLayout();
  const n = GLYPHS.length;

  // Six eased steps of 1/6 turn per loop: a carousel that clicks round and rests, ending where it began.
  const step = durationInFrames / n;
  const idx = Math.floor(frame / step);
  const local = progress(frame - idx * step, 0, step * 0.62, p.ease);
  const spin = ((idx + local) / n) * Math.PI * 2;

  const R = p.radius * u * (isVertical ? 0.86 : 1);
  const P = 1900 * u;
  const tile = 116 * u;
  const colors = [p.colorA, p.colorB, p.colorC];
  const ringStroke = alpha(p.ink, 0.22);

  const icons = GLYPHS.map((glyph, i) => {
    const a = Math.PI / 2 + (i / n) * Math.PI * 2 + spin;
    const front = Math.sin(a); // +1 nearest the viewer
    return { glyph, i, x: Math.cos(a) * R, y: Math.sin(a) * R, front };
  }).sort((a, b) => a.front - b.front);

  // Each element carries perspective + ring tilt itself (no preserve-3d), so DOM order is the paint order everywhere.
  const onRing = (x: number, y: number, sc: number) =>
    `perspective(${P}px) rotateX(${p.tilt}deg) translate3d(${x}px, ${y}px, 0px) rotateX(${-p.tilt}deg) scale(${sc})`;

  const ring = (r: number, half: "back" | "front", dashed: boolean) => (
    <div
      key={`${r}-${half}`}
      style={{
        position: "absolute",
        left: -r,
        top: -r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        boxSizing: "border-box",
        border: `${dashed ? 1.5 * u : 2.5 * u}px ${dashed ? "dashed" : "solid"} ${dashed ? alpha(p.ink, 0.12) : ringStroke}`,
        clipPath: half === "back" ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)",
        transform: `perspective(${P}px) rotateX(${p.tilt}deg)`,
      }}
    />
  );

  const renderIcon = (ic: (typeof icons)[number]) => {
    const depth = (ic.front + 1) / 2;
    const c = colors[ic.i % colors.length];
    return (
      <div
        key={ic.i}
        style={{
          position: "absolute",
          left: -tile / 2,
          top: -tile / 2,
          width: tile,
          height: tile,
          borderRadius: 32 * u,
          background: `linear-gradient(150deg, ${mixHex(c, "#FFFFFF", 0.22)}, ${c} 60%, ${mixHex(c, "#000000", 0.12)})`,
          boxShadow: `0 ${18 * u}px ${36 * u}px ${alpha("#000000", 0.18 + 0.14 * depth)}, inset 0 ${1.5 * u}px 0 ${alpha("#FFFFFF", 0.35)}`,
          opacity: 0.4 + 0.6 * depth,
          transform: onRing(ic.x, ic.y, 0.84 + 0.2 * depth),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={54 * u} height={54 * u} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          {ic.glyph}
        </svg>
      </div>
    );
  };

  const centre = 168 * u;
  const breathe = Math.sin((frame / durationInFrames) * Math.PI * 2 * 2);

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: 0, height: 0, transform: `translateY(${-36 * u}px)` }}>
        <svg width={R * 2.6} height={R * 1.6} viewBox="0 0 260 160" style={{ position: "absolute", left: -R * 1.3, top: -R * 0.8 }}>
          <defs>
            <radialGradient id="oi-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={p.colorA} stopOpacity={0.26} />
              <stop offset="1" stopColor={p.colorA} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx="130" cy="80" rx="130" ry="80" fill="url(#oi-glow)" />
        </svg>

        {ring(R * 0.6, "back", true)}
        {ring(R, "back", false)}
        {icons.filter((ic) => ic.front < 0).map(renderIcon)}

        <div
          style={{
            position: "absolute",
            left: -centre / 2,
            top: -centre / 2,
            width: centre,
            height: centre,
            borderRadius: 48 * u,
            background: `linear-gradient(145deg, ${mixHex(p.colorA, "#FFFFFF", 0.18)}, ${p.colorA} 45%, ${p.colorB})`,
            boxShadow: `0 ${26 * u}px ${60 * u}px ${alpha(p.colorA, 0.42)}, inset 0 ${2 * u}px 0 ${alpha("#FFFFFF", 0.35)}`,
            transform: `translateY(${breathe * 6 * u}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={84 * u} height={84 * u} viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 2.5c.7 4.9 3.1 7.3 8 8-4.9.7-7.3 3.1-8 8-.7-4.9-3.1-7.3-8-8 4.9-.7 7.3-3.1 8-8z" />
            <circle cx="18.6" cy="18.6" r="1.6" opacity={0.75} />
          </svg>
        </div>

        {ring(R * 0.6, "front", true)}
        {ring(R, "front", false)}
        {icons.filter((ic) => ic.front >= 0).map(renderIcon)}
      </div>

      {p.caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: (isVertical ? 300 : 96) * u,
            textAlign: "center",
            fontSize: 34 * u,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: alpha(p.ink, 0.72),
          }}
        >
          {p.caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
