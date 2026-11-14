"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Lock } from "lucide-react";
import Cover from "./Cover";

export default function Gallery({ images, name, locked = false }: { images: string[]; name: string; locked?: boolean }) {
  const [idx, setIdx] = useState<number | null>(null);
  const imgs = images.filter(Boolean);
  if (!imgs.length) return <div className="aspect-[21/9] overflow-hidden rounded-2xl"><Cover name={name} /></div>;
  const shown = locked ? imgs.slice(0, 3) : imgs.slice(0, 5);
  return (
    <>
      <div className="grid h-[260px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[380px]">
        {shown.map((src, i) => (
          <button
            key={src + i}
            onClick={() => !locked && setIdx(i)}
            className={(i === 0 ? "col-span-4 row-span-2 md:col-span-2 " : "hidden md:block ") + (shown.length === 1 ? "md:col-span-4 " : "") + "relative overflow-hidden bg-slate-100"}
          >
            <img src={src} alt={`${name} photo ${i + 1}`} className="h-full w-full object-cover transition hover:scale-[1.02]" />
            {i === shown.length - 1 && imgs.length > shown.length && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-white">
                {locked ? <span className="flex items-center gap-1"><Lock size={14} /> +{imgs.length - shown.length} more</span> : `+${imgs.length - shown.length} photos`}
              </span>
            )}
          </button>
        ))}
      </div>
      {idx !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setIdx(null)}>
          <button className="absolute right-4 top-4 text-white" aria-label="Close"><X size={28} /></button>
          <button className="absolute left-2 text-white md:left-6" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + imgs.length) % imgs.length); }}><ChevronLeft size={36} /></button>
          <img src={imgs[idx]} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-2 text-white md:right-6" aria-label="Next" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % imgs.length); }}><ChevronRight size={36} /></button>
          <p className="absolute bottom-4 text-sm text-white/70">{idx + 1} / {imgs.length}</p>
        </div>
      )}
    </>
  );
}
