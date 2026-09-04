import { useEffect, useRef, useState } from 'react';
import { useShake } from '../engines/useShake.jsx';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

const DURATION_MS = 5000;
const TARGET_SHAKES = 20;

export default function ShakeGauge({ onFinish, scene }) {
  const { shakeCount, resetShakeCount, isFallback } = useShake();
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [status, setStatus] = useState('playing');
  const finishedRef = useRef(false);
  const shakeCountRef = useRef(shakeCount);

  useEffect(() => {
    resetShakeCount();
  }, [resetShakeCount]);

  useEffect(() => {
    shakeCountRef.current = shakeCount;
  }, [shakeCount]);

  useEffect(() => {
    const start = performance.now();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const remaining = Math.max(0, DURATION_MS - (now - start));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          const gauge = Math.min(100, Math.round((shakeCountRef.current / TARGET_SHAKES) * 100));
          if (gauge >= 100) playChime();
          setStatus('done');
          onFinish?.({ score: gauge });
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
    // shakeCount is read at the moment the timer ends via the closure below;
    // re-running this effect per tick would restart the timer, so it only
    // depends on onFinish.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  const gauge = Math.min(100, Math.round((shakeCount / TARGET_SHAKES) * 100));

  return (
    <div className={`game-screen shake-gauge scene-${scene}`}>
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }, { label: 'GAUGE', value: `${gauge}%` }]} />

      <div className="gauge-tube">
        <div className={`gauge-fill ${gauge >= 100 ? 'gauge-full' : ''}`} style={{ height: `${gauge}%` }} />
      </div>

      {status === 'playing' && (
        <p className="hint">{isFallback ? '連打してゲージを満タンに' : 'スマホを揺すってゲージを満タンに'}</p>
      )}

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
