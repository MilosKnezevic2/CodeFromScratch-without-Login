/**
 * Downloads every brand asset variant from the local /api/brand route and
 * writes it to public/brand/. Requires the dev server (or production
 * server) to be running.
 *
 * Run: node scripts/export-brand-assets.mjs
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BRAND_BASE_URL || "http://localhost:3000";
const OUT_DIR = join(__dirname, "..", "public", "brand");
const ICO_OUT = join(__dirname, "..", "app", "favicon.ico");

const ASSETS = [
  { variant: "favicon-16", filename: "favicon-16.png" },
  { variant: "favicon-32", filename: "favicon-32.png" },
  { variant: "favicon-48", filename: "favicon-48.png" },
  { variant: "favicon-192", filename: "favicon-192.png" },
  { variant: "favicon-512", filename: "favicon-512.png" },
  { variant: "apple-touch-icon", filename: "apple-touch-icon.png" },
  { variant: "og", filename: "og-default.png" },
  { variant: "wordmark-dark", filename: "wordmark-dark.png" },
  { variant: "wordmark-light", filename: "wordmark-light.png" },
];

async function fetchAndWrite({ variant, filename }) {
  const url = `${BASE}/api/brand/${variant}`;
  process.stdout.write(`  ${variant.padEnd(20)} → ${filename}… `);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`✗ HTTP ${res.status}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, filename), buf);
  console.log(`✓ ${(buf.length / 1024).toFixed(1)}kb`);
  return true;
}

/**
 * Build a multi-resolution ICO file from a list of PNG buffers.
 * Pure-Node; uses the modern PNG-embedded ICO format (Vista+).
 */
function buildIco(images) {
  const headerSize = 6 + 16 * images.length;
  const totalSize =
    headerSize + images.reduce((sum, img) => sum + img.data.length, 0);
  const buffer = Buffer.alloc(totalSize);

  // ICONDIR header — 6 bytes
  buffer.writeUInt16LE(0, 0); // Reserved
  buffer.writeUInt16LE(1, 2); // Type = 1 (icon)
  buffer.writeUInt16LE(images.length, 4); // Image count

  // ICONDIRENTRY for each image — 16 bytes each
  let entryOffset = 6;
  let imageOffset = headerSize;
  for (const img of images) {
    const size = img.size >= 256 ? 0 : img.size; // 0 represents 256
    buffer.writeUInt8(size, entryOffset); // Width
    buffer.writeUInt8(size, entryOffset + 1); // Height
    buffer.writeUInt8(0, entryOffset + 2); // ColorCount (0 for non-palette)
    buffer.writeUInt8(0, entryOffset + 3); // Reserved
    buffer.writeUInt16LE(1, entryOffset + 4); // Planes
    buffer.writeUInt16LE(32, entryOffset + 6); // BitCount (32 = RGBA)
    buffer.writeUInt32LE(img.data.length, entryOffset + 8); // BytesInRes
    buffer.writeUInt32LE(imageOffset, entryOffset + 12); // ImageOffset
    entryOffset += 16;
    imageOffset += img.data.length;
  }

  // Image data
  let dataOffset = headerSize;
  for (const img of images) {
    img.data.copy(buffer, dataOffset);
    dataOffset += img.data.length;
  }
  return buffer;
}

await mkdir(OUT_DIR, { recursive: true });
console.log(`▸ Exporting brand assets to ${OUT_DIR}`);
console.log(`▸ Source: ${BASE}/api/brand/*`);
console.log();

let ok = 0;
let fail = 0;
for (const asset of ASSETS) {
  if (await fetchAndWrite(asset)) ok++;
  else fail++;
}

// Build a multi-resolution favicon.ico embedding the 16, 32, and 48 PNGs.
// 32-bit modern browsers prefer SVG / large PNG; the ICO is for legacy
// Windows shells, IE/old Edge, and any tool that hard-requests /favicon.ico.
console.log();
process.stdout.write(`  Building ${ICO_OUT}… `);
try {
  const icoImages = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await readFile(join(OUT_DIR, `favicon-${size}.png`)),
    })),
  );
  const icoBuf = buildIco(icoImages);
  await writeFile(ICO_OUT, icoBuf);
  console.log(`✓ ${(icoBuf.length / 1024).toFixed(1)}kb (16+32+48 embedded)`);
  ok += 1;
} catch (err) {
  console.log(`✗ ${err.message}`);
  fail += 1;
}

console.log();
console.log(`▸ Done. ${ok} exported, ${fail} failed.`);
if (fail > 0) process.exit(1);
