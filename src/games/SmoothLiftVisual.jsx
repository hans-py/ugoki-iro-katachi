import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

export default function SmoothLiftVisual({ scene, progress, status, hint, finalScore }) {
  const guideScale = 0.4 + (progress < 0.5 ? progress * 2 : 2 - progress * 2) * 0.9;

  return (
    <div className={`game-screen smooth-lift scene-${scene}`}>
      <Hud items={[{ label: 'いま', value: progress < 0.5 ? 'あげる' : 'さげる' }]} />

      <div className="lift-guide-wrap">
        <svg className="lift-blanket" viewBox="0 0 160 160" style={{ transform: `scale(${guideScale})` }} aria-hidden="true">
          <path
            d="M14 120 C14 96 28 88 44 88 C52 70 80 66 94 82 C130 82 148 100 148 120 Z"
            fill="#FFFFFF"
          />
          <path d="M12 120 H150" stroke="#FF1414" strokeWidth="9" strokeLinecap="round" />
          <path d="M34 80 q-6 -10 -2 -19 M44 78 q-2 -12 5 -18" fill="none" stroke="#17102B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
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
