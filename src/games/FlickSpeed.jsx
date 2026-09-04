import { useCallback, useRef, useState } from 'react';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

const TRIALS = 3;
const MAX_FLICK_MS = 280; // slower than this doesn't count as a flick
const MIN_DIST_PX = 60; // shorter than this doesn't count as a flick
const POINTS = { perfect: 100, good: 60, miss: 20 };
const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };

const norm360 = (a) => ((a % 360) + 360) % 360;
const randomAngle = () => Math.floor(Math.random() * 360);

export default function FlickSpeed({ onFinish, scene }) {
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState(randomAngle);
  const [lastJudge, setLastJudge] = useState(null);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState('playing');
  const startRef = useRef(null);

  const handleDown = useCallback(
    (e) => {
      if (status !== 'playing') return;
      startRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    [status]
  );

  const handleUp = useCallback(
    (e) => {
      if (status !== 'playing' || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - startRef.current.t;
      startRef.current = null;

      let judge;
      if (dt > MAX_FLICK_MS || dist < MIN_DIST_PX) {
        judge = 'miss';
      } else {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const diff = Math.abs(norm360(angle) - norm360(target));
        const angleDiff = diff > 180 ? 360 - diff : diff;
        judge = angleDiff <= 20 ? 'perfect' : angleDiff <= 45 ? 'good' : 'miss';
      }

      setLastJudge(judge);
      if (judge === 'perfect') playChime();

      const nextScores = [...scores, POINTS[judge]];
      const nextTrial = trial + 1;
      setScores(nextScores);
      setTrial(nextTrial);

      if (nextTrial >= TRIALS) {
        const finalScore = Math.round(nextScores.reduce((a, b) => a + b, 0) / TRIALS);
        setStatus('done');
        onFinish?.({ score: finalScore });
      } else {
        setTarget(randomAngle());
      }
    },
    [status, target, scores, trial, onFinish]
  );

  return (
    <div className={`game-screen flick-speed scene-${scene}`} onPointerDown={handleDown} onPointerUp={handleUp}>
      <Hud items={[{ label: 'TRIAL', value: `${Math.min(trial + 1, TRIALS)}/${TRIALS}` }]} />

      <div className="flick-arrow-wrap">
        <div className="flick-arrow" style={{ transform: `rotate(${target}deg)` }} />
      </div>

      {status === 'playing' && <p className="hint">矢印の向きへ、すばやくフリック</p>}
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
