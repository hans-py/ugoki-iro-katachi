import { useCallback, useEffect, useRef, useState } from 'react';

// A value that ping-pongs 0 -> 1 -> 0 forever, driving the moving bar used by
// both ③(ど真ん中を狙え) and ④(リズムに合わせてタップ). Reading `sample()`
// inside an input handler avoids the stale-closure problem a plain state
// value would have in a fast-firing tap handler.
export function useTiming({ periodMs = 1300 } = {}) {
  const [position, setPosition] = useState(0);
  const posRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const t = ((now - start) % periodMs) / periodMs;
      const triangle = t < 0.5 ? t * 2 : 2 - t * 2;
      posRef.current = triangle;
      setPosition(triangle);
      raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
  }, [periodMs]);

  const sample = useCallback(() => posRef.current, []);
  return { position, sample };
}

const DEFAULT_THRESHOLDS = { perfect: 0.05, good: 0.15 };

export function judgeTiming(position, target = 0.5, thresholds = DEFAULT_THRESHOLDS) {
  const diff = Math.abs(position - target);
  if (diff <= thresholds.perfect) return 'perfect';
  if (diff <= thresholds.good) return 'good';
  return 'miss';
}
