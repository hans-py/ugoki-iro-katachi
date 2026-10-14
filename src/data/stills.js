// Drop images (png/jpg/webp/gif/svg) or short loops (mp4/webm) into
// src/assets/stills/ and they appear automatically — the file name (minus
// extension) is the id. An optional one-line caption can be added below.
const modules = import.meta.glob('../assets/stills/*.{png,jpg,jpeg,webp,gif,svg,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const CAPTIONS = {
  '01': '',
  '02': '',
  '03': '',
};

export const STILLS = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => {
    const file = path.split('/').pop();
    const id = file.replace(/\.[^.]+$/, '');
    return { id, src, caption: CAPTIONS[id] ?? '', isVideo: /\.(mp4|webm)$/i.test(file) };
  });

const SEEN_KEY = 'ugoki-seen-stills';

function readSeen() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Pure (no writes): prefers a still this phone hasn't seen yet, so every
// replay is a chance at something new, then falls back to any once all are
// found. Recording is a separate step because React StrictMode runs state
// initializers twice — a write here would mark an unseen still as seen.
export function pickStill() {
  if (STILLS.length === 0) return null;
  const seen = readSeen();
  const unseen = STILLS.filter((s) => !seen.includes(s.id));
  const pool = unseen.length > 0 ? unseen : STILLS;
  const still = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !seen.includes(still.id);
  return { still, isNew, seenCount: seen.length + (isNew ? 1 : 0), total: STILLS.length };
}

export function recordSeen(id) {
  try {
    const seen = readSeen();
    if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  } catch {
    // storage blocked (private mode) — the still just won't count as found
  }
}
