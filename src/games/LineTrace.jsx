import { useCallback, useEffect, useRef, useState } from 'react';
import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

const DURATION_MS = 8000;
const PATH_D = 'M 30 40 C 30 150, 190 150, 190 260 C 190 350, 30 350, 30 390';
const SAMPLE_COUNT = 120;
const COMPLETE_TOLERANCE_PX = 40;

export default function LineTrace({ onFinish, scene }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const samplesRef = useRef([]);
  const draggingRef = useRef(false);
  const maxProgressRef = useRef(0);
  const deviationSumRef = useRef(0);
  const deviationCountRef = useRef(0);
  const finishedRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState('playing');
  const [markers, setMarkers] = useState(null);

  const finish = useCallback(
    (cleared) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const avgDeviation = deviationCountRef.current > 0 ? deviationSumRef.current / deviationCountRef.current : 999;
      const score = cleared
        ? Math.round(Math.max(30, 100 - avgDeviation * 2))
        : Math.round(maxProgressRef.current * 40);
      setStatus(cleared ? 'cleared' : 'timeup');
      onFinish?.({ score });
    },
    [onFinish]
  );

  useEffect(() => {
    const total = pathRef.current.getTotalLength();
    const samples = [];
    for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
      const pt = pathRef.current.getPointAtLength((i / SAMPLE_COUNT) * total);
      samples.push({ x: pt.x, y: pt.y });
    }
    samplesRef.current = samples;
    setMarkers({ start: samples[0], end: samples[samples.length - 1] });
  }, []);

  useEffect(() => {
    const start = performance.now();
    let raf = requestAnimationFrame(tick);
    function tick(now) {
      const remaining = Math.max(0, DURATION_MS - (now - start));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finish(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [finish]);

  const toLocalPoint = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 220,
      y: ((clientY - rect.top) / rect.height) * 420,
    };
  }, []);

  const registerPoint = useCallback(
    (clientX, clientY) => {
      const p = toLocalPoint(clientX, clientY);
      setCursor(p);
      const samples = samplesRef.current;
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < samples.length; i += 1) {
        const d = Math.hypot(samples[i].x - p.x, samples[i].y - p.y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      deviationSumRef.current += bestDist;
      deviationCountRef.current += 1;
      const frac = bestIdx / (samples.length - 1);
      if (frac > maxProgressRef.current) {
        maxProgressRef.current = frac;
        setProgress(frac);
      }
      if (bestIdx >= samples.length - 2 && bestDist <= COMPLETE_TOLERANCE_PX) {
        finish(true);
      }
    },
    [toLocalPoint, finish]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (status !== 'playing') return;
      draggingRef.current = true;
      registerPoint(e.clientX, e.clientY);
    },
    [status, registerPoint]
  );

  useEffect(() => {
    function handleMove(e) {
      if (!draggingRef.current) return;
      registerPoint(e.clientX, e.clientY);
    }
    function handleUp() {
      draggingRef.current = false;
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [registerPoint]);

  return (
    <div className={`game-screen line-trace scene-${scene}`}>
      <Hud
        items={[
          { label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` },
          { label: 'PROGRESS', value: `${Math.round(progress * 100)}%` },
        ]}
      />

      <div className="trace-frame" onPointerDown={handlePointerDown}>
        <svg ref={svgRef} viewBox="0 0 220 420" className="trace-svg">
          <path ref={pathRef} d={PATH_D} className="trace-path-bg" />
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

      {status === 'playing' && (
        <p className="hint">{progress > 0 ? 'そのままゴールまでなぞって' : '光る点(スタート)から指でなぞってね'}</p>
      )}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>到達 {Math.round(progress * 100)}%</p>
        </div>
      )}
    </div>
  );
}
