"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import "./EchoText.css";

type Direction = "left" | "right" | "up" | "down";
type Mode = "hover" | "ambient" | "both";

export interface EchoTextProps {
  text: string;
  echoes?: number;
  /** Follow smoothing per frame (0-1). Lower = longer trails. */
  lag?: number;
  /** Pixel distance between echo layers at full intensity. */
  offset?: number;
  direction?: Direction;
  /** Opacity falloff per echo (0-1). */
  fade?: number;
  /** Blur in px added per echo layer. */
  blur?: number;
  tint?: string;
  echoStyle?: "solid" | "outline";
  mode?: Mode;
  /** "auto" scales trail with motion; a number is a fixed 0-1 intensity. */
  trail?: "auto" | number;
  fontSize?: string;
  fontWeight?: number;
  className?: string;
  as?: "h1" | "h2" | "div" | "span";
}

const VECTORS: Record<Direction, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

export default function EchoText({
  text,
  echoes = 6,
  lag = 0.2,
  offset = 18,
  direction = "right",
  fade = 0.7,
  blur = 0,
  tint = "#7DD3FC",
  echoStyle = "solid",
  mode = "both",
  trail = "auto",
  fontSize = "clamp(2.5rem, 8vw, 6rem)",
  fontWeight = 700,
  className = "",
  as: Tag = "div",
}: EchoTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const count = Math.max(1, Math.min(16, Math.round(echoes)));
  const indices = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const [dx, dy] = VECTORS[direction];
    const scale = Math.min(1, Math.max(0.35, window.innerWidth / 900));
    const off = offset * scale;
    const useHover = mode === "hover" || mode === "both";
    const useAmbient = mode === "ambient" || mode === "both";

    // Intensity chain: index 0 is the driver, each echo follows the previous one.
    const chain = new Float32Array(count + 1);
    let target = 0;
    let lastX = 0;
    let lastY = 0;
    let hasPointer = false;
    let hovering = false;
    let raf = 0;
    let visible = true;
    let running = false;

    const paint = () => {
      for (let i = 0; i < count; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const k = chain[i + 1] ?? 0;
        const dist = off * (i + 1) * k;
        el.style.transform = `translate3d(${dx * dist}px, ${dy * dist}px, 0)`;
        el.style.opacity = String(Math.max(0, Math.pow(fade, i + 1) * 0.6 * Math.min(1, k * 1.4)));
        el.style.filter = blur > 0 ? `blur(${blur * (i + 1) * 0.5}px)` : "none";
      }
    };

    const frame = (t: number) => {
      raf = 0;
      if (!visible) {
        running = false;
        return;
      }
      let drive = 0;
      if (useAmbient) drive = 0.55 + 0.45 * Math.sin(t / 900);
      if (useHover && hovering) drive = Math.max(drive, 1);
      if (trail !== "auto") drive = trail;
      else if (!useAmbient && !hovering) drive = 0;
      target = drive;

      chain[0] = target;
      let settled = true;
      for (let i = 1; i <= count; i++) {
        const cur = chain[i] ?? 0;
        const next = cur + ((chain[i - 1] ?? 0) - cur) * lag;
        if (Math.abs(next - cur) > 0.0005) settled = false;
        chain[i] = next;
      }
      paint();

      if (!useAmbient && settled && !hovering) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced.matches) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onEnter = () => {
      hovering = true;
      start();
    };
    const onLeave = () => {
      hovering = false;
      start();
    };
    const onMove = (e: PointerEvent) => {
      if (hasPointer) {
        const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (speed > 0) hovering = true;
      }
      hasPointer = true;
      lastX = e.clientX;
      lastY = e.clientY;
      start();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) start();
      },
      { threshold: 0 }
    );
    io.observe(root);

    const applyMotionPref = () => {
      if (reduced.matches) {
        cancelAnimationFrame(raf);
        running = false;
        chain.fill(0);
        paint();
        for (const el of layerRefs.current) if (el) el.style.opacity = "0";
      } else {
        start();
      }
    };
    reduced.addEventListener("change", applyMotionPref);

    if (useHover) {
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("pointerleave", onLeave);
      root.addEventListener("pointermove", onMove);
    }
    applyMotionPref();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      reduced.removeEventListener("change", applyMotionPref);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointermove", onMove);
    };
  }, [count, lag, offset, direction, fade, blur, mode, trail]);

  const style: CSSProperties = { fontSize, fontWeight };

  return (
    <Tag
      ref={rootRef as never}
      className={`echo-text ${className}`}
      style={style}
    >
      <span className="echo-text__main">{text}</span>
      {indices.map((i) => (
        <span
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          aria-hidden="true"
          className={`echo-text__layer${echoStyle === "outline" ? " echo-text__layer--outline" : ""}`}
          style={{ color: tint, opacity: 0, zIndex: 1 }}
        >
          {text}
        </span>
      ))}
    </Tag>
  );
}
