import { GAMES, getMatchLabel } from '../../data/titles.js';
import Particles from '../../fx/Particles.jsx';
import Impact from '../../fx/Impact.jsx';

function battleVerdict(a, b, nameA, nameB) {
  if (a.total > b.total) return `${nameA.name} の勝ち!`;
  if (b.total > a.total) return `${nameB.name} の勝ち!`;
  return 'ひきわけ!';
}

// Compatibility is the average, per game, of how close the two players'
// scores landed to each other — not who scored higher, just how similarly
// they performed, since that's what "相性" is asking about here.
function matchPercent(a, b) {
  const similarities = a.scores.map((s, i) => {
    const other = b.scores[i];
    const diff = Math.abs(s.score - (other?.score ?? 0));
    return Math.max(0, 100 - diff);
  });
  return Math.round(similarities.reduce((sum, v) => sum + v, 0) / similarities.length);
}

function ScoreColumn({ nickname, result }) {
  return (
    <div className="duo-result-column">
      <p className="duo-result-name" style={{ '--badge-color': nickname.color }}>
        <span className="player-badge-dot" />
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

// Shown on the display once both phones have finished all 5 duo games —
// each phone only knows its own scores, so the display (which has received
// both) is the only place that can actually compare them.
export default function DuoResultView({ a, b, nameA, nameB }) {
  const isBattle = a.duoMode === 'battle';
  const headline = isBattle ? battleVerdict(a, b, nameA, nameB) : `相性 ${matchPercent(a, b)}%`;
  const subline = isBattle ? '5ゲーム合計スコアで勝負' : getMatchLabel(matchPercent(a, b));

  return (
    <div className="screen result-screen duo-result-screen scene-grass">
      <div className="particles-layer">
        <Particles mode="burst" active color="#FFF6E9" />
      </div>
      <Impact variant="grand" />
      <p className="eyebrow">{isBattle ? 'battle result' : 'match result'}</p>
      <h1 className="result-title">{headline}</h1>
      <p className="lead">{subline}</p>

      <div className="duo-result-columns">
        <ScoreColumn nickname={nameA} result={a} />
        <ScoreColumn nickname={nameB} result={b} />
      </div>
    </div>
  );
}
