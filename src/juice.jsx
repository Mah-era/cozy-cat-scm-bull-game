import React, { useEffect, useRef, useState } from "react";

const CONFETTI_COLORS = ["#f7c9d6", "#b49be7", "#f2c879", "#9edbcc", "#df8cab", "#79b7b7"];

export function ConfettiBurst({ trigger, pieces = 60, big = false }) {
  const [batch, setBatch] = useState(null);

  useEffect(() => {
    if (!trigger) return;
    const items = Array.from({ length: big ? pieces * 2 : pieces }, (_, i) => ({
      id: `${trigger}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 8,
      spin: Math.random() > 0.5 ? 1 : -1,
      shape: i % 3
    }));
    setBatch(items);
    const timer = setTimeout(() => setBatch(null), 4200);
    return () => clearTimeout(timer);
  }, [trigger, pieces, big]);

  if (!batch) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {batch.map((p) => (
        <i
          key={p.id}
          className={`confetti-piece shape-${p.shape}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.shape === 1 ? 0.45 : 1),
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--spin": p.spin
          }}
        />
      ))}
    </div>
  );
}

export function CountUp({ value, format, duration = 700 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef();

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to || !Number.isFinite(from) || !Number.isFinite(to)) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display)}</>;
}

export function FloatingPetals({ count = 9 }) {
  const petals = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: (i * 97) % 100,
    delay: (i * 1.7) % 9,
    duration: 9 + (i % 5) * 2.4,
    size: 8 + (i % 4) * 3
  }));
  return (
    <div className="petal-layer" aria-hidden="true">
      {petals.map((p) => (
        <i
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div key={toast.id} className={`toast-pop ${toast.tone ?? "info"}`} role="status">
      <span>{toast.icon ?? "✦"}</span>
      <p>{toast.text}</p>
    </div>
  );
}
