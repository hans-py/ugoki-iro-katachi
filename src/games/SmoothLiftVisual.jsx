import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

export default function SmoothLiftVisual({ scene, progress, status, hint, finalScore }) {
  const guideScale = 0.4 + (progress < 0.5 ? progress * 2 : 2 - progress * 2) * 0.9;

  return (
    <div className={`game-screen smooth-lift scene-${scene}`}>
      <Hud items={[{ label: 'PHASE', value: progress < 0.5 ? 'UP' : 'DOWN' }]} />

      <div className="lift-guide-wrap">
        <div className="lift-guide-circle" style={{ transform: `scale(${guideScale})` }} />
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}

      {status === 'done' && (
        <div className="result-overlay">
          <Impact />
          <h2>計測完了</h2>
          <p>なめらかさ {finalScore}</p>
        </div>
      )}
    </div>
  );
}
