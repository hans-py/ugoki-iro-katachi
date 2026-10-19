import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';
import { getHint } from '../data/hints.js';

const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function FlickSpeedVisual({ scene, trial, trials, target, status, lastJudge, judgeKey, averageScore, onPointerDown, onPointerUp }) {
  return (
    <div className={`game-screen flick-speed scene-${scene}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, trials)}/${trials}` }]} />

      <div className="flick-arrow-wrap">
        <svg className="flick-hand" viewBox="0 0 120 60" style={{ transform: `rotate(${target}deg)` }}>
          <rect x="6" y="14" width="52" height="34" rx="14" />
          <rect x="48" y="21" width="64" height="12" rx="6" />
          <rect className="flick-nail" x="99" y="23.5" width="9" height="7" rx="3" />
          <circle cx="24" cy="48" r="7" />
          <circle cx="40" cy="49" r="7" />
        </svg>
      </div>

      {status === 'playing' && <p className="hint">{getHint('flickSpeed', '通常')}</p>}
      {lastJudge && status === 'playing' && (
        <div key={judgeKey}>
          {lastJudge === 'perfect' && <Impact variant="micro" />}
          <p className={`judge-flash judge-${lastJudge}`}>{LABEL[lastJudge]}</p>
        </div>
      )}

      {status === 'done' && (
        <div className="result-overlay">
          <Particles mode="burst" active color="#FFC53D" />
          <Impact />
          <h2>計測完了</h2>
          <p>平均スコア {averageScore}</p>
        </div>
      )}
    </div>
  );
}
