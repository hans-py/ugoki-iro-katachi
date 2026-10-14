import { useCallback, useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import ControllerView from '../screens/ControllerView.jsx';
import SmoothLiftVisual from './SmoothLiftVisual.jsx';
import { getHint } from '../data/hints.js';

const WINDOW_MS = 2600;
const MIN_SAMPLES = 8;
const FALLBACK_TIMEOUT_MS = 400;

// True vertical position isn't reliably recoverable from a phone's
// accelerometer in a browser (integrating acceleration drifts badly), so
// this measures the thing that actually matters for "すっと": how smooth —
// not how far — the motion is, via the average frame-to-frame change in
// acceleration magnitude (jerk). Lower jerk = a controlled, deliberate move.
export default function SmoothLift({ onFinish, scene }) {
  const { connected, send } = usePeerLink();
  const [status, setStatus] = useState('playing');
  const [progress, setProgress] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const samplesRef = useRef([]);
  const finishedRef = useRef(false);
  const lastPointerRef = useRef(null);
  const receivedMotionRef = useRef(false);
  const isFallbackRef = useRef(false);

  const finish = useCallback(
    (score) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setFinalScore(score);
      setStatus('done');
      onFinish?.({ score });
    },
    [onFinish]
  );

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x === null) return;
    receivedMotionRef.current = true;
    samplesRef.current.push(Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0));
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!lastPointerRef.current) {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    samplesRef.current.push(Math.hypot(dx, dy));
  }, []);

  useEffect(() => {
    window.addEventListener('devicemotion', handleMotion);
    const fallbackTimer = setTimeout(() => {
      if (!receivedMotionRef.current) {
        isFallbackRef.current = true;
        setIsFallback(true);
        window.addEventListener('pointermove', handlePointerMove);
      }
    }, FALLBACK_TIMEOUT_MS);

    const start = performance.now();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / WINDOW_MS);
      setProgress(p);
      send({ type: 'smoothLift', scene, progress: p, status: elapsed >= WINDOW_MS ? 'done' : 'playing' });

      if (elapsed >= WINDOW_MS) {
        const samples = samplesRef.current;
        if (samples.length < MIN_SAMPLES) {
          finish(20);
          return;
        }
        let deltaSum = 0;
        for (let i = 1; i < samples.length; i += 1) {
          deltaSum += Math.abs(samples[i] - samples[i - 1]);
        }
        const avgDelta = deltaSum / (samples.length - 1);
        const penaltyScale = isFallbackRef.current ? 3 : 8;
        const score = Math.round(Math.max(10, Math.min(100, 100 - avgDelta * penaltyScale)));
        finish(score);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('pointermove', handlePointerMove);
      clearTimeout(fallbackTimer);
    };
  }, [handleMotion, handlePointerMove, finish, scene, send]);

  const hint = getHint('smoothLift', isFallback ? 'マウス操作' : progress < 0.5 ? '上げ' : '下げ');

  if (connected) {
    return <ControllerView scene={scene} message={status === 'playing' ? hint : `計測完了 ${finalScore}`} />;
  }

  return <SmoothLiftVisual scene={scene} progress={progress} status={status} hint={hint} finalScore={finalScore} />;
}
