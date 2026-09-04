import { useCallback, useEffect, useRef, useState } from 'react';
import { useTilt } from '../engines/useTilt.jsx';
import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

const DURATION_MS = 10000;
const GOOD_DEG = 18; // within this many degrees of target counts as "aligned"
const HOLD_TARGET_MS = 600; // how long you must stay aligned to lock in

function angularDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export default function CompassAlign({ onFinish, scene }) {
  const { heading, isFallback } = useTilt();
  const headingRef = useRef(heading);
  useEffect(() => {
    headingRef.current = heading;
  }, [heading]);

  // useState's lazy initializer runs exactly once on mount — unlike
  // useRef(Math.random()...), whose argument is (impurely) re-evaluated on
  // every render even though only the first result is ever kept.
  const [target] = useState(() => Math.floor(Math.random() * 360));
  const minDiffRef = useRef(180);
  const finishedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [diff, setDiff] = useState(180);
  const [holdProgress, setHoldProgress] = useState(0);
  const [status, setStatus] = useState('playing');
  const [finalMinDiff, setFinalMinDiff] = useState(180);

  const finish = useCallback(
    (cleared, elapsedMs) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const score = cleared
        ? Math.round(Math.max(30, 100 - (elapsedMs / DURATION_MS) * 70))
        : Math.round(Math.max(0, 1 - minDiffRef.current / 60) * 40);
      setFinalMinDiff(minDiffRef.current);
      setStatus(cleared ? 'cleared' : 'timeup');
      onFinish?.({ score });
    },
    [onFinish]
  );

  useEffect(() => {
    const start = performance.now();
    let last = start;
    let holdMs = 0;
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const dt = now - last;
      last = now;
      const elapsed = now - start;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(remaining);

      const d = angularDiff(headingRef.current, target);
      setDiff(d);
      minDiffRef.current = Math.min(minDiffRef.current, d);

      if (d <= GOOD_DEG) {
        holdMs += dt;
        setHoldProgress(Math.min(1, holdMs / HOLD_TARGET_MS));
        if (holdMs >= HOLD_TARGET_MS) {
          finish(true, elapsed);
          return;
        }
      } else {
        holdMs = 0;
        setHoldProgress(0);
      }

      if (remaining <= 0) {
        finish(false, elapsed);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
  }, [finish, target]);

  return (
    <div className={`game-screen compass-align scene-${scene}`}>
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }, { label: 'DIFF', value: `${Math.round(diff)}°` }]} />

      <div className="compass-dial">
        <div className="compass-target" style={{ transform: `rotate(${target}deg)` }} />
        <div className="compass-needle" style={{ transform: `rotate(${heading}deg)` }} />
        <div className="compass-hold-ring" style={{ '--progress': holdProgress }} />
      </div>

      {status === 'playing' && (
        <p className="hint">{isFallback ? '画面上でドラッグして回す' : 'スマホを水平に持って体ごと回す'}</p>
      )}

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
