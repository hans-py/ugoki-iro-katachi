import { useCallback, useEffect, useState } from 'react';
import { useTiming, judgeTiming } from '../engines/useTiming.js';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playChime } from '../fx/audio.js';
import TimingCenterVisual from './TimingCenterVisual.jsx';

const TRIALS = 3;
const POINTS = { perfect: 100, good: 60, miss: 20 };

export default function TimingCenter({ onFinish, scene }) {
  const { position, sample } = useTiming({ periodMs: 1300 });
  const { send } = usePeerLink();
  const [trial, setTrial] = useState(0);
  const [lastJudge, setLastJudge] = useState(null);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('playing');

  useEffect(() => {
    const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    send({ type: 'timingCenter', scene, trial, trials: TRIALS, position, status, lastJudge, averageScore });
  }, [send, scene, trial, position, status, lastJudge, scores]);

  const handleTap = useCallback(() => {
    if (status !== 'playing') return;
    const judge = judgeTiming(sample(), 0.5);
    setLastJudge(judge);
    if (judge === 'perfect') playChime();

    // Compute the next values directly rather than inside a setState
    // updater — calling the parent's onFinish (which updates GameRunner)
    // from inside an updater fires while React is still processing this
    // component's own update, which React rejects.
    const nextScores = [...scores, POINTS[judge]];
    const nextTrial = trial + 1;
    setScores(nextScores);
    setTrial(nextTrial);

    if (nextTrial >= TRIALS) {
      const finalScore = Math.round(nextScores.reduce((a, b) => a + b, 0) / TRIALS);
      setStatus('done');
      onFinish?.({ score: finalScore });
    }
  }, [status, sample, trial, scores, onFinish]);

  return (
    <TimingCenterVisual
      scene={scene}
      trial={trial}
      trials={TRIALS}
      position={position}
      status={status}
      lastJudge={status === 'playing' ? lastJudge : null}
      judgeKey={trial}
      averageScore={Math.round(scores.reduce((a, b) => a + b, 0) / TRIALS)}
      onPointerDown={handleTap}
    />
  );
}
