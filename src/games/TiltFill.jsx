import { useCallback, useEffect, useRef, useState } from 'react';
import { useTilt } from '../engines/useTilt.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playChime, startMotionTone, updateMotionTone, stopMotionTone } from '../fx/audio.js';
import TiltFillVisual from './TiltFillVisual.jsx';
import ControllerView from '../screens/ControllerView.jsx';
import { getHint } from '../data/hints.js';

const DURATION_MS = 8000;
const MIN_POUR = 0.15; // tilt magnitude below this: nothing pours
const SPILL_THRESHOLD = 0.75; // tilt magnitude above this: beer spills out
const FILL_RATE = 55; // % per second at full pour magnitude
const SPILL_RATE = 70; // % per second lost while spilling

export default function TiltFill({ onFinish, scene }) {
  const { tilt, isFallback } = useTilt();
  const { connected, send } = usePeerLink();
  const tiltRef = useRef(tilt);
  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  const [fill, setFill] = useState(0);
  const [spilling, setSpilling] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [status, setStatus] = useState('playing'); // 'playing' | 'cleared' | 'timeup'
  const fillRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = useCallback(
    (finalFill, cleared) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setStatus(cleared ? 'cleared' : 'timeup');
      if (cleared) playChime();
      onFinish?.({ score: Math.round(finalFill) });
    },
    [onFinish]
  );

  useEffect(() => {
    const start = performance.now();
    let last = start;
    startMotionTone();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const dt = now - last;
      last = now;
      const remaining = Math.max(0, DURATION_MS - (now - start));
      setTimeLeft(remaining);

      const magnitude = Math.min(1, Math.hypot(tiltRef.current.x, tiltRef.current.y));
      updateMotionTone(magnitude);
      const isSpilling = magnitude > SPILL_THRESHOLD;
      const isPouring = !isSpilling && magnitude > MIN_POUR;
      setSpilling(isSpilling);
      setPouring(isPouring);

      if (isSpilling) {
        fillRef.current = Math.max(0, fillRef.current - (SPILL_RATE * dt) / 1000);
      } else if (isPouring) {
        fillRef.current = Math.min(100, fillRef.current + (FILL_RATE * magnitude * dt) / 1000);
      }
      // Below MIN_POUR (tilt released back to neutral): neither branch runs,
      // so the level holds exactly where it was — it never drains back down.
      setFill(fillRef.current);

      // Harmless no-op when nothing is paired — send() only writes when a
      // peer connection is actually open.
      send({
        type: 'tiltFill',
        scene,
        timeLeft: remaining,
        fill: fillRef.current,
        spilling: isSpilling,
        pouring: isPouring,
        status: fillRef.current >= 99.5 ? 'cleared' : remaining <= 0 ? 'timeup' : 'playing',
      });

      if (fillRef.current >= 99.5) {
        finish(100, true);
        return;
      }
      if (remaining <= 0) {
        finish(fillRef.current, false);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      stopMotionTone();
    };
  }, [finish, scene, send]);

  const hint = pouring ? getHint('tiltFill', '注ぎ中') : getHint('tiltFill', isFallback ? 'マウス操作' : '待機中');

  if (connected) {
    return (
      <ControllerView
        scene={scene}
        message={status === 'playing' ? hint : status === 'cleared' ? 'クリア!' : 'タイムアップ'}
        sub={spilling && status === 'playing' ? 'こぼれてる!' : null}
      />
    );
  }

  return (
    <TiltFillVisual scene={scene} timeLeft={timeLeft} fill={fill} spilling={spilling} pouring={pouring} status={status} hint={hint} />
  );
}
