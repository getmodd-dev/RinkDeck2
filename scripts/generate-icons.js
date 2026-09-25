import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdr.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 21)), 21);

  // Raw image data with filter byte 0 for each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  // IEND chunk
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4);
  iendChunk.writeUInt32BE(crc32(Buffer.from('IEND')), 8);

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function renderAppIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);

  // Rounded squircle border
  const cornerR = 0.22;
  const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR));
  const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR));
  const cornerDist = Math.sqrt(dx * dx + dy * dy);
  if (cornerDist > cornerR) {
    return [0, 0, 0, 0]; // transparent outside squircle
  }

  // Dark slate backdrop
  let r = Math.floor(15 + 10 * ny);
  let g = Math.floor(23 + 20 * (1 - nx));
  let b = Math.floor(42 + 60 * ny);

  // Vinyl record circle
  if (dist < 0.40) {
    r = 15;
    g = 23;
    b = 42;

    // Vinyl grooves
    const groove = Math.sin(dist * 120);
    if (groove > 0.6) {
      r += 25; g += 30; b += 40;
    }
  }

  // Cyan vinyl center label
  if (dist < 0.16) {
    r = 2;
    g = 132;
    b = 199;
    if (dist < 0.05) {
      r = 2; g = 6; b = 23; // spindle hole
    } else if (dist < 0.08) {
      r = 56; g = 189; b = 248;
    }
  }

  // Play triangle in center
  if (dist > 0.05 && dist < 0.13) {
    const tx = nx - 0.5;
    const ty = ny - 0.5;
    if (tx > -0.04 && tx < 0.05 && Math.abs(ty) < 0.04 - (tx * 0.4)) {
      return [255, 255, 255, 255];
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, renderAppIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, renderAppIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, renderAppIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, renderAppIcon));
console.log('PWA icons created successfully');
