import { hashString } from './titles.js';

const COLORS = [
  { name: 'ミドリ', hex: '#1fc8a3' },
  { name: 'モモ', hex: '#ff3d7a' },
  { name: 'キイロ', hex: '#ffc53d' },
  { name: 'アオ', hex: '#4f7cff' },
  { name: 'ダイダイ', hex: '#ff8a3d' },
  { name: 'ムラサキ', hex: '#9b5cff' },
];

const ANIMALS = ['キツネ', 'ウサギ', 'ネコ', 'クマ', 'タヌキ', 'ペンギン', 'フクロウ', 'カメ'];

// Both phones and the display each call this with the same room code and
// slot, so all three agree on who is "ミドリのキツネ" without any of them
// sending a name to the others (same trick as pickRandomGamesSeeded).
// Slot B is always offset to a different color AND animal, so the two names
// can never look alike.
export function getNickname(roomId, slot) {
  const h = Math.abs(hashString(String(roomId)));
  const colorA = h % COLORS.length;
  const animalA = Math.floor(h / COLORS.length) % ANIMALS.length;
  const colorIdx = slot === 'B' ? (colorA + 1 + (h % (COLORS.length - 1))) % COLORS.length : colorA;
  const animalIdx = slot === 'B' ? (animalA + 1 + (h % (ANIMALS.length - 1))) % ANIMALS.length : animalA;
  const color = COLORS[colorIdx];
  return {
    name: `${color.name}の${ANIMALS[animalIdx]}`,
    color: color.hex,
    side: slot === 'B' ? '右' : '左',
  };
}
