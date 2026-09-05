import { useEffect, useRef, useState } from 'react';
import { useShake } from '../engines/useShake.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playChime } from '../fx/audio.js';
import ControllerView from '../screens/ControllerView.jsx';
import ShakeGaugeVisual from './ShakeGaugeVisual.jsx';

const DURATION_MS = 5000;
const TARGET_SHAKES = 20;

export default function ShakeGauge({ onFinish, scene }) {
  const { shakeCount, resetShakeCount, isFallback } = useShake();
  const { connected, send } = usePeerLink();
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
      const gaugeNow = Math.min(100, Math.round((shakeCountRef.current / TARGET_SHAKES) * 100));
      send({ type: 'shakeGauge', scene, timeLeft: remaining, gauge: gaugeNow, status: remaining <= 0 ? 'done' : 'playing' });

      if (remaining <= 0) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          if (gaugeNow >= 100) playChime();
          setStatus('done');
          onFinish?.({ score: gaugeNow });
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
    // shakeCount is read at the moment the timer ends via the closure above;
    // re-running this effect per tick would restart the timer, so it only
    // depends on onFinish/scene/send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish, scene, send]);

  const gauge = Math.min(100, Math.round((shakeCount / TARGET_SHAKES) * 100));
  const hint = isFallback ? '連打してゲージを満タンに' : 'スマホを揺すってゲージを満タンに';

  if (connected) {
    return <ControllerView scene={scene} message={status === 'playing' ? hint : `計測完了 ${gauge}%`} />;
  }

  return <ShakeGaugeVisual scene={scene} timeLeft={timeLeft} gauge={gauge} status={status} hint={hint} />;
}
