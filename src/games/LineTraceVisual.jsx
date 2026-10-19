import { forwardRef } from 'react';
import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

export const PATH_D = 'M 30 40 C 30 150, 190 150, 190 260 C 190 350, 30 350, 30 390';

// Direction chevrons spaced along the path (start is the top, goal the bottom),
// so which way to trace is readable without relying on the start dot alone.
function pathArrows(count) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', PATH_D);
  const length = path.getTotalLength();
  return Array.from({ length: count }, (_, i) => {
    const at = (length * (i + 1)) / (count + 1);
    const a = path.getPointAtLength(at);
    const b = path.getPointAtLength(at + 1);
    return { x: a.x, y: a.y, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
  });
}

const ARROWS = pathArrows(5);

// forwardRef so the phone's own instance (LineTrace.jsx) can measure
// `.trace-frame`'s on-screen rect for pointer hit-testing — the display's
// mirrored instance never passes a ref since it isn't touch-interactive.
const LineTraceVisual = forwardRef(function LineTraceVisual(
  { scene, timeLeft, progress, cursor, status, markers, hint, onPointerDown },
  frameRef
) {
  return (
    <div className={`game-screen line-trace scene-${scene}`}>
      <Hud
        items={[
          { label: 'のこり', value: `${(timeLeft / 1000).toFixed(1)}s` },
          { label: '進み', value: `${Math.round(progress * 100)}%` },
        ]}
      />

      <div ref={frameRef} className="trace-frame" onPointerDown={onPointerDown}>
        <svg viewBox="0 0 220 420" className="trace-svg">
          <path d={PATH_D} className="trace-path-bg" />
          {ARROWS.map((a, i) => (
            <polygon
              key={i}
              points="-9,-9 9,0 -9,9"
              className="trace-arrow"
              transform={`translate(${a.x} ${a.y}) rotate(${a.angle})`}
            />
          ))}
          <path
            d={PATH_D}
            className="trace-path-progress"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress }}
          />
          {markers && (
            <>
              <circle cx={markers.end.x} cy={markers.end.y} r={10} className="trace-goal-dot" />
              <g
                className="trace-start-marker"
                style={{ opacity: progress > 0.03 ? 0.15 : 1, transition: 'opacity 0.3s ease' }}
              >
                <circle cx={markers.start.x} cy={markers.start.y} r={9} className="trace-start-ring" />
                <circle cx={markers.start.x} cy={markers.start.y} r={7} className="trace-start-dot" />
              </g>
            </>
          )}
          {cursor && <circle cx={cursor.x} cy={cursor.y} r={7} className="trace-cursor" />}
        </svg>
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>到達 {Math.round(progress * 100)}%</p>
        </div>
      )}
    </div>
  );
});

export default LineTraceVisual;
