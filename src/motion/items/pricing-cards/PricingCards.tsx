import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type PricingCardsProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string;
  onButton: string;
  accent: string;
  onAccent: string;
  badge: string;
  discount: number; // % off when billed yearly
  rise: number; // px each card rises as it enters
  ease: string;
};

export const PLANS = [
  { name: "Starter", blurb: "For side projects", price: 12, cta: "Get started", features: ["3 projects", "Basic analytics", "Community support"] },
  { name: "Pro", blurb: "For growing teams", price: 29, cta: "Start free trial", features: ["Unlimited projects", "Advanced analytics", "Priority support"] },
  { name: "Scale", blurb: "For organisations", price: 79, cta: "Contact sales", features: ["Everything in Pro", "SSO and audit log", "Dedicated manager"] },
];

// Frames on the 150-frame clip. Everything has settled by frame 92 and holds the yearly state to the end.
export const PT = {
  toggle: [0, 18] as const, // the toggle fades in
  card: 6, // first card starts rising; the others follow STAGGER frames apart
  cardLen: 22,
  badge: [26, 44] as const,
  flip: [60, 78] as const, // the knob slides to Yearly
  roll: 66, // digits start rolling (+STAGGER per card, +2 per digit)
  rollLen: 18,
  caption: 68,
};

export const yearlyPrice = (monthly: number, discount: number) => Math.max(1, Math.round(monthly * (1 - discount / 100)));

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};

// Odometer-style price: each changed digit rolls up inside its own clipped slot; a vanishing leading digit
// also collapses its width so the number stays tight.
const Roll: React.FC<{ from: number; to: number; t: (j: number) => number }> = ({ from, to, t }) => {
  const a = String(from);
  const b = String(to);
  const n = Math.max(a.length, b.length);
  const pa = a.padStart(n, " ");
  const pb = b.padStart(n, " ");
  const DIGIT = 0.62;
  return (
    <span style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums" }}>
      {pa.split("").map((ca, j) => {
        const cb = pb[j];
        const k = t(j);
        const w = mix(ca === " " ? 0 : DIGIT, cb === " " ? 0 : DIGIT, k);
        if (ca === cb) return <span key={j} style={{ display: "inline-block", width: `${DIGIT}em`, textAlign: "center" }}>{ca}</span>;
        return (
          <span key={j} style={{ display: "inline-block", width: `${w}em`, height: "1.1em", overflow: "hidden", position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 0, width: `${DIGIT}em`, transform: `translateY(${-k * 1.1}em)`, textAlign: "center" }}>
              <span style={{ display: "block", height: "1.1em", lineHeight: "1.1em", opacity: 1 - k }}>{ca === " " ? "" : ca}</span>
              <span style={{ display: "block", height: "1.1em", lineHeight: "1.1em", opacity: k }}>{cb === " " ? "" : cb}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
};

const Check: React.FC<{ size: number; u: number; fill: string; color: string }> = ({ size, u, fill, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <circle cx={12} cy={12} r={12} fill={fill} />
    <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke={color} strokeWidth={(STROKE.ring * u * 24) / size} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Two copies of a label stacked, so the active one can cross-fade from ink2 to ink.
const Toned: React.FC<{ text: string; from: string; to: string; t: number }> = ({ text, from, to, t }) => (
  <span style={{ display: "grid" }}>
    <span style={{ gridArea: "1 / 1", color: from }}>{text}</span>
    <span style={{ gridArea: "1 / 1", color: to, opacity: t }}>{text}</span>
  </span>
);

export const PricingCards: React.FC<PricingCardsProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const compact = ratio === "9:16";
  const k = ratio === "16:9" ? u : 0.74 * u;
  const unit = compact ? u : k;
  const toggleIn = progress(f, PT.toggle[0], PT.toggle[1], p.ease);
  const flip = progress(f, PT.flip[0], PT.flip[1], "travel");
  const seg = 190 * u;
  const shadow = isDark(p.background) ? "none" : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const rise = Math.max(0, Math.min(40, p.rise));

  const cards = PLANS.map((plan, i) => {
    const hot = i === 1;
    const s = i * STAGGER;
    const inT = progress(f, PT.card + s, PT.card + s + PT.cardLen, p.ease);
    const badgeIn = progress(f, PT.badge[0], PT.badge[1], "spring");
    const roll = (j: number) => progress(f, PT.roll + s + j * 2, PT.roll + s + j * 2 + PT.rollLen, "travel");
    const capT = progress(f, PT.caption + s, PT.caption + s + PT.rollLen, "travel");
    const yearly = yearlyPrice(plan.price, p.discount);
    const save = (plan.price - yearly) * 12;
    const price = (
      <div style={{ display: "flex", alignItems: "baseline", color: p.ink }}>
        <span style={{ fontSize: 44 * unit, fontWeight: 400, letterSpacing: "-0.03em", marginRight: 4 * unit, color: p.ink2 }}>$</span>
        <span style={{ fontSize: 92 * unit, fontWeight: 500, letterSpacing: "-0.045em", lineHeight: 1.1 }}>
          <Roll from={plan.price} to={yearly} t={roll} />
        </span>
        <span style={{ fontSize: 24 * unit, color: p.ink3, marginLeft: 8 * unit }}>/mo</span>
      </div>
    );
    const caption = (
      <div style={{ position: "relative", height: 30 * unit, fontSize: 20 * unit, color: p.ink3, whiteSpace: "nowrap" }}>
        <span style={{ position: "absolute", left: compact ? undefined : 0, right: compact ? 0 : undefined, top: 0, opacity: 1 - capT, transform: `translateY(${-capT * 10 * unit}px)` }}>Billed monthly</span>
        <span style={{ position: "absolute", left: compact ? undefined : 0, right: compact ? 0 : undefined, top: 0, opacity: capT, transform: `translateY(${(1 - capT) * 10 * unit}px)` }}>
          Billed yearly · save <span style={{ color: hot ? p.accent : p.ink, fontWeight: 500 }}>${save}</span>
        </span>
      </div>
    );
    const badge = hot ? (
      <div style={{ position: "absolute", left: 0, right: 0, top: -21 * unit, display: "flex", justifyContent: "center", opacity: badgeIn, transform: `scale(${mix(0.8, 1, badgeIn)})` }}>
        <span
          style={{
            height: 42 * unit,
            padding: `0 ${20 * unit}px`,
            display: "flex",
            alignItems: "center",
            borderRadius: 999,
            background: p.accent,
            color: p.onAccent,
            fontSize: 20 * unit,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          {p.badge}
        </span>
      </div>
    ) : null;
    const shell: React.CSSProperties = {
      position: "relative",
      boxSizing: "border-box",
      background: p.card,
      border: hot ? `${STROKE.ring * u}px solid ${p.accent}` : `${1 * u}px solid ${p.line}`,
      boxShadow: shadow,
      opacity: inT,
      fontFamily: FONT_SANS,
    };
    const head = (
      <>
        <div style={{ fontSize: 32 * unit, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink }}>{plan.name}</div>
        <div style={{ fontSize: 22 * unit, color: p.ink2, marginTop: 6 * unit }}>{plan.blurb}</div>
      </>
    );

    if (compact) {
      return (
        <div
          key={i}
          style={{
            ...shell,
            width: 880 * u,
            height: 200 * u,
            borderRadius: RADIUS.card * u,
            padding: `0 ${44 * u}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transform: `translateY(${(1 - inT) * rise * u}px) scale(${hot ? 1.03 : 1})`,
          }}
        >
          {badge}
          <div>{head}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {price}
            {caption}
          </div>
        </div>
      );
    }

    return (
      <div
        key={i}
        style={{
          ...shell,
          width: 400 * k,
          borderRadius: RADIUS.card * k,
          padding: 40 * k,
          transform: `translateY(${(1 - inT) * rise * k}px) scale(${hot ? 1.03 : 1})`,
        }}
      >
        {badge}
        {head}
        <div style={{ marginTop: 26 * k }}>{price}</div>
        {caption}
        <div
          style={{
            marginTop: 26 * k,
            height: 64 * k,
            borderRadius: RADIUS.button * k,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22 * k,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            background: hot ? p.button : p.fill,
            color: hot ? p.onButton : p.ink,
          }}
        >
          {plan.cta}
        </div>
        <div style={{ height: STROKE.hair * u, background: p.line, margin: `${28 * k}px 0` }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 * k }}>
          {plan.features.map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: 14 * k, fontSize: 21 * k, color: p.ink2 }}>
              <Check size={28 * k} u={u} fill={p.fill} color={hot ? p.accent : p.ink} />
              {feat}
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: (compact ? 64 : 56) * k }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            padding: 6 * u,
            borderRadius: 999,
            background: p.fill,
            border: `${1 * u}px solid ${p.line}`,
            opacity: toggleIn,
            transform: `translateY(${(1 - toggleIn) * 16 * u}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 6 * u + flip * seg,
              top: 6 * u,
              width: seg,
              height: 62 * u,
              borderRadius: 999,
              background: p.card,
              boxShadow: shadow === "none" ? `0 0 0 ${1 * u}px ${p.line}` : shadow,
            }}
          />
          {["Monthly", "Yearly"].map((label, i) => (
            <div
              key={label}
              style={{
                position: "relative",
                width: seg,
                height: 62 * u,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10 * u,
                fontSize: 24 * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              <Toned text={label} from={p.ink2} to={p.ink} t={i === 0 ? 1 - flip : flip} />
              {i === 1 && (
                <span style={{ fontSize: 17 * u, fontWeight: 500, padding: `${4 * u}px ${9 * u}px`, borderRadius: RADIUS.chip * u, background: alpha(p.accent, 0.12), color: p.accent }}>
                  −{Math.round(p.discount)}%
                </span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", alignItems: "center", gap: (compact ? 36 : 28) * k }}>{cards}</div>
      </div>
    </AbsoluteFill>
  );
};
