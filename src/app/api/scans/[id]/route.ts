import { NextResponse } from "next/server";
import { notFound, serverError } from "@/lib/api/errors";
import * as store from "@/lib/store";
import type { ProductIdentification, ScanStatus } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scan = await store.getScan(id);
    if (!scan) return notFound("Scan not found");
    return NextResponse.json({ scan });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      user_edits?: Partial<ProductIdentification>;
      cost_cents?: number | null;
      notes?: string | null;
      bookmarked?: boolean;
      status?: ScanStatus;
    };
    const scan = await store.updateScan(id, body);
    if (!scan) return notFound("Scan not found");
    return NextResponse.json({ scan });
  } catch (error) {
    return serverError(error);
  }
}