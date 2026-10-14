// Reads src/content/texts.md. Format: "# 見出し" sections; the game section
// holds "## id" blocks of "項目: 内容" lines, the others are "key: 内容" lines.
// Anything else (explanations, blank lines, "> " comments) is ignored.
const GAME_KEYS = { 名前: 'label', 動詞: 'verb', 説明: 'instruction', 文: 'story', 真相: 'storyRevealed' };

function splitKeyValue(line) {
  const m = line.match(/^([^:：]+)[:：]\s*(.*)$/);
  return m ? [m[1].trim(), m[2].trim()] : null;
}

export function parseTexts(raw) {
  const games = [];
  const titles = [];
  const matches = [];
  const captions = {};
  let section = '';
  let game = null;

  for (const line of raw.split(/\r?\n/)) {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      section = h1[1].trim();
      game = null;
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2 && section === 'ゲームの文章') {
      game = { id: h2[1].trim(), label: '', verb: '', instruction: '', story: '', storyRevealed: '' };
      games.push(game);
      continue;
    }
    if (!line.trim() || line.startsWith('>')) continue;

    const kv = splitKeyValue(line);
    if (!kv) continue;
    const [key, value] = kv;

    if (section === 'ゲームの文章' && game && GAME_KEYS[key]) {
      game[GAME_KEYS[key]] = value;
    } else if (section === '結果の称号' && /^\d+$/.test(key) && value) {
      titles.push({ max: Number(key), label: value });
    } else if (section === '相性の称号' && /^\d+$/.test(key) && value) {
      matches.push({ min: Number(key), label: value });
    } else if (section === 'スチルの一言' && /^[\w-]+$/.test(key)) {
      captions[key] = value;
    }
  }

  titles.sort((a, b) => a.max - b.max);
  matches.sort((a, b) => b.min - a.min);
  if (games.length === 0 || titles.length === 0 || matches.length === 0) {
    throw new Error('src/content/texts.md の見出し(ゲームの文章 / 結果の称号 / 相性の称号)が見つかりません');
  }
  return { games, titles, matches, captions };
}
