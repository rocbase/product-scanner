export function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasEbay() {
  return Boolean(
    process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET
  );
}

export function hasSerpApi() {
  return Boolean(process.env.SERPAPI_KEY);
}

export function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function allowDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}