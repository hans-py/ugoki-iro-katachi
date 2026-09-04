import { GAMES } from '../data/titles.js';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';

// Shared between the phone's own result screen (standalone play) and the
// display's mirrored result screen (paired play) — `onRestart` is only
// passed by the phone, since the display has no "もう一度" of its own to
// press.
export default function ResultVisual({ title, total, scores, onRestart }) {
  return (
    <div className="screen result-screen scene-grass">
      <div className="particles-layer">
        <Particles mode="burst" active color="#FFF6E9" />
      </div>
      <Impact />
      <p className="eyebrow">result</p>
      <h1 className="result-title">{title}</h1>
      <p className="total-score">
        {total}
        <span className="total-score-max"> / 500</span>
      </p>

      <ul className="score-breakdown">
        {scores.map((s) => {
          const game = GAMES.find((g) => g.id === s.id);
          return (
            <li key={s.id}>
              <span>{game?.label ?? s.id}</span>
              <span className="hud-value">{s.score}</span>
            </li>
          );
        })}
      </ul>

      {onRestart && (
        <button className="primary-button" onClick={onRestart}>
          もう一度
        </button>
      )}
    </div>
  );
}
