import sharp from "sharp";
import { mkdirSync } from "fs";

const sizes = [180, 192, 256, 512, 1024];
const dir = "public/icons";
mkdirSync(dir, { recursive: true });

for (const size of sizes) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${size * 0.22}" fill="#111827"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.28}" fill="#3b82f6"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.12}" fill="white"/>
    <rect x="${size * 0.38}" y="${size * 0.32}" width="${size * 0.24}" height="${size * 0.18}" rx="${size * 0.03}" fill="white" opacity="0.9"/>
  </svg>`;
  const name =
    size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  await sharp(Buffer.from(svg)).png().toFile(`${dir}/${name}`);
  console.log(`Created ${name}`);
}