export const GAMES = [
  {
    id: 'tiltFill',
    label: 'なみなみ',
    verb: 'そそげ',
    instruction: '傾けて、こぼさず満タンに',
    story: '庭の土に、水を撒く。やわらかくなるまで。',
    storyRevealed: '掘りやすいように。こぼしたら、床に残る。',
  },
  {
    id: 'tiltMaze',
    label: 'めいろ',
    verb: 'ころがせ',
    instruction: '傾けてボールをゴールへ',
    story: '廊下は少し傾いている。置いたものは、転がる。',
    storyRevealed: 'あの人の目が、廊下を転がっていった。',
  },
  {
    id: 'timingCenter',
    label: 'まと',
    verb: 'ねらえ',
    instruction: 'バーが真ん中に来た瞬間タップ',
    story: '玄関の電気を消した。帰ってくるまで。',
    storyRevealed: 'あの人が帰ってきた瞬間を、待っていた。',
  },
  {
    id: 'timingRhythm',
    label: 'はくどう',
    verb: 'きざめ',
    instruction: 'リングが重なった瞬間タップ',
    story: '床下から、一定の音がする。',
    storyRevealed: '止まったはずの、あの人の心臓の音。',
  },
  {
    id: 'shakeGauge',
    label: 'ゲージ',
    verb: 'ふれ',
    instruction: '揺する、できなければ連打',
    story: 'スコップの土を、振って落とす。',
    storyRevealed: '爪の間の土は、あとで洗えばいい。',
  },
  {
    id: 'compassAlign',
    label: 'らしんばん',
    verb: 'まわせ',
    instruction: '体ごと回して方角を合わせろ',
    story: '庭の北の隅。方角を確かめる。',
    storyRevealed: '北の隅に、あの人を埋めた。',
  },
  {
    id: 'holdStop',
    label: 'ぴたっ',
    verb: 'とめろ',
    instruction: '貯めて、ねらった位置で離す',
    story: '呼び鈴が鳴った。静かにしている。',
    storyRevealed: '息を止める。足音が遠ざかるまで。',
  },
  {
    id: 'lineTrace',
    label: 'なぞり',
    verb: 'なぞれ',
    instruction: '指でなぞってゴールへ',
    story: '床のしみを、雑巾でなぞる。',
    storyRevealed: '消えない。あの人の名前みたいに。',
  },
  {
    id: 'flickSpeed',
    label: 'はじき',
    verb: 'はじけ',
    instruction: '矢印の向きへ、すばやく',
    story: '指さした先を、見ていない。',
    storyRevealed: 'あの人が最後に指さした方を、見なかった。',
  },
  {
    id: 'handleSteer',
    label: 'ハンドル',
    verb: 'にぎれ',
    instruction: '両手でつかんでひねれ',
    story: '荷物を積んで、山へ向かう。',
    storyRevealed: 'トランクの重さは、あの人の重さ。',
  },
  {
    id: 'polyClap',
    label: 'てびょうし',
    verb: 'たたけ',
    instruction: '左右で違う拍子をキープ',
    story: 'スコップの音。ノックの音。',
    storyRevealed: '拍子がずれたら、気づかれる。',
  },
  {
    id: 'smoothLift',
    label: 'そよぎ',
    verb: 'そっと',
    instruction: '乱暴にせず、なめらかに',
    story: '大事なものを、そっと運ぶ。',
    storyRevealed: '起こさないように。もう起きないけど。',
  },
];

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

const TITLE_TABLE = [
  { max: 150, label: 'だれかに、見られている' },
  { max: 300, label: 'まだ、気づかれていない' },
  { max: 400, label: '上手に隠せました' },
  { max: 500, label: '何も、なかったことに' },
];

export function getTitle(total) {
  return (TITLE_TABLE.find((t) => total <= t.max) ?? TITLE_TABLE[TITLE_TABLE.length - 1]).label;
}

const MATCH_TABLE = [
  { min: 85, label: '同じ穴の、ふたり' },
  { min: 65, label: 'きっと、共犯者' },
  { min: 40, label: 'お互い、まだ疑っている' },
  { min: 0, label: '他人のふりをしよう' },
];

export function getMatchLabel(percent) {
  return (MATCH_TABLE.find((t) => percent >= t.min) ?? MATCH_TABLE[MATCH_TABLE.length - 1]).label;
}
