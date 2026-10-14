import { HINTS } from './titles.js';

// In-game hint wording lives in src/content/texts.md ("ゲーム中のヒント").
export function getHint(gameId, state) {
  return HINTS[gameId]?.[state] ?? '';
}
