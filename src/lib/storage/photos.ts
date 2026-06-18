import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getAppUrl } from "@/lib/env";

const PHOTOS_DIR = join(process.cwd(), ".data", "photos");

export function getPhotosDir(scanId: string): string {
  return join(PHOTOS_DIR, scanId);
}

export function saveScanPhotos(
  scanId: string,
  dataUrls: string[]
): string[] {
  const dir = getPhotosDir(scanId);
  mkdirSync(dir, { recursive: true });

  return dataUrls.slice(0, 3).map((dataUrl, index) => {
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid image data URL");
    }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const filename = `${index}.${ext}`;
    const buffer = Buffer.from(match[2], "base64");
    writeFileSync(join(dir, filename), buffer);
    return photoUrl(scanId, filename);
  });
}

export function photoUrl(scanId: string, filename: string): string {
  return `/api/photos/${scanId}/${filename}`;
}

export function readPhotoFile(scanId: string, filename: string): Buffer | null {
  const path = join(getPhotosDir(scanId), filename);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = getAppUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizePhotoUrls(urls: string[]): string[] {
  return urls.map((url) => {
    if (url.startsWith("http")) return url;
    if (url.startsWith("/api/photos/")) return toAbsoluteUrl(url);
    return url;
  });
}

export function photosForAI(urls: string[]): string[] {
  return urls.map((url) => {
    if (url.startsWith("data:")) return url;
    const match = url.match(/^\/api\/photos\/([^/]+)\/([^/]+)$/);
    if (match) {
      const buffer = readPhotoFile(match[1], match[2]);
      if (buffer) {
        const ext = match[2].split(".").pop()?.toLowerCase() ?? "jpeg";
        const mime = ext === "jpg" ? "jpeg" : ext;
        return `data:image/${mime};base64,${buffer.toString("base64")}`;
      }
    }
    if (url.startsWith("/api/photos/")) return toAbsoluteUrl(url);
    return url;
  });
}