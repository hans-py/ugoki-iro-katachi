import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';
import { getHint } from '../data/hints.js';

export default function HandleSteerVisual({
  scene,
  timeLeft,
  diff,
  target,
  rotation,
  holdProgress,
  gripped,
  status,
  finalDiff,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  return (
    <div
      className={`game-screen handle-steer scene-${scene}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }, { label: 'DIFF', value: `${Math.round(diff)}°` }]} />

      <div className="compass-dial">
        <div className="compass-target" style={{ transform: `rotate(${target}deg)` }} />
        <div className="compass-needle" style={{ transform: `rotate(${rotation}deg)` }} />
        <div className="compass-hold-ring" style={{ '--progress': holdProgress }} />
      </div>

      {status === 'playing' && <p className="hint">{getHint('handleSteer', gripped ? 'つかみ中' : 'つかむ前')}</p>}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>最短誤差 {Math.round(finalDiff)}°</p>
        </div>
      )}
    </div>
  );
}
