import { useCallback, useEffect, useRef, useState } from 'react';
import { useTilt } from '../engines/useTilt.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { startMotionTone, updateMotionTone, stopMotionTone } from '../fx/audio.js';
import ControllerView from '../screens/ControllerView.jsx';
import CompassAlignVisual from './CompassAlignVisual.jsx';

const DURATION_MS = 10000;
const GOOD_DEG = 18; // within this many degrees of target counts as "aligned"
const HOLD_TARGET_MS = 600; // how long you must stay aligned to lock in

function angularDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// How many degrees/sec of turning counts as "moving as fast as this phone
// physically can be turned" — sonified at 1.0, so casual turning stays quiet
// and a fast spin sounds a clearly higher, louder tone.
const MAX_TURN_RATE = 260;

export default function CompassAlign({ onFinish, scene }) {
  const { heading, isFallback } = useTilt();
  const { connected, send } = usePeerLink();
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
    let prevHeading = headingRef.current;
    startMotionTone();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const dt = now - last;
      last = now;
      const elapsed = now - start;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(remaining);

      const turnRate = dt > 0 ? (angularDiff(headingRef.current, prevHeading) / dt) * 1000 : 0;
      prevHeading = headingRef.current;
      updateMotionTone(turnRate / MAX_TURN_RATE);

      const d = angularDiff(headingRef.current, target);
      setDiff(d);
      minDiffRef.current = Math.min(minDiffRef.current, d);

      let cleared = false;
      if (d <= GOOD_DEG) {
        holdMs += dt;
        setHoldProgress(Math.min(1, holdMs / HOLD_TARGET_MS));
        if (holdMs >= HOLD_TARGET_MS) cleared = true;
      } else {
        holdMs = 0;
        setHoldProgress(0);
      }

      send({
        type: 'compassAlign',
        scene,
        timeLeft: remaining,
        diff: d,
        target,
        heading: headingRef.current,
        holdProgress: Math.min(1, holdMs / HOLD_TARGET_MS),
        status: cleared ? 'cleared' : remaining <= 0 ? 'timeup' : 'playing',
        finalMinDiff: minDiffRef.current,
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

    return () => {
      cancelAnimationFrame(raf);
      stopMotionTone();
    };
  }, [finish, target, scene, send]);

  const hint = isFallback ? '画面上でドラッグして回す' : 'スマホを水平に持って体ごと回す';

  if (connected) {
    return (
      <ControllerView
        scene={scene}
        message={status === 'playing' ? hint : status === 'cleared' ? 'クリア!' : 'タイムアップ'}
      />
    );
  }

  return (
    <CompassAlignVisual
      scene={scene}
      timeLeft={timeLeft}
      diff={diff}
      target={target}
      heading={heading}
      holdProgress={holdProgress}
      status={status}
      hint={hint}
      finalMinDiff={finalMinDiff}
    />
  );
}
