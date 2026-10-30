import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function fill(data, w, h, x, y, bw, bh, color) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(w, x + bw);
  const y1 = Math.min(h, y + bh);
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      const i = (yy * w + xx) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }
  }
}

function drawIcon(size, { background, mono }) {
  const data = Buffer.alloc(size * size * 4);
  const bg = background ?? [0, 0, 0, 0];
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = bg[0];
    data[i * 4 + 1] = bg[1];
    data[i * 4 + 2] = bg[2];
    data[i * 4 + 3] = bg[3];
  }
  const ink = mono ? [255, 255, 255, 255] : [62, 224, 255, 255];
  const glitch = mono ? [255, 255, 255, 180] : [255, 74, 216, 210];
  const gold = mono ? [255, 255, 255, 255] : [255, 196, 77, 255];
  const s = size / 1024;
  const post = Math.round(54 * s);
  const left = Math.round(300 * s);
  const right = Math.round(670 * s);
  const top = Math.round(230 * s);
  const gateH = Math.round(460 * s);
  fill(data, size, size, left + Math.round(10 * s), top + Math.round(8 * s), post, gateH, glitch);
  fill(data, size, size, right + Math.round(10 * s), top + Math.round(8 * s), post, gateH, glitch);
  fill(data, size, size, left, top, post, gateH, ink);
  fill(data, size, size, right, top, post, gateH, ink);
  fill(data, size, size, left, top, right - left + post, Math.round(54 * s), ink);
  const dot = Math.round(28 * s);
  const squadY = Math.round(760 * s);
  for (let row = 0; row < 3; row += 1) {
    const cols = 5 - row;
    for (let col = 0; col < cols; col += 1) {
      const x = Math.round(size / 2 - ((cols - 1) * 46 * s) / 2 + col * 46 * s);
      fill(data, size, size, x, squadY + row * Math.round(40 * s), dot, dot, gold);
    }
  }
  return png(size, size, data);
}

const navy = [7, 11, 18, 255];
writeFileSync(join(assets, 'icon.png'), drawIcon(1024, { background: navy }));
writeFileSync(join(assets, 'splash-icon.png'), drawIcon(1024, { background: navy }));
writeFileSync(join(assets, 'android-icon-foreground.png'), drawIcon(1024, {}));
writeFileSync(join(assets, 'android-icon-monochrome.png'), drawIcon(1024, { mono: true }));
const background = Buffer.alloc(1024 * 1024 * 4);
for (let i = 0; i < 1024 * 1024; i += 1) {
  background[i * 4] = navy[0];
  background[i * 4 + 1] = navy[1];
  background[i * 4 + 2] = navy[2];
  background[i * 4 + 3] = 255;
}
writeFileSync(join(assets, 'android-icon-background.png'), png(1024, 1024, background));
writeFileSync(join(assets, 'favicon.png'), drawIcon(48, { background: navy }));
console.log('wrote icons');
