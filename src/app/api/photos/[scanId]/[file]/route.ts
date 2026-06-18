import { NextResponse } from "next/server";
import { readPhotoFile } from "@/lib/storage/photos";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string; file: string }> }
) {
  const { scanId, file } = await params;
  if (file.includes("..") || file.includes("/")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const buffer = readPhotoFile(scanId, file);
  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = file.split(".").pop()?.toLowerCase() ?? "jpg";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME[ext] ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}