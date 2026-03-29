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

/**
 * Returns the canonical site URL for OAuth redirects.
 * Priority: NEXT_PUBLIC_SITE_URL env var → VERCEL_URL (auto-set by Vercel) → window.location.origin.
 *
 * Set NEXT_PUBLIC_SITE_URL in Vercel's env vars to your production domain
 * (e.g. "https://pathfinder-samatva.vercel.app") to ensure OAuth always
 * redirects to the correct origin.
 */
export function getSiteUrl(): string {
  // 1. Explicit site URL (set in Vercel dashboard → Environment Variables)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  // 2. Vercel auto-injects VERCEL_URL (without protocol) for preview deploys
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 3. Client-side fallback
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 4. Server-side fallback for local dev
  return "http://localhost:3000";
}

