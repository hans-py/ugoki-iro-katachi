import { useCallback, useEffect, useRef, useState } from 'react';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

// Unlike ③(ど真ん中を狙え), which judges a spatial position on a moving bar,
// this game is pure tempo: a ring shrinks onto a fixed target ring on a beat,
// and you tap in time with it — closer to a metronome than a targeting game.
const BEAT_MS = 700;
const LEAD_IN_MS = 700;
const ROUNDS = 5;
const APPROACH_MS = 700;
const HIT_WINDOW = { perfect: 80, good: 180 };
const BASE_POINTS = { perfect: 100, good: 60, miss: 0 };
const LABEL = { perfect: 'Perfect!', good: 'Good', miss: 'Miss' };
const COMBO_CAP = 3;
const MAX_RAW = (() => {
  let streak = 0;
  let total = 0;
  for (let i = 0; i < ROUNDS; i += 1) {
    total += BASE_POINTS.perfect * Math.min(1 + streak, COMBO_CAP);
    streak += 1;
  }
  return total;
})();

const BEAT_TIMES = Array.from({ length: ROUNDS }, (_, i) => LEAD_IN_MS + i * BEAT_MS);

export default function TimingRhythm({ onFinish, scene }) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastJudge, setLastJudge] = useState(null);
  const [status, setStatus] = useState('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [ringScale, setRingScale] = useState(1);

  const startRef = useRef(0);
  const rawRef = useRef(0);
  const comboStreakRef = useRef(0);
  const roundRef = useRef(0);
  const resolvedRef = useRef(false);

  const registerJudge = useCallback(
    (judge) => {
      const multiplier = judge === 'miss' ? 1 : Math.min(1 + comboStreakRef.current, COMBO_CAP);
      rawRef.current += BASE_POINTS[judge] * multiplier;
      comboStreakRef.current = judge === 'miss' ? 0 : comboStreakRef.current + 1;

      setLastJudge(judge);
      setCombo(comboStreakRef.current);
      if (judge !== 'miss') playChime();

      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      resolvedRef.current = false;
      setBeatIndex(nextRound);

      if (nextRound >= ROUNDS) {
        const score = Math.round((rawRef.current / MAX_RAW) * 100);
        setFinalScore(score);
        setStatus('done');
        onFinish?.({ score });
      }
    },
    [onFinish]
  );

  const handleTap = useCallback(() => {
    if (status !== 'playing' || resolvedRef.current || roundRef.current >= ROUNDS) return;
    resolvedRef.current = true;
    const elapsed = performance.now() - startRef.current;
    const diff = Math.abs(elapsed - BEAT_TIMES[roundRef.current]);
    const judge = diff <= HIT_WINDOW.perfect ? 'perfect' : diff <= HIT_WINDOW.good ? 'good' : 'miss';
    registerJudge(judge);
  }, [status, registerJudge]);

  useEffect(() => {
    startRef.current = performance.now();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const elapsed = now - startRef.current;
      // `while`, not `if`: if the tab was backgrounded and rAF paused,
      // several beats can go overdue at once and must all resolve in this
      // one catch-up frame rather than trickling out one per frame.
      while (
        roundRef.current < ROUNDS &&
        !resolvedRef.current &&
        elapsed > BEAT_TIMES[roundRef.current] + HIT_WINDOW.good
      ) {
        resolvedRef.current = true;
        registerJudge('miss');
      }

      const idx = roundRef.current;
      if (idx < ROUNDS) {
        const beatTime = BEAT_TIMES[idx];
        const scale = Math.max(0, Math.min(1, (beatTime - elapsed) / APPROACH_MS));
        setRingScale(scale);
      }
      if (roundRef.current < ROUNDS) {
        raf = requestAnimationFrame(tick);
      }
    }

    return () => cancelAnimationFrame(raf);
  }, [registerJudge]);

  const TARGET_SIZE = 64;
  const MAX_SIZE = 210;
  const approachSize = TARGET_SIZE + ringScale * (MAX_SIZE - TARGET_SIZE);

  return (
    <div className={`game-screen timing-rhythm scene-${scene}`} onPointerDown={handleTap}>
      <Hud
        items={[
          { label: 'BEAT', value: `${Math.min(beatIndex + 1, ROUNDS)}/${ROUNDS}` },
          { label: 'COMBO', value: `x${combo}` },
        ]}
      />

      <div className="rhythm-target-wrap">
        <div className="rhythm-ring-fixed" style={{ width: TARGET_SIZE, height: TARGET_SIZE }} />
        <div className="rhythm-ring-approach" style={{ width: approachSize, height: approachSize }} />
      </div>

      {status === 'playing' && <p className="hint">リングが重なった瞬間にタップ</p>}
      {lastJudge && status === 'playing' && (
        <div key={beatIndex}>
          {lastJudge === 'perfect' && <Impact variant="micro" />}
          <p className={`judge-flash judge-${lastJudge}`}>{LABEL[lastJudge]}</p>
        </div>
      )}

      {status === 'done' && (
        <div className="result-overlay">
          <Particles mode="burst" active color="#FFC53D" />
          <Impact />
          <h2>計測完了</h2>
          <p>スコア {finalScore}</p>
        </div>
      )}
    </div>
  );
}
