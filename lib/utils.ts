export type Institute = {
  id: string;
  owner_id?: string | null;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  city: string;
  area: string;
  address?: string | null;
  pincode?: string | null;
  map_url?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  established_year?: number | null;
  classes: string[];
  exams: string[];
  subjects: string[];
  boards: string[];
  mode: string;
  fee_min?: number | null;
  fee_max?: number | null;
  fee_note?: string | null;
  facilities: string[];
  batch_size?: number | null;
  timings?: string | null;
  scholarship?: string | null;
  gender?: string | null;
  cover_image?: string | null;
  photos: string[];
  demo_videos?: DemoVideo[];
  faculty?: Faculty[];
  batches?: Batch[];
  results?: { year: string; text: string }[];
  demo_count: number;
  faculty_count: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  is_verified: boolean;
  is_featured: boolean;
  is_sample: boolean;
  rating: number;
  review_count: number;
  views?: number;
  lat?: number | null;
  lng?: number | null;
  distance?: number;
  course_types?: string[];
  created_at: string;
  updated_at?: string;
};
export type DemoVideo = { title: string; url: string; teacher?: string; subject?: string };
export type Faculty = { name: string; subject: string; qualification: string; experience: string; photo?: string };
export type Batch = { name: string; timing?: string; start?: string; fee?: number; seats?: number };

export function inr(n?: number | null) {
  if (n === null || n === undefined) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}
export function inrShort(n?: number | null) {
  if (!n && n !== 0) return "—";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 ? 1 : 0) + "L";
  if (n >= 1000) return "₹" + Math.round(n / 1000) + "k";
  return "₹" + n;
}
export function feeRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Fee on request";
  if (min && max && min !== max) return `${inrShort(min)} – ${inrShort(max)}`;
  return inrShort(min || max);
}
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
export function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 86400 * 30) return Math.floor(s / 86400) + "d ago";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
