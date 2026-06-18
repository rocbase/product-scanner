import { NextResponse } from "next/server";
import {
  allowDemoMode,
  hasEbay,
  hasOpenAI,
  hasSerpApi,
  hasSupabase,
} from "@/lib/env";
import * as store from "@/lib/store";

export async function GET() {
  const ebayTokens = await store.getEbayTokens();
  return NextResponse.json({
    openai: hasOpenAI(),
    ebay_search: hasEbay(),
    serpapi: hasSerpApi(),
    supabase: hasSupabase(),
    ebay_seller_connected: Boolean(ebayTokens?.access_token),
    ebay_seller_username: ebayTokens?.seller_username ?? null,
    demo_mode: allowDemoMode() && !hasOpenAI(),
    storage: hasSupabase() ? "supabase" : "local",
  });
}