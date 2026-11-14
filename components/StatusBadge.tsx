const MAP: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  visited: "bg-purple-50 text-purple-700",
  admitted: "bg-green-50 text-green-700",
  closed: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
};
export default function StatusBadge({ s }: { s: string }) {
  return <span className={"badge capitalize " + (MAP[s] || "bg-slate-100 text-slate-600")}>{s.replace("_", " ")}</span>;
}
