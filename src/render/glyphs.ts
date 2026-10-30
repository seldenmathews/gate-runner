import * as THREE from 'three';

const FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  x: ['00000', '10001', '01010', '00100', '01010', '10001', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
};

const CELL = 0.062;
const ADVANCE = 5 * CELL + CELL * 1.35;

export function buildGlyphGeometry(text: string): THREE.BufferGeometry {
  const boxes: THREE.BufferGeometry[] = [];
  const width = text.length * ADVANCE - CELL * 1.35;
  let cursor = -width / 2;
  for (const char of text) {
    const rows = FONT[char];
    if (rows) {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x += 1) {
          if (row[x] !== '1') continue;
          const box = new THREE.BoxGeometry(CELL * 0.88, CELL * 0.88, 0.05);
          box.translate(cursor + x * CELL, (rows.length - 1 - y) * CELL, 0);
          boxes.push(box);
        }
      });
    }
    cursor += ADVANCE;
  }
  if (boxes.length === 0) return new THREE.BufferGeometry();
  const opened = boxes.map((box) => box.toNonIndexed());
  let vertices = 0;
  for (const part of opened) vertices += part.getAttribute('position').count;
  const position = new Float32Array(vertices * 3);
  const normal = new Float32Array(vertices * 3);
  let offset = 0;
  for (const part of opened) {
    const pos = part.getAttribute('position');
    const nor = part.getAttribute('normal');
    position.set(pos.array as ArrayLike<number>, offset * 3);
    normal.set(nor.array as ArrayLike<number>, offset * 3);
    offset += pos.count;
    part.dispose();
  }
  for (const box of boxes) box.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.translate(0, -3 * CELL, 0);
  return geometry;
}
