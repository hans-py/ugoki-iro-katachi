import { STILL_CAPTIONS, STILL_THRESHOLD } from './titles.js';

export { STILL_THRESHOLD };

// Drop images (png/jpg/webp/gif/svg) or short loops (mp4/webm) into
// src/assets/stills/ and they appear automatically — the file name (minus
// extension) is the id. The file named "final" is special: it is held back
// until a phone has found every other still, then shown once as the last
// piece of information (and joins the random pool afterwards).
const modules = import.meta.glob('../assets/stills/*.{png,jpg,jpeg,webp,gif,svg,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const FINAL_ID = 'final';

const ALL = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => {
    const file = path.split('/').pop();
    const id = file.replace(/\.[^.]+$/, '');
    return { id, src, caption: STILL_CAPTIONS[id] ?? '', isVideo: /\.(mp4|webm)$/i.test(file) };
  });

export const POOL = ALL.filter((s) => s.id !== FINAL_ID);
const FINAL = ALL.find((s) => s.id === FINAL_ID) ?? null;

const SEEN_KEY = 'ugoki-seen-stills';

function readSeen() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function poolSeenCount(seen) {
  return POOL.filter((s) => seen.includes(s.id)).length;
}

export function getProgress() {
  return { count: poolSeenCount(readSeen()), total: POOL.length };
}

// Pure (no writes): prefers a still this phone hasn't seen yet, so every
// replay is a chance at something new. Once every pooled still is found, the
// held-back "final" one comes next. Recording is a separate step because
// React StrictMode runs state initializers twice — a write here would mark
// an unseen still as seen.
export function pickStill() {
  if (ALL.length === 0) return null;
  const seen = readSeen();
  const poolSeen = poolSeenCount(seen);
  const poolDone = POOL.length > 0 && poolSeen >= POOL.length;

  let still;
  if (FINAL && poolDone && !seen.includes(FINAL.id)) {
    still = FINAL;
  } else {
    const available = FINAL && seen.includes(FINAL.id) ? [...POOL, FINAL] : POOL;
    const unseen = available.filter((s) => !seen.includes(s.id));
    const choices = unseen.length > 0 ? unseen : available;
    still = choices[Math.floor(Math.random() * choices.length)];
  }

  const isNew = !seen.includes(still.id);
  const isFinal = still.id === FINAL_ID;
  const seenCount = Math.min(POOL.length, poolSeen + (isNew && !isFinal ? 1 : 0));
  return { still, isNew, isFinal, seenCount, total: POOL.length, complete: seenCount >= POOL.length };
}

export function recordSeen(id) {
  try {
    const seen = readSeen();
    if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  } catch {
    // storage blocked (private mode) — the still just won't count as found
  }
}

// Once a phone has found about half the stills, instruction cards switch from
// the innocent chore wording to the plain truth (game.storyRevealed) — the
// foreshadowing pays off through replay.
export function isStoryRevealed() {
  const needed = Math.max(2, Math.ceil(POOL.length / 2));
  return poolSeenCount(readSeen()) >= needed;
}
