import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';

export default function ShakeGaugeVisual({ scene, timeLeft, gauge, status, hint }) {
  return (
    <div className={`game-screen shake-gauge scene-${scene}`}>
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }, { label: 'GAUGE', value: `${gauge}%` }]} />

      <div className="gauge-tube">
        <div className={`gauge-fill ${gauge >= 100 ? 'gauge-full' : ''}`} style={{ height: `${gauge}%` }} />
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}

      {status === 'done' && (
        <div className="result-overlay">
          <Particles mode="burst" active={gauge >= 100} color="#FFC53D" />
          {gauge >= 100 && <Impact />}
          <h2>計測完了</h2>
          <p>到達ゲージ {gauge}%</p>
        </div>
      )}
    </div>
  );
}
