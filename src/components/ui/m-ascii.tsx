"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AsciiArtProps {
  /** Source video converted to ASCII. If omitted, a procedural field is rendered. */
  videoUrl?: string;
  posterUrl?: string;
  className?: string;
  /** Character cell size in px. */
  cell?: number;
  color?: string;
}

const RAMP = " .:-=+*#%@";

export default function AsciiArt({
  videoUrl,
  posterUrl,
  className,
  cell = 11,
  color = "125, 211, 252",
}: AsciiArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;

    let cols = 0;
    let rows = 0;
    let raf = 0;
    let visible = true;
    let last = 0;
    let dpr = 1;
    let size = cell;
    const styles = Array.from({ length: RAMP.length }, (_, i) => `rgba(${color}, ${(0.12 + (i / (RAMP.length - 1)) * 0.78).toFixed(2)})`);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      size = rect.width < 640 ? cell + 4 : cell;
      cols = Math.max(1, Math.floor(rect.width / (size * 0.6)));
      rows = Math.max(1, Math.floor(rect.height / size));
      sampler.width = cols;
      sampler.height = rows;
    };

    const draw = (t: number) => {
      const useVideo = !!video && video.readyState >= 2 && !!sctx;
      let data: Uint8ClampedArray | null = null;
      if (useVideo && sctx && video) {
        sctx.drawImage(video, 0, 0, cols, rows);
        data = sctx.getImageData(0, 0, cols, rows).data;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      const cw = canvas.width / dpr / cols;
      const ch = canvas.height / dpr / rows;
      const time = t / 1000;

      let current = -1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let v: number;
          if (data) {
            const i = (y * cols + x) * 4;
            v = ((data[i] ?? 0) * 0.299 + (data[i + 1] ?? 0) * 0.587 + (data[i + 2] ?? 0) * 0.114) / 255;
          } else {
            const nx = x / cols;
            const ny = y / rows;
            v =
              0.5 +
              0.25 * Math.sin(nx * 9 + time * 0.8) +
              0.25 * Math.sin(ny * 7 - time * 0.6 + Math.sin(nx * 4 + time * 0.3) * 2);
            v = Math.max(0, Math.min(1, v));
          }
          const idx = Math.floor(v * (RAMP.length - 1));
          if (idx === 0) continue;
          if (idx !== current) {
            ctx.fillStyle = styles[idx] ?? styles[1] ?? "#7dd3fc";
            current = idx;
          }
          ctx.fillText(RAMP.charAt(idx), x * cw, y * ch);
        }
      }
    };

    const loop = (t: number) => {
      raf = 0;
      if (!visible) return;
      if (t - last > 66) {
        last = t;
        draw(t);
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || reduced.matches) return;
      raf = requestAnimationFrame(loop);
    };

    resize();
    draw(0);
    if (!reduced.matches) {
      video?.play().catch(() => undefined);
      start();
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      if (!e) return;
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [cell, color, videoReady]);

  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden bg-[#050914]", className)}
      style={
        posterUrl
          ? { backgroundImage: `url(${posterUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          crossOrigin="anonymous"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
