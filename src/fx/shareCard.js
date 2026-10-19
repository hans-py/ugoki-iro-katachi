import { SHARE_TEXTS } from '../data/titles.js';

const W = 1080;
const H = 1350;
const INK = '#17102b';
const BACKGROUNDS = ['#ff4a1c', '#00c8ff', '#35ff7a', '#ffe500', '#ff2e9a'];

function gameUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

// {title} {total} {max} {count} {stills} {url} in texts.md → real values.
function fill(template, values) {
  return (template ?? '').replace(/\{(\w+)\}/g, (m, key) => (key in values ? String(values[key]) : m));
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Fits the title on one line by shrinking the font; only if it still won't
// fit at the smallest size is it split in two, as evenly as possible and
// preferably after a "、" or "。" — never leaving a single stray character.
function layoutTitle(ctx, text, family, maxWidth) {
  for (let size = 100; size >= 64; size -= 4) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return { size, lines: [text] };
  }
  const chars = [...text];
  const mid = chars.length / 2;
  let best = Math.round(mid);
  for (let i = 1; i < chars.length; i += 1) {
    const afterPunct = chars[i - 1] === '、' || chars[i - 1] === '。';
    if (afterPunct && Math.abs(i - mid) <= Math.abs(best - mid) + 2) best = i;
  }
  ctx.font = `64px ${family}`;
  return { size: 64, lines: [chars.slice(0, best).join(''), chars.slice(best).join('')] };
}

export function shareValues({ title, total, seenCount, stillTotal }) {
  return { title, total, max: 500, count: seenCount, stills: stillTotal, url: gameUrl() };
}

export function shareCaption(info) {
  const text = fill(SHARE_TEXTS.caption, shareValues(info));
  return text.includes(gameUrl()) ? text : `${text}\n${gameUrl()}`;
}

// Draws the 4:5 result card on a canvas and returns it as a PNG blob. The
// still earned this session is shown on it (images only — a clip can't be a
// still picture), or a locked "?" box when none was earned.
export async function renderShareCard(info) {
  const { title, total, stillSrc } = info;
  const values = shareValues(info);
  // Google Fonts serves Japanese fonts in unicode-range slices, so each load
  // must name the actual characters it will draw or the glyphs fall back.
  const headingText = fill(SHARE_TEXTS.heading, values);
  const footerText = fill(SHARE_TEXTS.footer, values);
  await Promise.all([
    document.fonts.load('100px "Dela Gothic One"', `${title}${total}?`),
    document.fonts.load('700 44px "M PLUS Rounded 1c"', `${headingText}${footerText}/ 0123456789`),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const display = '"Dela Gothic One", "Hiragino Sans", sans-serif';
  const body = '"M PLUS Rounded 1c", "Hiragino Sans", sans-serif';

  ctx.fillStyle = BACKGROUNDS[total % BACKGROUNDS.length];
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255, 246, 233, 0.35)';
  ctx.beginPath();
  ctx.arc(W - 120, 160, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 44px ${body}`;
  ctx.fillText(headingText, W / 2, 110);

  const { size: titleSize, lines: titleLines } = layoutTitle(ctx, title, display, W - 120);
  ctx.font = `${titleSize}px ${display}`;
  titleLines.forEach((line, i) => ctx.fillText(line, W / 2, 290 + i * (titleSize + 24)));

  // Score and "/ 500" as one centered group, measured so they never overlap.
  ctx.textAlign = 'left';
  ctx.font = `260px ${display}`;
  const scoreWidth = ctx.measureText(String(total)).width;
  ctx.font = `700 72px ${body}`;
  const maxText = `/ ${values.max}`;
  const maxWidth = ctx.measureText(maxText).width;
  const gap = 24;
  const startX = (W - (scoreWidth + gap + maxWidth)) / 2;
  ctx.font = `260px ${display}`;
  ctx.fillText(String(total), startX, 640);
  ctx.font = `700 72px ${body}`;
  ctx.fillText(maxText, startX + scoreWidth + gap, 640);
  ctx.textAlign = 'center';

  const bx = (W - 330) / 2;
  const by = 700;
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(bx, by, 330, 440);
  const img = stillSrc ? await loadImage(stillSrc) : null;
  if (img) {
    const scale = Math.min(330 / img.width, 440 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, bx + (330 - w) / 2, by + (440 - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#ff1414';
    ctx.font = `200px ${display}`;
    ctx.fillText('?', W / 2, by + 290);
  }
  ctx.strokeStyle = '#ff1414';
  ctx.lineWidth = 10;
  ctx.strokeRect(bx, by, 330, 440);

  ctx.fillStyle = INK;
  ctx.font = `700 40px ${body}`;
  ctx.fillText(footerText, W / 2, 1250);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
