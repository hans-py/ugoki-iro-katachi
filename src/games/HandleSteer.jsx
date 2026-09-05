import { useCallback, useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import HandleSteerVisual from './HandleSteerVisual.jsx';

const DURATION_MS = 7000;
const GOOD_DEG = 15;
const HOLD_TARGET_MS = 500;

function angularDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Two fingers grip the screen like a steering wheel; the angle between them,
// measured relative to the angle at the moment of the grip, is the "turn."
export default function HandleSteer({ onFinish, scene }) {
  const { send } = usePeerLink();
  const [target] = useState(() => {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * (45 + Math.random() * 75);
  });
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [gripped, setGripped] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [diff, setDiff] = useState(180);
  const [holdProgress, setHoldProgress] = useState(0);
  const [status, setStatus] = useState('playing');
  const [finalDiff, setFinalDiff] = useState(180);

  const pointersRef = useRef(new Map());
  const referenceRef = useRef(null);
  const rotationRef = useRef(0);
  const grippedRef = useRef(false);
  const finishedRef = useRef(false);
  const minDiffRef = useRef(180);

  const finish = useCallback(
    (cleared, elapsedMs) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const score = cleared
        ? Math.round(Math.max(30, 100 - (elapsedMs / DURATION_MS) * 70))
        : Math.round(Math.max(0, 1 - minDiffRef.current / 60) * 40);
      setFinalDiff(minDiffRef.current);
      setStatus(cleared ? 'cleared' : 'timeup');
      onFinish?.({ score });
    },
    [onFinish]
  );

  const recomputeGrip = useCallback(() => {
    const pts = [...pointersRef.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (referenceRef.current === null) referenceRef.current = angle;
      rotationRef.current = angle - referenceRef.current;
      grippedRef.current = true;
    } else {
      referenceRef.current = null;
      grippedRef.current = false;
    }
  }, []);

  const handleDown = useCallback(
    (e) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      recomputeGrip();
    },
    [recomputeGrip]
  );
  const handleMove = useCallback(
    (e) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      recomputeGrip();
    },
    [recomputeGrip]
  );
  const handleUp = useCallback(
    (e) => {
      pointersRef.current.delete(e.pointerId);
      recomputeGrip();
    },
    [recomputeGrip]
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
      setGripped(grippedRef.current);
      setRotation(rotationRef.current);

      let cleared = false;
      if (grippedRef.current) {
        const d = angularDiff(rotationRef.current, target);
        setDiff(d);
        minDiffRef.current = Math.min(minDiffRef.current, d);
        if (d <= GOOD_DEG) {
          holdMs += dt;
          setHoldProgress(Math.min(1, holdMs / HOLD_TARGET_MS));
          if (holdMs >= HOLD_TARGET_MS) cleared = true;
        } else {
          holdMs = 0;
          setHoldProgress(0);
        }
      } else {
        holdMs = 0;
        setHoldProgress(0);
      }

      send({
        type: 'handleSteer',
        scene,
        timeLeft: remaining,
        diff: grippedRef.current ? angularDiff(rotationRef.current, target) : 180,
        target,
        rotation: rotationRef.current,
        holdProgress: Math.min(1, holdMs / HOLD_TARGET_MS),
        gripped: grippedRef.current,
        status: cleared ? 'cleared' : remaining <= 0 ? 'timeup' : 'playing',
        finalDiff: minDiffRef.current,
      });

      if (cleared) {
        finish(true, elapsed);
        return;
      }
      if (remaining <= 0) {
        finish(false, elapsed);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
  }, [finish, target, scene, send]);

  return (
    <HandleSteerVisual
      scene={scene}
      timeLeft={timeLeft}
      diff={diff}
      target={target}
      rotation={rotation}
      holdProgress={holdProgress}
      gripped={gripped}
      status={status}
      finalDiff={finalDiff}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    />
  );
}
