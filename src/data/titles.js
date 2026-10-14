export const GAMES = [
  {
    id: 'tiltFill',
    label: 'なみなみ',
    verb: 'そそげ',
    instruction: '傾けて、こぼさず満タンに',
    story: 'バケツに水をなみなみと。庭の土は、よく湿らせないと掘れないから。',
  },
  {
    id: 'tiltMaze',
    label: 'めいろ',
    verb: 'ころがせ',
    instruction: '傾けてボールをゴールへ',
    story: '廊下の床は少し傾いている。あの人を運ぶとき、いつもこっちに転がってきた。',
  },
  {
    id: 'timingCenter',
    label: 'まと',
    verb: 'ねらえ',
    instruction: 'バーが真ん中に来た瞬間タップ',
    story: 'あの人が帰ってくる、ちょうどその瞬間。玄関の電気を消しておいた。',
  },
  {
    id: 'timingRhythm',
    label: 'はくどう',
    verb: 'きざめ',
    instruction: 'リングが重なった瞬間タップ',
    story: '床下から、一定の音がする。わたしの心臓の音だと思うことにした。',
  },
  {
    id: 'shakeGauge',
    label: 'ゲージ',
    verb: 'ふれ',
    instruction: '揺する、できなければ連打',
    story: 'スコップの土を、よく振って落とす。爪の間は、あとで洗えばいい。',
  },
  {
    id: 'compassAlign',
    label: 'らしんばん',
    verb: 'まわせ',
    instruction: '体ごと回して方角を合わせろ',
    story: 'あの人を埋めたのは、庭の北の隅。方角は、間違えていないはず。',
  },
  {
    id: 'holdStop',
    label: 'ぴたっ',
    verb: 'とめろ',
    instruction: '貯めて、ねらった位置で離す',
    story: '呼び鈴が鳴った。息を止めて、遠ざかる足音を数える。',
  },
  {
    id: 'lineTrace',
    label: 'なぞり',
    verb: 'なぞれ',
    instruction: '指でなぞってゴールへ',
    story: '床のしみを雑巾でなぞる。消えた。でも、あの人の名前だけが消えない。',
  },
  {
    id: 'flickSpeed',
    label: 'はじき',
    verb: 'はじけ',
    instruction: '矢印の向きへ、すばやく',
    story: 'あの人が最後に指さした方を、わたしは見なかった。見たら、きっと動けなくなる。',
  },
  {
    id: 'handleSteer',
    label: 'ハンドル',
    verb: 'にぎれ',
    instruction: '両手でつかんでひねれ',
    story: 'トランクの重さが、ハンドルに伝わってくる。山まで、あと一時間。',
  },
  {
    id: 'polyClap',
    label: 'てびょうし',
    verb: 'たたけ',
    instruction: '左右で違う拍子をキープ',
    story: 'スコップの音と、玄関のノックの音。拍子がずれたら、気づかれる。',
  },
  {
    id: 'smoothLift',
    label: 'そよぎ',
    verb: 'そっと',
    instruction: '乱暴にせず、なめらかに',
    story: 'そっと持ち上げる。起こしてしまわないように。もう起きないのは、知っているけど。',
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
  { max: 150, label: '動きのたまご' },
  { max: 300, label: '動きのみならい' },
  { max: 400, label: '動きのつかい手' },
  { max: 500, label: '動きのマスター' },
];

export function getTitle(total) {
  return (TITLE_TABLE.find((t) => total <= t.max) ?? TITLE_TABLE[TITLE_TABLE.length - 1]).label;
}

const MATCH_TABLE = [
  { min: 85, label: '運命のふたり' },
  { min: 65, label: 'いい相性' },
  { min: 40, label: 'ぼちぼち相性' },
  { min: 0, label: 'まだまだこれから' },
];

export function getMatchLabel(percent) {
  return (MATCH_TABLE.find((t) => percent >= t.min) ?? MATCH_TABLE[MATCH_TABLE.length - 1]).label;
}
