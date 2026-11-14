"use client";
import { useEffect, useRef } from "react";
import { PATNA_CENTER } from "@/lib/geo";
import { feeRange, type Institute } from "@/lib/utils";

const CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

/** OpenStreetMap view of institutes (no API key needed). */
export default function MapView({ items, me }: { items: Institute[]; me?: [number, number] | null }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: any;
    let cancelled = false;
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = CSS;
      document.head.appendChild(l);
    }
    import("leaflet").then((mod) => {
      const L: any = (mod as any).default || mod;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView(me || PATNA_CENTER, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      const pts: [number, number][] = [];
      items.forEach((i) => {
        if (i.lat == null || i.lng == null) return;
        pts.push([i.lat, i.lng]);
        const m = L.circleMarker([i.lat, i.lng], {
          radius: i.is_featured ? 10 : 8, color: "#ffffff", weight: 2, fillColor: i.is_featured ? "#f59e0b" : "#1f8a7a", fillOpacity: 0.95,
        }).addTo(map);
        const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
        m.bindPopup(
          `<div style="font-family:inherit;min-width:180px"><b>${esc(i.name)}</b><br/><span style="color:#64748b">${esc(i.area)} · ${esc(i.exams.slice(0, 2).join(", "))}</span><br/><b style="color:#1d3557">${esc(feeRange(i.fee_min, i.fee_max))}</b>${i.distance != null ? ` · ${i.distance.toFixed(1)} km` : ""}<br/><a href="/institutes/${i.slug}" style="color:#1f8a7a;font-weight:600">View details →</a></div>`
        );
      });
      if (me) {
        L.circleMarker(me, { radius: 7, color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }).addTo(map).bindPopup("You are here");
        pts.push(me);
      }
      if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
    });
    return () => { cancelled = true; if (map) map.remove(); };
  }, [items, me]);
  return <div ref={el} className="h-[480px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" />;
}
