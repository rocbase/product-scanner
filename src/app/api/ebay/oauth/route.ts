import { NextResponse } from "next/server";
import { getEbayAuthUrl } from "@/lib/ebay-oauth";
import { hasEbay } from "@/lib/env";

export async function GET() {
  if (!hasEbay() || !process.env.EBAY_OAUTH_REDIRECT_URI) {
    return NextResponse.json(
      {
        error: "eBay OAuth not configured",
        hint: "Set EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_OAUTH_REDIRECT_URI",
      },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(getEbayAuthUrl(state));
  response.cookies.set("ebay_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}