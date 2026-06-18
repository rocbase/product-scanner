import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api/errors";
import * as store from "@/lib/store";

export async function GET() {
  try {
    const scans = await store.listScans();
    return NextResponse.json({ scans });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { photos: string[] };
    if (!body.photos?.length) return badRequest("At least one photo is required");
    if (body.photos.length > 3) return badRequest("Maximum 3 photos allowed");
    const scan = await store.createScan(body.photos);
    return NextResponse.json({ scan });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return badRequest("id is required");
    await store.deleteScan(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}