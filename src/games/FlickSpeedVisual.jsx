import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';
import { getHint } from '../data/hints.js';

const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function FlickSpeedVisual({ scene, trial, trials, target, status, lastJudge, judgeKey, averageScore, onPointerDown, onPointerUp }) {
  return (
    <div className={`game-screen flick-speed scene-${scene}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Hud items={[{ label: '回', value: `${Math.min(trial + 1, trials)}/${trials}` }]} />

      <div className="flick-arrow-wrap">
        <svg className="flick-arrow-svg" viewBox="0 0 140 70" style={{ transform: `rotate(${target}deg)` }}>
          <rect x="6" y="26" width="92" height="18" rx="9" />
          <polygon points="94,8 134,35 94,62" />
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
