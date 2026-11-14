"use client";
import { Check, GitCompareArrows } from "lucide-react";
import { useCompare } from "./CompareContext";
export default function CompareButton({ id, name, area, className = "" }: { id: string; name: string; area: string; className?: string }) {
  const { has, toggle } = useCompare();
  const on = has(id);
  return (
    <button onClick={() => toggle({ id, name, area })} className={(on ? "btn border border-teal bg-teal-50 text-teal " : "btn-outline ") + className}>
      {on ? <Check size={16} /> : <GitCompareArrows size={16} />} {on ? "Added to compare" : "Add to compare"}
    </button>
  );
}
