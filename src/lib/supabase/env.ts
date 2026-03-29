/**
 * Supabase URL and anon key from the environment.
 * If unset, returns placeholders so `next build` and static prerender do not throw;
 * auth and data calls will fail until real values are set (see `.env.example`).
 */
export function requireSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && key) {
    return { url, key };
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[Pathfinder] Supabase env missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (Supabase → Project Settings → API)."
    );
  }

  return {
    url: url || "https://placeholder.supabase.co",
    key: key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder",
  };
}
