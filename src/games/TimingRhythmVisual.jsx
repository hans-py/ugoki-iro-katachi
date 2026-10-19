import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';
import { getHint } from '../data/hints.js';

const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };
const TARGET_SIZE = 64;
const MAX_SIZE = 210;

export default function TimingRhythmVisual({ scene, beatIndex, rounds, combo, ringScale, status, lastJudge, judgeKey, finalScore, onPointerDown }) {
  const approachSize = TARGET_SIZE + ringScale * (MAX_SIZE - TARGET_SIZE);

  return (
    <div className={`game-screen timing-rhythm scene-${scene}`} onPointerDown={onPointerDown}>
      <Hud
        items={[
          { label: '拍', value: `${Math.min(beatIndex + 1, rounds)}/${rounds}` },
          { label: 'コンボ', value: `x${combo}` },
        ]}
      />

      <div className="rhythm-target-wrap">
        <div className="rhythm-ring-fixed" style={{ width: TARGET_SIZE, height: TARGET_SIZE }} />
        <div className="rhythm-ring-approach" style={{ width: approachSize, height: approachSize }} />
      </div>

      {status === 'playing' && <p className="hint">{getHint('timingRhythm', '通常')}</p>}
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
          <p>スコア {finalScore}</p>
        </div>
      )}
    </div>
  );
}
