import { NextResponse } from "next/server";
import { serverError } from "@/lib/api/errors";
import * as store from "@/lib/store";
import type { UserSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await store.getUserSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<UserSettings>;
    const current = await store.getUserSettings();
    const settings = await store.saveUserSettings({ ...current, ...body });
    return NextResponse.json({ settings });
  } catch (error) {
    return serverError(error);
  }
}