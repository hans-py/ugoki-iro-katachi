import { useCallback, useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playChime } from '../fx/audio.js';
import HoldStopVisual from './HoldStopVisual.jsx';

const TRIALS = 3;
const FILL_DURATION_MS = 1200; // time to charge from 0% to 100% while held
const TARGET = 0.78;
const ZONE = { perfect: 0.04, good: 0.12 };
const POINTS = { perfect: 100, good: 60, miss: 20 };

export default function HoldStop({ onFinish, scene }) {
  const { send } = usePeerLink();
  const [trial, setTrial] = useState(0);
  const [fill, setFill] = useState(0);
  const [holding, setHolding] = useState(false);
  const [lastJudge, setLastJudge] = useState(null);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('playing');

  const fillRef = useRef(0);
  const holdStartRef = useRef(0);
  const rafRef = useRef();

  useEffect(() => {
    const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    send({ type: 'holdStop', scene, trial, trials: TRIALS, fill, status, lastJudge, averageScore });
  }, [send, scene, trial, fill, status, lastJudge, scores]);

  const registerResult = useCallback(
    (value) => {
      const diff = Math.abs(value - TARGET);
      const judge = diff <= ZONE.perfect ? 'perfect' : diff <= ZONE.good ? 'good' : 'miss';
      setLastJudge(judge);
      if (judge === 'perfect') playChime();

      const nextScores = [...scores, POINTS[judge]];
      const nextTrial = trial + 1;
      setScores(nextScores);
      setTrial(nextTrial);
      setFill(0);
      fillRef.current = 0;
      setHolding(false);

      if (nextTrial >= TRIALS) {
        const finalScore = Math.round(nextScores.reduce((a, b) => a + b, 0) / TRIALS);
        setStatus('done');
        onFinish?.({ score: finalScore });
      }
    },
    [scores, trial, onFinish]
  );

  const handleDown = useCallback(() => {
    if (status !== 'playing' || holding) return;
    setHolding(true);
    holdStartRef.current = performance.now();
    fillRef.current = 0;

    function tick(now) {
      const value = Math.min(1, (now - holdStartRef.current) / FILL_DURATION_MS);
      fillRef.current = value;
      setFill(value);
      if (value >= 1) {
        registerResult(1);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [status, holding, registerResult]);

  const handleUp = useCallback(() => {
    if (!holding) return;
    cancelAnimationFrame(rafRef.current);
    registerResult(fillRef.current);
  }, [holding, registerResult]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <HoldStopVisual
      scene={scene}
      trial={trial}
      trials={TRIALS}
      fill={fill}
      status={status}
      lastJudge={status === 'playing' ? lastJudge : null}
      judgeKey={trial}
      averageScore={Math.round(scores.reduce((a, b) => a + b, 0) / TRIALS)}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
    />
  );
}
