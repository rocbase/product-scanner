import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function POST() {
  await store.clearEbayTokens();
  return NextResponse.json({ ok: true });
}