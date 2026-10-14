import raw from '../content/texts.md?raw';
import { parseTexts } from './parseTexts.js';

// All player-facing wording lives in src/content/texts.md — edit that file,
// not this one.
const TEXTS = parseTexts(raw);

export const GAMES = TEXTS.games;

// A session plays RANDOM_PICK_COUNT games chosen at random from the full
// pool above, so repeat visits (and repeat plays at the exhibit) don't
// always show the same five.
export const RANDOM_PICK_COUNT = 5;

export function pickRandomGames() {
  const shuffled = [...GAMES];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, RANDOM_PICK_COUNT);
}

// mulberry32 — a tiny seedable PRNG (Math.random has no seed hook). 二人で
// 遊ぶ needs both phones to land on the exact same 5-game playlist without
// either one telling the other its choice, so both derive it from the one
// thing they already share: the room code they both joined.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export function pickRandomGamesSeeded(seed) {
  const rand = mulberry32(hashString(String(seed)));
  const shuffled = [...GAMES];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, RANDOM_PICK_COUNT);
}

const TITLE_TABLE = TEXTS.titles;

export function getTitle(total) {
  return (TITLE_TABLE.find((t) => total <= t.max) ?? TITLE_TABLE[TITLE_TABLE.length - 1]).label;
}

const MATCH_TABLE = TEXTS.matches;

export function getMatchLabel(percent) {
  return (MATCH_TABLE.find((t) => percent >= t.min) ?? MATCH_TABLE[MATCH_TABLE.length - 1]).label;
}

export const STILL_CAPTIONS = TEXTS.captions;
