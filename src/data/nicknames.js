import { hashString } from './titles.js';
import { SLOTS } from './slots.js';

const COLORS = [
  { name: 'ミドリ', hex: '#1fc8a3' },
  { name: 'モモ', hex: '#ff3d7a' },
  { name: 'キイロ', hex: '#ffc53d' },
  { name: 'アオ', hex: '#4f7cff' },
  { name: 'ダイダイ', hex: '#ff8a3d' },
  { name: 'ムラサキ', hex: '#9b5cff' },
];

const ANIMALS = ['キツネ', 'ウサギ', 'ネコ', 'クマ', 'タヌキ', 'ペンギン', 'フクロウ', 'カメ'];

// Phones and the display each call this with the same room code and slot,
// so all of them agree on who is "ミドリのキツネ" without anything being
// sent. Each slot steps to the next color and (by a step coprime with the
// animal list) a different animal, so up to four players never share either.
// The label is the player's position from the left on the display (1P, 2P…).
export function getNickname(roomId, slot) {
  const h = Math.abs(hashString(String(roomId)));
  const idx = Math.max(0, SLOTS.indexOf(slot));
  const color = COLORS[((h % COLORS.length) + idx) % COLORS.length];
  const animal = ANIMALS[((Math.floor(h / COLORS.length) % ANIMALS.length) + idx * 3) % ANIMALS.length];
  return { name: `${color.name}の${animal}`, color: color.hex, side: `${idx + 1}P` };
}
