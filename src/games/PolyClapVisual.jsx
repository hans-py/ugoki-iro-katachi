import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';
import { getHint } from '../data/hints.js';

export default function PolyClapVisual({
  scene,
  timeLeft,
  durationMs,
  leadInMs,
  leftCombo,
  rightCombo,
  leftFlash,
  rightFlash,
  leftPhase,
  rightPhase,
  status,
  finalScore,
  onLeftTap,
  onRightTap,
}) {
  return (
    <div className={`game-screen poly-clap scene-${scene}`}>
      <Hud
        items={[
          { label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` },
          { label: 'L', value: `x${leftCombo}` },
          { label: 'R', value: `x${rightCombo}` },
        ]}
      />

      <div className="poly-clap-zones">
        <div className={`poly-clap-zone poly-clap-left ${leftFlash ? `flash-${leftFlash}` : ''}`} onPointerDown={onLeftTap}>
          <span className="poly-beat-ring" style={{ transform: `scale(${1.8 - 0.8 * leftPhase})` }} />
          <span>L・2拍子</span>
        </div>
        <div className={`poly-clap-zone poly-clap-right ${rightFlash ? `flash-${rightFlash}` : ''}`} onPointerDown={onRightTap}>
          <span className="poly-beat-ring" style={{ transform: `scale(${1.8 - 0.8 * rightPhase})` }} />
          <span>R・3拍子</span>
        </div>
      </div>

      {status === 'playing' && (
        <p className="hint">
          {getHint('polyClap', timeLeft > durationMs - leadInMs ? '開始前' : 'プレイ中')}
        </p>
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
