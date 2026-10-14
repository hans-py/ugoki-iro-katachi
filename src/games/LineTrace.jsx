import { useCallback, useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import LineTraceVisual, { PATH_D } from './LineTraceVisual.jsx';

const DURATION_MS = 8000;
const SAMPLE_COUNT = 120;
const COMPLETE_TOLERANCE_PX = 40;

export default function LineTrace({ onFinish, scene }) {
  const { send } = usePeerLink();
  const frameRef = useRef(null);
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

  // The visible path lives in LineTraceVisual (shared with the display), so
  // sampling reads its length/points off an identical, invisible copy here
  // instead of reaching into the rendered one.
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

  useEffect(() => {
    send({ type: 'lineTrace', scene, timeLeft, progress, cursor, status, markers });
  }, [send, scene, timeLeft, progress, cursor, status, markers]);

  const toLocalPoint = useCallback((clientX, clientY) => {
    const rect = frameRef.current.getBoundingClientRect();
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

  const hint = progress > 0 ? 'あとをたどって' : '光る点から、たどって';

  return (
    <>
      <svg style={{ display: 'none' }} aria-hidden="true">
        <path ref={pathRef} d={PATH_D} />
      </svg>
      <LineTraceVisual
        ref={frameRef}
        scene={scene}
        timeLeft={timeLeft}
        progress={progress}
        cursor={cursor}
        status={status}
        markers={markers}
        hint={hint}
        onPointerDown={handlePointerDown}
      />
    </>
  );
}
