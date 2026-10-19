import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

export default function CompassAlignVisual({ scene, timeLeft, diff, target, heading, holdProgress, status, hint, finalMinDiff }) {
  return (
    <div className={`game-screen compass-align scene-${scene}`}>
      <Hud items={[{ label: 'のこり', value: `${(timeLeft / 1000).toFixed(1)}s` }, { label: 'ずれ', value: `${Math.round(diff)}°` }]} />

      <div className="compass-dial">
        <div className="compass-target" style={{ transform: `rotate(${target}deg)` }} />
        <div className="compass-needle" style={{ transform: `rotate(${heading}deg)` }} />
        <div className="compass-hold-ring" style={{ '--progress': holdProgress }} />
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>最短誤差 {Math.round(finalMinDiff)}°</p>
        </div>
      )}
    </div>
  );
}
