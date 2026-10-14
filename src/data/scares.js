import { SCARE_CHANCE } from './titles.js';

// Drop videos (mp4/webm) or images into src/assets/scares/ and they join the
// pool of things that can interrupt a session. With nothing there, the
// built-in glitch / blackout / staring-eye effects still run.
const modules = import.meta.glob('../assets/scares/*.{mp4,webm,gif,png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const ASSETS = Object.entries(modules).map(([path, src]) => {
  const file = path.split('/').pop();
  return { id: file.replace(/\.[^.]+$/, ''), src, isVideo: /\.(mp4|webm)$/i.test(file) };
});

export function getScareAsset(id) {
  return ASSETS.find((a) => a.id === id) ?? null;
}

const BUILT_IN = ['glitch', 'blackout', 'eye'];

// Decided once when a session starts: whether it gets a scare at all, and if
// so before which game (after game 1..4) and which kind. Picking up front
// lets the clip be fetched while the player is still playing, so it doesn't
// stutter in. Your own clips are weighted up so they appear more than the
// built-ins. Skipped entirely for people who ask their device for reduced
// motion.
export function planScare() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  if (Math.random() * 100 >= SCARE_CHANCE) return null;
  const atIndex = 1 + Math.floor(Math.random() * 4);
  const choices = [...BUILT_IN, ...ASSETS.flatMap((a) => [a, a, a])];
  const pick = choices[Math.floor(Math.random() * choices.length)];
  return typeof pick === 'string' ? { atIndex, kind: pick, asset: null } : { atIndex, kind: 'asset', asset: pick };
}

export function preloadScare(plan) {
  if (plan?.asset) fetch(plan.asset.src).catch(() => {});
}
