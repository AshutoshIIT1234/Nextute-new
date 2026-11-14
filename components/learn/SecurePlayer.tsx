"use client";
import { useEffect, useState } from "react";

/**
 * Plays an unlisted YouTube video/stream inside Nextute only.
 * - youtube-nocookie embed with related videos, annotations and keyboard shortcuts off
 * - transparent shields over the title bar and YouTube logo so students can't click through to YouTube
 * - right-click disabled, moving watermark with the student's name/phone to discourage screen recording
 */
export default function SecurePlayer({ videoId, watermark, live = false }: { videoId: string; watermark: string; live?: boolean }) {
  const [pos, setPos] = useState({ x: 10, y: 15 });
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    const t = setInterval(() => setPos({ x: 5 + Math.random() * 60, y: 10 + Math.random() * 70 }), 7000);
    return () => clearInterval(t);
  }, []);
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=1&autoplay=${live ? 1 : 0}&origin=${encodeURIComponent(origin)}`;
  return (
    <div className="relative aspect-video w-full select-none overflow-hidden rounded-2xl bg-black" onContextMenu={(e) => e.preventDefault()}>
      {origin && <iframe
        src={src}
        title="Class video"
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />}
      {/* block the title / channel link and "Watch on YouTube" at the top */}
      <div className="absolute inset-x-0 top-0 h-[16%]" onContextMenu={(e) => e.preventDefault()} />
      {/* block the YouTube logo bottom-right (leaves settings + fullscreen usable) */}
      <div className="absolute bottom-0 right-[48px] h-[12%] w-[90px]" />
      <div
        className="pointer-events-none absolute whitespace-nowrap rounded bg-black/20 px-2 py-0.5 text-[11px] font-semibold text-white/40 transition-all duration-1000"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        {watermark}
      </div>
      {live && <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE</span>}
    </div>
  );
}
