export const GAMES = [
  {
    id: 'tiltFill',
    label: 'なみなみ',
    verb: 'そそげ',
    instruction: '傾けて、こぼさず満タンに',
  },
  {
    id: 'tiltMaze',
    label: 'めいろ',
    verb: 'ころがせ',
    instruction: '傾けてボールをゴールへ',
  },
  {
    id: 'timingCenter',
    label: 'まと',
    verb: 'ねらえ',
    instruction: 'バーが真ん中に来た瞬間タップ',
  },
  {
    id: 'timingRhythm',
    label: 'はくどう',
    verb: 'きざめ',
    instruction: 'リングが重なった瞬間タップ',
  },
  {
    id: 'shakeGauge',
    label: 'ゲージ',
    verb: 'ふれ',
    instruction: '揺する、できなければ連打',
  },
  {
    id: 'compassAlign',
    label: 'らしんばん',
    verb: 'まわせ',
    instruction: '体ごと回して方角を合わせろ',
  },
  {
    id: 'holdStop',
    label: 'ぴたっ',
    verb: 'とめろ',
    instruction: '貯めて、ねらった位置で離す',
  },
  {
    id: 'lineTrace',
    label: 'なぞり',
    verb: 'なぞれ',
    instruction: '指でなぞってゴールへ',
  },
  {
    id: 'flickSpeed',
    label: 'はじき',
    verb: 'はじけ',
    instruction: '矢印の向きへ、すばやく',
  },
  {
    id: 'handleSteer',
    label: 'ハンドル',
    verb: 'にぎれ',
    instruction: '両手でつかんでひねれ',
  },
  {
    id: 'polyClap',
    label: 'てびょうし',
    verb: 'たたけ',
    instruction: '左右で違う拍子をキープ',
  },
  {
    id: 'smoothLift',
    label: 'そよぎ',
    verb: 'そっと',
    instruction: '乱暴にせず、なめらかに',
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

const TITLE_TABLE = [
  { max: 150, label: 'まだ、ふわふわ' },
  { max: 300, label: 'すこしずつ、かたちに' },
  { max: 400, label: 'いろが見えてきた' },
  { max: 500, label: 'うごきが、かたちになった' },
];

export function getTitle(total) {
  return (TITLE_TABLE.find((t) => total <= t.max) ?? TITLE_TABLE[TITLE_TABLE.length - 1]).label;
}
