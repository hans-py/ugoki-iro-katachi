import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';

const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function TimingCenterVisual({ scene, trial, trials, position, status, lastJudge, judgeKey, averageScore, onPointerDown }) {
  return (
    <div className={`game-screen timing-center scene-${scene}`} onPointerDown={onPointerDown}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, trials)}/${trials}` }]} />

      <div className="timing-track">
        <div className="timing-zone-good" />
        <div className="timing-zone-perfect" />
        <div className="timing-marker" style={{ left: `${position * 100}%` }} />
      </div>

      {status === 'playing' && <p className="hint">画面をタップ — ど真ん中を狙え</p>}
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
