/** Browser-safe anon key. Empty Vercel env vars must not override these. */
function pick(v: string | undefined, fallback: string) {
  if (!v || v === "your_anon_key" || v.includes("YOUR_PROJECT") || v.startsWith("sb_publishable_")) return fallback;
  return v;
}

export const SUPABASE_URL = pick(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://jbwilhbxiaxbbwbibovt.supabase.co"
);

export const SUPABASE_ANON_KEY = pick(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impid2lsaGJ4aWF4YmJ3Ymlib3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNzk2OTgsImV4cCI6MjEwNDc1NTY5OH0.9dFOEdKFsn9Pd7Pgu7HqKXV9kh4D7qSUznRnb0m0wls"
);
