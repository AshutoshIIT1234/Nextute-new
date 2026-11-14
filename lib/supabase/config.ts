// Publishable (public) keys — safe to ship to the browser. Override via env vars.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fmzujywipwbxlgmeigkp.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_zYmw0Wmvd84y8bk5s432Zg_9nF40yBx";
