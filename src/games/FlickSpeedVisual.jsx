import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';

const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function FlickSpeedVisual({ scene, trial, trials, target, status, lastJudge, judgeKey, averageScore, onPointerDown, onPointerUp }) {
  return (
    <div className={`game-screen flick-speed scene-${scene}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, trials)}/${trials}` }]} />

      <div className="flick-arrow-wrap">
        <div className="flick-arrow" style={{ transform: `rotate(${target}deg)` }} />
      </div>

      {status === 'playing' && <p className="hint">矢印の向きへ、すばやくフリック</p>}
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
