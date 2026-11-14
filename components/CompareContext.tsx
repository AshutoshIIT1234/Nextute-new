"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type CompareItem = { id: string; name: string; area: string };
type Ctx = {
  items: CompareItem[];
  toggle: (i: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  max: number;
};
const CompareCtx = createContext<Ctx | null>(null);
const KEY = "nextute-compare";
const MAX = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setItems(JSON.parse(v));
    } catch {}
  }, []);
  function save(next: CompareItem[]) {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }
  const value: Ctx = {
    items,
    max: MAX,
    has: (id) => items.some((i) => i.id === id),
    toggle: (i) => {
      if (items.some((x) => x.id === i.id)) save(items.filter((x) => x.id !== i.id));
      else if (items.length >= MAX) alertMax();
      else save([...items, i]);
    },
    remove: (id) => save(items.filter((x) => x.id !== id)),
    clear: () => save([]),
  };
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}
function alertMax() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("compare-max"));
}
export function useCompare() {
  const c = useContext(CompareCtx);
  if (!c) throw new Error("useCompare outside provider");
  return c;
}
