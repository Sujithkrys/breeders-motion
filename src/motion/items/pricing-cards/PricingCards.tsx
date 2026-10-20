import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type PricingCardsProps = {
  background: string;
  card: string;
  ink: string;
  accent: string;
  accent2: string;
  onAccent: string;
  badge: string;
  discount: number; // % off when billed yearly
  stagger: number; // frames between cards
  ease: string;
};

export const PLANS = [
  { name: "Starter", blurb: "For side projects", price: 12, cta: "Get started", features: ["3 projects", "Basic analytics", "Community support"] },
  { name: "Pro", blurb: "For growing teams", price: 29, cta: "Start free trial", features: ["Unlimited projects", "Advanced analytics", "Priority support"] },
  { name: "Scale", blurb: "For organisations", price: 79, cta: "Contact sales", features: ["Everything in Pro", "SSO and audit log", "Dedicated manager"] },
];

export const yearlyPrice = (monthly: number, discount: number) => Math.max(1, Math.round(monthly * (1 - discount / 100)));

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

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <circle cx={12} cy={12} r={12} fill={alpha(color, 0.16)} />
    <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PricingCards: React.FC<PricingCardsProps> = (p) => {
  const f = useCurrentFrame();
  const { u, ratio } = useLayout();
  const compact = ratio === "9:16";
  const k = ratio === "16:9" ? u : 0.78 * u;
  const toggleIn = progress(f, 0, 16, p.ease);
  const flip = progress(f, 78, 92, p.ease);
  const muted = alpha(p.ink, 0.56);
  const seg = 190 * u;

  const cards = PLANS.map((plan, i) => {
    const hot = i === 1;
    const rise = progress(f, 8 + i * p.stagger, 34 + i * p.stagger, p.ease);
    const badgeIn = progress(f, 24 + i * p.stagger, 38 + i * p.stagger, "spring");
    const roll = (j: number) => progress(f, 84 + i * 4 + j * 2, 100 + i * 4 + j * 2, p.ease);
    const capT = progress(f, 86 + i * 4, 100 + i * 4, p.ease);
    const yearly = yearlyPrice(plan.price, p.discount);
    const save = (plan.price - yearly) * 12;
    const unit = compact ? u : k;
    const price = (
      <div style={{ display: "flex", alignItems: "baseline", color: p.ink }}>
        <span style={{ fontSize: 44 * unit, fontWeight: 600, letterSpacing: "-0.03em", marginRight: 4 * unit, opacity: 0.9 }}>$</span>
        <span style={{ fontSize: 92 * unit, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1.1 }}>
          <Roll from={plan.price} to={yearly} t={roll} />
        </span>
        <span style={{ fontSize: 24 * unit, color: muted, marginLeft: 8 * unit }}>/mo</span>
      </div>
    );
    const caption = (
      <div style={{ position: "relative", height: 30 * unit, fontSize: 20 * unit, color: muted, whiteSpace: "nowrap" }}>
        <span style={{ position: "absolute", left: compact ? undefined : 0, right: compact ? 0 : undefined, top: 0, opacity: 1 - capT, transform: `translateY(${-capT * 10 * unit}px)` }}>Billed monthly</span>
        <span style={{ position: "absolute", left: compact ? undefined : 0, right: compact ? 0 : undefined, top: 0, opacity: capT, transform: `translateY(${(1 - capT) * 10 * unit}px)` }}>
          Billed yearly · save <span style={{ color: hot ? p.accent : p.ink, fontWeight: 500 }}>${save}</span>
        </span>
      </div>
    );
    const badge = hot ? (
      <div style={{ position: "absolute", left: 0, right: 0, top: -21 * unit, display: "flex", justifyContent: "center", opacity: badgeIn, transform: `scale(${mix(0.7, 1, badgeIn)})` }}>
        <span
          style={{
            height: 42 * unit,
            padding: `0 ${20 * unit}px`,
            display: "flex",
            alignItems: "center",
            borderRadius: 21 * unit,
            background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})`,
            color: p.onAccent,
            fontSize: 20 * unit,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            boxShadow: `0 ${8 * unit}px ${20 * unit}px ${alpha(p.accent, 0.35)}`,
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
      border: hot ? `${2 * u}px solid ${p.accent}` : `${1.5 * u}px solid ${alpha(p.ink, 0.09)}`,
      boxShadow: hot ? `0 ${40 * unit}px ${90 * unit}px ${alpha(p.accent, 0.26)}` : `0 ${30 * unit}px ${60 * unit}px rgba(0,0,0,0.16)`,
      opacity: rise,
      fontFamily: FONT_SANS,
    };
    const head = (
      <>
        <div style={{ fontSize: 32 * unit, fontWeight: 600, letterSpacing: "-0.03em", color: p.ink }}>{plan.name}</div>
        <div style={{ fontSize: 22 * unit, color: muted, marginTop: 6 * unit }}>{plan.blurb}</div>
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
            borderRadius: 32 * u,
            padding: `0 ${44 * u}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transform: `translateY(${(1 - rise) * 90 * u}px) scale(${hot ? 1.03 : 1})`,
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
          borderRadius: 32 * k,
          padding: 40 * k,
          transform: `translateY(${(1 - rise) * 90 * k}px) scale(${hot ? 1.04 : 1})`,
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
            borderRadius: 16 * k,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22 * k,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            boxSizing: "border-box",
            background: hot ? `linear-gradient(135deg, ${p.accent}, ${p.accent2})` : alpha(p.ink, 0.06),
            border: hot ? "none" : `${1.5 * u}px solid ${alpha(p.ink, 0.1)}`,
            color: hot ? p.onAccent : p.ink,
          }}
        >
          {plan.cta}
        </div>
        <div style={{ height: 1.5 * u, background: alpha(p.ink, 0.09), margin: `${28 * k}px 0` }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 * k }}>
          {plan.features.map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: 14 * k, fontSize: 21 * k, color: alpha(p.ink, 0.86) }}>
              <Check size={28 * k} color={hot ? p.accent : p.ink} />
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
            borderRadius: 40 * u,
            background: alpha(p.ink, 0.06),
            border: `${1.5 * u}px solid ${alpha(p.ink, 0.08)}`,
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
              borderRadius: 34 * u,
              background: p.card,
              boxShadow: `0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.16), 0 0 0 ${1.5 * u}px ${alpha(p.ink, 0.06)}`,
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
                color: p.ink,
                opacity: i === 0 ? mix(1, 0.55, flip) : mix(0.55, 1, flip),
              }}
            >
              {label}
              {i === 1 && (
                <span style={{ fontSize: 17 * u, fontWeight: 600, padding: `${4 * u}px ${9 * u}px`, borderRadius: 10 * u, background: alpha(p.accent, 0.16), color: p.accent }}>
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
