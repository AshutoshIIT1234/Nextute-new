import { initials } from "@/lib/utils";

const PALETTES = [
  ["#1d3557", "#1f8a7a"],
  ["#1f8a7a", "#6cbf3a"],
  ["#13243d", "#2b6cb0"],
  ["#1f6f8b", "#7ac143"],
  ["#264653", "#2a9d8f"],
];
export default function Cover({ src, name, className = "" }: { src?: string | null; name: string; className?: string }) {
  if (src) return <img src={src} alt={name} className={"h-full w-full object-cover " + className} loading="lazy" />;
  const p = PALETTES[name.length % PALETTES.length];
  return (
    <div className={"relative grid h-full w-full place-items-center overflow-hidden " + className} style={{ background: `linear-gradient(135deg, ${p[0]}, ${p[1]})` }}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-4 h-32 w-32 rounded-full bg-white/10" />
      <span className="text-4xl font-extrabold tracking-tight text-white/90">{initials(name)}</span>
    </div>
  );
}
