/** Lightweight SVG charts (no library) for test reports. */

const C = { you: "#1f8a7a", topper: "#16a34a", avg: "#f59e0b", low: "#ef4444", rank: "#1d3557", grid: "#e2e8f0", text: "#64748b" };
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/** Bars = marks of each attempt, line = rank of that attempt (lower is better). */
export function AttemptsChart({ attempts, maxMarks }: { attempts: { attempt_no: number; score: number; rank: number }[]; maxMarks: number }) {
  if (!attempts.length) return null;
  const W = 640, H = 260, L = 44, R = 44, T = 20, B = 40;
  const iw = W - L - R, ih = H - T - B;
  const top = Math.max(maxMarks, ...attempts.map((a) => Number(a.score)), 1);
  const bottom = Math.min(0, ...attempts.map((a) => Number(a.score)));
  const maxRank = Math.max(...attempts.map((a) => a.rank), 1);
  const step = iw / attempts.length;
  const y = (v: number) => T + ih - ((v - bottom) / (top - bottom)) * ih;
  const yr = (r: number) => T + (maxRank === 1 ? ih / 2 : ((r - 1) / (maxRank - 1)) * ih);
  const pts = attempts.map((a, i) => [L + step * i + step / 2, yr(a.rank)] as const);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Marks and rank in each attempt">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = bottom + (top - bottom) * f;
        return <g key={f}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={C.grid} /><text x={L - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill={C.text}>{fmt(v)}</text></g>;
      })}
      {attempts.map((a, i) => {
        const x = L + step * i + step * 0.25, w = step * 0.5, s = Number(a.score);
        return (
          <g key={a.attempt_no}>
            <rect x={x} y={Math.min(y(s), y(0))} width={w} height={Math.max(2, Math.abs(y(0) - y(s)))} rx="6" fill={C.you} opacity={i === attempts.length - 1 ? 1 : 0.55} />
            <text x={x + w / 2} y={Math.min(y(s), y(0)) - 6} fontSize="12" fontWeight="700" textAnchor="middle" fill="#0f172a">{fmt(s)}</text>
            <text x={x + w / 2} y={H - 18} fontSize="11" textAnchor="middle" fill={C.text}>Attempt {a.attempt_no}</text>
          </g>
        );
      })}
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={C.rank} strokeWidth="2.5" strokeDasharray="5 4" />
      {pts.map(([x, yy], i) => (
        <g key={i}><circle cx={x} cy={yy} r="6" fill="#fff" stroke={C.rank} strokeWidth="2.5" /><text x={x + 9} y={yy - 8} fontSize="11" fontWeight="700" fill={C.rank}>#{attempts[i].rank}</text></g>
      ))}
      <text x={W - R + 6} y={T + 10} fontSize="10" fill={C.rank}>Rank</text>
      <text x={W - R + 6} y={T + 22} fontSize="10" fill={C.rank}>#1 top</text>
    </svg>
  );
}

/** Horizontal bars: topper vs average vs lowest vs you. */
export function CompareChart({ topper, average, lowest, you, maxMarks }: { topper: number; average: number; lowest: number; you: number; maxMarks: number }) {
  const rows = [["Topper", topper, C.topper], ["You", you, C.you], ["Average", average, C.avg], ["Lowest", lowest, C.low]] as const;
  const W = 640, rowH = 46, L = 80, R = 60, H = rows.length * rowH + 20;
  const lo = Math.min(0, ...rows.map((r) => Number(r[1])));
  const hi = Math.max(maxMarks, ...rows.map((r) => Number(r[1])), 1);
  const x = (v: number) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Your marks compared with topper, average and lowest">
      <line x1={x(0)} x2={x(0)} y1={6} y2={H - 10} stroke={C.grid} />
      {rows.map(([label, v, col], i) => {
        const yy = 12 + i * rowH, n = Number(v);
        return (
          <g key={label}>
            <text x={L - 10} y={yy + 20} fontSize="13" fontWeight={label === "You" ? 800 : 600} textAnchor="end" fill="#0f172a">{label}</text>
            <rect x={Math.min(x(0), x(n))} y={yy + 4} width={Math.max(3, Math.abs(x(n) - x(0)))} height="26" rx="7" fill={col} />
            <text x={Math.max(x(0), x(n)) + 8} y={yy + 22} fontSize="13" fontWeight="700" fill="#0f172a">{fmt(n)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Lines across tests: your best % vs class average % vs topper %. */
export function TestsTrendChart({ rows }: { rows: { title: string; you: number | null; average: number | null; topper: number | null; max: number }[] }) {
  const data = rows.filter((r) => r.max > 0);
  if (data.length < 1) return null;
  const W = 640, H = 240, L = 40, R = 16, T = 16, B = 46;
  const iw = W - L - R, ih = H - T - B;
  const step = data.length > 1 ? iw / (data.length - 1) : 0;
  const px = (i: number) => (data.length > 1 ? L + step * i : L + iw / 2);
  const py = (pct: number) => T + ih - (Math.max(-20, Math.min(100, pct)) / 100) * ih;
  const series = [["topper", C.topper, "Topper"], ["average", C.avg, "Average"], ["you", C.you, "You"]] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Your percentage across tests">
      {[0, 25, 50, 75, 100].map((p) => <g key={p}><line x1={L} x2={W - R} y1={py(p)} y2={py(p)} stroke={C.grid} /><text x={L - 6} y={py(p) + 4} fontSize="10" textAnchor="end" fill={C.text}>{p}%</text></g>)}
      {series.map(([k, col]) => {
        const pts = data.map((r, i) => (r[k] == null ? null : [px(i), py((Number(r[k]) / r.max) * 100)] as const)).filter(Boolean) as (readonly [number, number])[];
        return (
          <g key={k}>
            {pts.length > 1 && <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={col} strokeWidth={k === "you" ? 3 : 2} />}
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={k === "you" ? 5 : 3.5} fill={col} />)}
          </g>
        );
      })}
      {data.map((r, i) => <text key={i} x={px(i)} y={H - 26} fontSize="10" textAnchor="middle" fill={C.text}>{r.title.length > 14 ? r.title.slice(0, 13) + "…" : r.title}</text>)}
      {series.map(([, col, label], i) => <g key={label}><rect x={L + i * 90} y={H - 14} width="10" height="10" rx="2" fill={col} /><text x={L + i * 90 + 14} y={H - 5} fontSize="11" fill="#0f172a">{label}</text></g>)}
    </svg>
  );
}
