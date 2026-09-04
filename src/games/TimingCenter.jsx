import { useCallback, useState } from 'react';
import { useTiming, judgeTiming } from '../engines/useTiming.js';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

const TRIALS = 3;
const POINTS = { perfect: 100, good: 60, miss: 20 };
const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function TimingCenter({ onFinish, scene }) {
  const { position, sample } = useTiming({ periodMs: 1300 });
  const [trial, setTrial] = useState(0);
  const [lastJudge, setLastJudge] = useState(null);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('playing');

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
    <div className={`game-screen timing-center scene-${scene}`} onPointerDown={handleTap}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, TRIALS)}/${TRIALS}` }]} />

      <div className="timing-track">
        <div className="timing-zone-good" />
        <div className="timing-zone-perfect" />
        <div className="timing-marker" style={{ left: `${position * 100}%` }} />
      </div>

      {status === 'playing' && <p className="hint">画面をタップ — ど真ん中を狙え</p>}
      {lastJudge && status === 'playing' && (
        <div key={trial}>
          {lastJudge === 'perfect' && <Impact variant="micro" />}
          <p className={`judge-flash judge-${lastJudge}`}>{LABEL[lastJudge]}</p>
        </div>
      )}

      {status === 'done' && (
        <div className="result-overlay">
          <Particles mode="burst" active color="#FFC53D" />
          <Impact />
          <h2>計測完了</h2>
          <p>平均スコア {Math.round(scores.reduce((a, b) => a + b, 0) / TRIALS)}</p>
        </div>
      )}
    </div>
  );
}
