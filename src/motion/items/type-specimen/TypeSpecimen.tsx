import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_MONO, FONT_SANS, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import { FILM, Logo, useShot } from "../../film";

export type TypeSpecimenProps = {
  field: string;
  ink: string;
  brand: string;
  word1: string;
  word2: string;
  word3: string;
  logo: string;
  density: number; // dots per row of the sphere grid
};

// Four hard-cut shots of 60 frames: sphere, construction, outline → solid, measured wordmark.
export const SHOTS = [0, 60, 120, 180] as const;

// Inter metrics (em fractions): cap height 1490/2048, x-height 1118/2048.
export const CAP = 0.727;
export const X_HEIGHT = 0.55;

// Timing inside each shot, in local frames.
export const T = {
  sphereIn: [0, 18] as const,
  wordsFrom: 12,
  wordStagger: 4,
  wordDur: 18,
  cross: [0, 18] as const,
  outer: [4, 34] as const,
  inner: [10, 38] as const,
  nodesFrom: 30,
  nodeDur: 12,
  glyph: [16, 52] as const,
  base: [0, 18] as const,
  wipe: [10, 30] as const,
  lockup: [0, 20] as const,
  box: [16, 38] as const,
  ticks: [32, 42] as const,
  label: [36, 48] as const,
};

// Light azimuth sweep across shot 1 (radians, linear) and its fixed elevation.
export const LIGHT = { from: -0.75, to: 0.75, elevation: 0.5 };

// Sizes in px at 1080 on the short side, per orientation.
export const SPEC = (vertical: boolean) => ({
  sphere: vertical ? 760 : 520,
  word: vertical ? 28 : 22,
  glyph: vertical ? 600 : 520,
  pair: vertical ? 560 : 520,
  outer: vertical ? 400 : 330,
  inner: vertical ? 206 : 170,
  logo: vertical ? 120 : 110,
  initial: 620,
});

export const initialOf = (brand: string) => (brand.trim().charAt(0) || "L").toUpperCase();

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ---- Tiny mono captions: shot name top-right, shot counter bottom-left.
const Captions: React.FC<{ u: number; ink: string; name: string; index: number }> = ({ u, ink, name, index }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    fontFamily: FONT_MONO,
    fontSize: 18 * u,
    lineHeight: 1,
    color: alpha(ink, 0.45),
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ ...style, top: 56 * u, right: 56 * u }}>{name}</div>
      <div style={{ ...style, bottom: 56 * u, left: 56 * u }}>{`0${index + 1} / 04`}</div>
    </>
  );
};

// ---- Shot 1: a halftone dot sphere. Square grid clipped to a circle; each dot's radius follows Lambert shading
// (lit = small dots, shadow = large), and the light's azimuth sweeps linearly so the sphere appears to turn.
const DotSphere: React.FC<{ cx: number; cy: number; d: number; n: number; ink: string; light: number; appear: number }> = ({
  cx,
  cy,
  d,
  n,
  ink,
  light,
  appear,
}) => {
  const cells = Math.round(Math.max(18, Math.min(28, n)));
  const R = d / 2;
  const s = d / cells;
  const dots = React.useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let j = 0; j < cells; j++)
      for (let i = 0; i < cells; i++) {
        const x = (i + 0.5) * s - R;
        const y = (j + 0.5) * s - R;
        if (x * x + y * y <= R * R) out.push({ x, y });
      }
    return out;
  }, [cells, s, R]);
  const az = mix(LIGHT.from, LIGHT.to, light);
  const el = LIGHT.elevation;
  const lx = Math.cos(el) * Math.sin(az);
  const ly = -Math.sin(el);
  const lz = Math.cos(el) * Math.cos(az);
  const sc = mix(0.96, 1, appear);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${sc})`} opacity={appear}>
      {dots.map((p, i) => {
        const nx = p.x / R;
        const ny = p.y / R;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const lit = Math.max(0, nx * lx + ny * ly + nz * lz);
        const r = (s / 2) * (0.12 + 0.68 * (1 - lit));
        return <circle key={i} cx={p.x} cy={p.y} r={r} fill={ink} />;
      })}
    </g>
  );
};

const WordList: React.FC<{ u: number; x: number; y: number; size: number; ink: string; words: string[]; frame: number }> = ({
  u,
  x,
  y,
  size,
  ink,
  words,
  frame,
}) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translateY(-50%)" }}>
    {words.map((w, i) => {
      const t = progress(frame, T.wordsFrom + i * T.wordStagger, T.wordsFrom + i * T.wordStagger + T.wordDur, "enter");
      return (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: size * 0.7,
            height: size * 1.9,
            opacity: t,
            transform: `translateY(${(1 - t) * 12 * u}px)`,
          }}
        >
          <div style={{ width: 7 * u, height: 7 * u, borderRadius: 7 * u, background: ink }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: size, lineHeight: 1, color: ink, whiteSpace: "nowrap" }}>{w}</div>
        </div>
      );
    })}
  </div>
);

// ---- A glyph of the initial in SVG. Outline mode draws on via strokeDashoffset (`draw` 0–1).
const Glyph: React.FC<{ ch: string; x: number; baseline: number; fs: number; color: string; solid?: boolean; draw?: number; u: number }> = ({
  ch,
  x,
  baseline,
  fs,
  color,
  solid = false,
  draw = 1,
  u,
}) => {
  const dash = fs * 3; // longer than one glyph contour at this size
  const drawing = !solid && draw < 1;
  return (
    <text
      x={x}
      y={baseline}
      textAnchor="middle"
      fontFamily={FONT_SANS}
      fontWeight={600}
      fontSize={fs}
      fill={solid ? color : "none"}
      stroke={solid ? "none" : color}
      strokeWidth={solid ? 0 : 2 * u}
      strokeLinejoin="round"
      strokeDasharray={drawing ? `${dash} ${dash}` : undefined}
      strokeDashoffset={drawing ? dash * (1 - draw) : undefined}
    >
      {ch}
    </text>
  );
};

// A solid glyph revealed left-to-right by a clip-path wipe (`t` 0–1), sitting over its outline.
const WipedGlyph: React.FC<{ ch: string; x: number; baseline: number; fs: number; color: string; t: number; u: number; W: number; H: number }> = ({
  ch,
  x,
  baseline,
  fs,
  color,
  t,
  u,
  W,
  H,
}) => {
  const x0 = x - fs * 0.55;
  const x1 = x + fs * 0.55;
  const edge = mix(x0, x1, t);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Glyph ch={ch} x={x} baseline={baseline} fs={fs} color={color} u={u} />
      </svg>
      {t > 0 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px ${Math.max(0, W - edge)}px 0px ${Math.max(0, x0)}px)` }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Glyph ch={ch} x={x} baseline={baseline} fs={fs} color={color} solid u={u} />
          </svg>
        </div>
      ) : null}
    </>
  );
};

const MonoLabel: React.FC<{ u: number; x: number; y: number; color: string; text: string; align?: "left" | "center"; opacity?: number }> = ({
  u,
  x,
  y,
  color,
  text,
  align = "center",
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: align === "center" ? "translateX(-50%)" : undefined,
      fontFamily: FONT_MONO,
      fontSize: 16 * u,
      lineHeight: 1,
      color,
      opacity,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

// ---- Shot 4: the measurement box sizes itself to its content, so any logo aspect ratio is framed exactly.
// `t` draws the perimeter (top → right → bottom → left), then ticks and the label fade in.
const MeasureBox: React.FC<{ u: number; t: number; ticks: number; labelT: number; label: string; children: React.ReactNode }> = ({
  u,
  t,
  ticks,
  labelT,
  label,
  children,
}) => {
  const hair = STROKE.hair * u;
  const seg = (k: number) => clamp01(t * 4 - k);
  const line: React.CSSProperties = { position: "absolute", background: FILM.select };
  return (
    <div style={{ position: "relative", padding: `${24 * u}px ${36 * u}px` }}>
      {children}
      {t > 0 ? (
        <>
          <div style={{ ...line, left: 0, top: 0, height: hair, width: `${seg(0) * 100}%` }} />
          <div style={{ ...line, right: 0, top: 0, width: hair, height: `${seg(1) * 100}%` }} />
          <div style={{ ...line, right: 0, bottom: 0, height: hair, width: `${seg(2) * 100}%` }} />
          <div style={{ ...line, left: 0, bottom: 0, width: hair, height: `${seg(3) * 100}%` }} />
        </>
      ) : null}
      {Array.from({ length: 9 }, (_, k) => (
        <div
          key={k}
          style={{
            ...line,
            left: `${(k / 8) * 100}%`,
            top: "100%",
            width: hair,
            height: (k % 4 === 0 ? 14 : 8) * u,
            transform: "translateX(-50%)",
            opacity: ticks,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "100%",
          marginTop: 30 * u,
          transform: `translateX(-50%) translateY(${(1 - labelT) * 6 * u}px)`,
          fontFamily: FONT_MONO,
          fontSize: 16 * u,
          lineHeight: 1,
          color: FILM.select,
          opacity: labelT,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const TypeSpecimen: React.FC<TypeSpecimenProps> = ({ field, ink, brand, word1, word2, word3, logo, density }) => {
  const { width: W, height: H, u, isVertical: v } = useLayout();
  const { index, local } = useShot(SHOTS);
  const S = SPEC(v);
  const ch = initialOf(brand);
  const hairColor = alpha(ink, 0.25);
  const ringColor = alpha(ink, 0.3);
  const names = [`${brand} Identity`, "Construction", `${brand} Sans · Bold`, "Wordmark"];

  let body: React.ReactNode = null;

  if (index === 0) {
    const d = S.sphere * u;
    const cx = v ? W / 2 : W / 2 - 330 * u;
    const cy = v ? H * 0.4 : H / 2;
    const appear = progress(local, T.sphereIn[0], T.sphereIn[1], "enter");
    const light = progress(local, 0, SHOTS[1] - SHOTS[0], "linear");
    body = (
      <>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <DotSphere cx={cx} cy={cy} d={d} n={density} ink={ink} light={light} appear={appear} />
        </svg>
        <WordList
          u={u}
          x={v ? W / 2 - d / 2 : W / 2 + 150 * u}
          y={v ? cy + d / 2 + 190 * u : H / 2}
          size={S.word * u}
          ink={ink}
          words={[word1, word2, word3]}
          frame={local}
        />
      </>
    );
  } else if (index === 1) {
    const cx = W / 2;
    const cy = H / 2;
    const ro = S.outer * u;
    const ri = S.inner * u;
    const fs = S.glyph * u;
    const cross = progress(local, T.cross[0], T.cross[1], "travel");
    const to = progress(local, T.outer[0], T.outer[1], "travel");
    const ti = progress(local, T.inner[0], T.inner[1], "travel");
    const tg = progress(local, T.glyph[0], T.glyph[1], "travel");
    const co = 2 * Math.PI * ro;
    const ci = 2 * Math.PI * ri;
    const nodes: [number, number][] = [
      [cx, cy - ro],
      [cx + ro, cy],
      [cx, cy + ro],
      [cx - ro, cy],
    ];
    const hair = STROKE.hair * u;
    body = (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line x1={cx - cross * cx} y1={cy} x2={cx + cross * (W - cx)} y2={cy} stroke={hairColor} strokeWidth={hair} />
        <line x1={cx} y1={cy - cross * cy} x2={cx} y2={cy + cross * (H - cy)} stroke={hairColor} strokeWidth={hair} />
        <circle
          cx={cx}
          cy={cy}
          r={ro}
          fill="none"
          stroke={ringColor}
          strokeWidth={hair}
          strokeDasharray={`${co} ${co}`}
          strokeDashoffset={co * (1 - to)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={ri}
          fill="none"
          stroke={ringColor}
          strokeWidth={hair}
          strokeDasharray={`${ci} ${ci}`}
          strokeDashoffset={ci * (1 - ti)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <Glyph ch={ch} x={cx} baseline={cy + (CAP * fs) / 2} fs={fs} color={ink} draw={tg} u={u} />
        {nodes.map(([nx, ny], i) => {
          const t = progress(local, T.nodesFrom + i * 3, T.nodesFrom + i * 3 + T.nodeDur, "enter");
          if (t <= 0) return null;
          return (
            <circle
              key={i}
              cx={nx}
              cy={ny}
              r={10 * u * mix(0.6, 1, t)}
              fill={field}
              stroke={alpha(ink, 0.55)}
              strokeWidth={hair}
              opacity={t}
            />
          );
        })}
      </svg>
    );
  } else if (index === 2) {
    const fs = S.pair * u;
    const tb = progress(local, T.base[0], T.base[1], "travel");
    const tw = progress(local, T.wipe[0], T.wipe[1], "travel");
    const tl = progress(local, T.base[0] + 4, T.base[1] + 4, "enter");
    const hair = STROKE.hair * u;
    const labelColor = alpha(ink, 0.45);
    if (!v) {
      const xa = W / 2 - 330 * u;
      const xb = W / 2 + 330 * u;
      const baseline = H / 2 + (CAP * fs) / 2;
      const left = W / 2 - 700 * u;
      const span = 1400 * u;
      body = (
        <>
          <div style={{ position: "absolute", left, top: baseline - hair / 2, width: span * tb, height: hair, background: hairColor }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Glyph ch={ch} x={xa} baseline={baseline} fs={fs} color={ink} u={u} />
          </svg>
          <WipedGlyph ch={ch} x={xb} baseline={baseline} fs={fs} color={ink} t={tw} u={u} W={W} H={H} />
          <MonoLabel u={u} x={xa} y={baseline + 40 * u} color={labelColor} text="Outline · 2 px" opacity={tl} />
          <MonoLabel u={u} x={xb} y={baseline + 40 * u} color={labelColor} text="Solid · 600" opacity={tl} />
        </>
      );
    } else {
      const x = W / 2;
      const ba = H * 0.32 + (CAP * fs) / 2;
      const bb = H * 0.66 + (CAP * fs) / 2;
      const left = 120 * u;
      const span = W - 240 * u;
      body = (
        <>
          <div style={{ position: "absolute", left, top: ba - hair / 2, width: span * tb, height: hair, background: hairColor }} />
          <div style={{ position: "absolute", left, top: bb - hair / 2, width: span * tb, height: hair, background: hairColor }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Glyph ch={ch} x={x} baseline={ba} fs={fs} color={ink} u={u} />
          </svg>
          <WipedGlyph ch={ch} x={x} baseline={bb} fs={fs} color={ink} t={tw} u={u} W={W} H={H} />
          <MonoLabel u={u} x={left} y={ba + 32 * u} color={labelColor} text="Outline · 2 px" align="left" opacity={tl} />
          <MonoLabel u={u} x={left} y={bb + 32 * u} color={labelColor} text="Solid · 600" align="left" opacity={tl} />
        </>
      );
    }
  } else {
    const tLock = progress(local, T.lockup[0], T.lockup[1], "enter");
    const tBox = progress(local, T.box[0], T.box[1], "travel");
    const tTicks = progress(local, T.ticks[0], T.ticks[1], "enter");
    const tLabel = progress(local, T.label[0], T.label[1], "enter");
    const lockup = (
      <MeasureBox u={u} t={tBox} ticks={tTicks} labelT={tLabel} label={`x-height ${X_HEIGHT.toFixed(2)}`}>
        <div style={{ opacity: tLock, transform: `scale(${mix(0.98, 1, tLock)})` }}>
          <Logo src={logo} name={brand} size={S.logo * u} color={ink} tile={ink} onTile={field} />
        </div>
      </MeasureBox>
    );
    if (!v) {
      body = <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>{lockup}</AbsoluteFill>;
    } else {
      const fs = S.initial * u;
      body = (
        <>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Glyph ch={ch} x={W / 2} baseline={H * 0.36 + (CAP * fs) / 2} fs={fs} color={ink} solid u={u} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.64, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
            {lockup}
          </div>
        </>
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: field, overflow: "hidden" }}>
      {body}
      <Captions u={u} ink={ink} name={names[index]} index={index} />
    </AbsoluteFill>
  );
};
