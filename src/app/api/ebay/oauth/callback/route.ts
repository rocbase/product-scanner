import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeEbayCode } from "@/lib/ebay-oauth";
import * as store from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("ebay_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      new URL("/settings?ebay=error", request.url)
    );
  }

  try {
    const tokens = await exchangeEbayCode(code);
    await store.saveEbayTokens({ ...tokens, seller_username: undefined });
    const response = NextResponse.redirect(
      new URL("/settings?ebay=connected", request.url)
    );
    response.cookies.delete("ebay_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/settings?ebay=error", request.url)
    );
  }
}