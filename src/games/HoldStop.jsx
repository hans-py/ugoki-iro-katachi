import { useCallback, useEffect, useRef, useState } from 'react';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

const TRIALS = 3;
const FILL_DURATION_MS = 1200; // time to charge from 0% to 100% while held
const TARGET = 0.78;
const ZONE = { perfect: 0.04, good: 0.12 };
const POINTS = { perfect: 100, good: 60, miss: 20 };
const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

export default function HoldStop({ onFinish, scene }) {
  const [trial, setTrial] = useState(0);
  const [fill, setFill] = useState(0);
  const [holding, setHolding] = useState(false);
  const [lastJudge, setLastJudge] = useState(null);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('playing');

  const fillRef = useRef(0);
  const holdStartRef = useRef(0);
  const rafRef = useRef();

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
    <div className={`game-screen hold-stop scene-${scene}`} onPointerDown={handleDown} onPointerUp={handleUp}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, TRIALS)}/${TRIALS}` }]} />

      <div className="hold-track">
        <div className="hold-zone-good" />
        <div className="hold-zone-perfect" />
        <div className="hold-fill" style={{ height: `${fill * 100}%` }} />
      </div>

      {status === 'playing' && <p className="hint">押しっぱなしで貯めて、ねらった位置で離す</p>}
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
