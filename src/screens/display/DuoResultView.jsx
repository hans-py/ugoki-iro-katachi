import { GAMES, getMatchLabel } from '../../data/titles.js';
import Particles from '../../fx/Particles.jsx';
import Impact from '../../fx/Impact.jsx';

// Compatibility is the average, per game, of how close two players' scores
// landed to each other — not who scored higher, just how similarly they
// performed, since that's what "相性" is asking about here.
function matchPercent(a, b) {
  const similarities = a.scores.map((s, i) => {
    const other = b.scores[i];
    const diff = Math.abs(s.score - (other?.score ?? 0));
    return Math.max(0, 100 - diff);
  });
  return Math.round(similarities.reduce((sum, v) => sum + v, 0) / similarities.length);
}

function ScoreColumn({ nickname, result, rank }) {
  return (
    <div className="duo-result-column">
      <p className="duo-result-name" style={{ '--badge-color': nickname.color }}>
        <span className="player-badge-dot" />
        {rank ? `${rank}位 ` : ''}
        {nickname.name}
      </p>
      <p className="total-score">{result.total}</p>
      <ul className="score-breakdown">
        {result.scores.map((s) => {
          const game = GAMES.find((g) => g.id === s.id);
          return (
            <li key={s.id}>
              <span>{game?.label ?? s.id}</span>
              <span className="hud-value">{s.score}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function battleSummary(ranked) {
  const top = ranked[0].result.total;
  const winners = ranked.filter((e) => e.result.total === top);
  if (winners.length === ranked.length) return { headline: 'ひきわけ!', subline: '5ゲーム合計スコアで勝負' };
  if (winners.length > 1) {
    return { headline: `${winners.map((w) => w.nickname.name).join('と')} が同率1位!`, subline: '5ゲーム合計スコアで勝負' };
  }
  return { headline: `${winners[0].nickname.name} の勝ち!`, subline: '5ゲーム合計スコアで勝負' };
}

function matchSummary(entries) {
  const pairs = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      pairs.push({ a: entries[i], b: entries[j], percent: matchPercent(entries[i].result, entries[j].result) });
    }
  }
  const overall = Math.round(pairs.reduce((sum, p) => sum + p.percent, 0) / pairs.length);
  const best = pairs.reduce((top, p) => (p.percent > top.percent ? p : top), pairs[0]);
  const extra =
    entries.length > 2 ? `いちばん近いのは ${best.a.nickname.name} × ${best.b.nickname.name} (${best.percent}%)` : null;
  return { headline: `相性 ${overall}%`, subline: getMatchLabel(overall), extra };
}

// Shown on the display once every connected phone has finished all 5 games —
// each phone only knows its own scores, so the display (which has received
// them all) is the only place that can actually compare them.
export default function DuoResultView({ entries }) {
  const isBattle = entries[0].result.duoMode === 'battle';
  const ranked = [...entries].sort((x, y) => y.result.total - x.result.total);
  const summary = isBattle ? battleSummary(ranked) : matchSummary(entries);
  const shown = isBattle ? ranked : entries;

  return (
    <div className="screen result-screen duo-result-screen scene-grass">
      <div className="particles-layer">
        <Particles mode="burst" active color="#FFF6E9" />
      </div>
      <Impact variant="grand" />
      <h1 className="result-title">{summary.headline}</h1>
      <p className="lead">{summary.subline}</p>
      {summary.extra && <p className="lead">{summary.extra}</p>}

      <div className="duo-result-columns" style={{ '--cols': shown.length }}>
        {shown.map((e, i) => (
          <ScoreColumn key={e.slot} nickname={e.nickname} result={e.result} rank={isBattle ? i + 1 : null} />
        ))}
      </div>
    </div>
  );
}
