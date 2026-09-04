import { useCallback, useEffect, useRef, useState } from 'react';
import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import { playChime } from '../fx/audio.js';
import Hud from '../screens/Hud.jsx';

// A real 2-against-3 polyrhythm: the left hand's beat falls every 800ms
// (2 per measure) while the right hand's falls every ~533ms (3 per measure)
// — the two only line up once per measure, so each hand must hold its own
// independent tempo.
const LEAD_IN_MS = 800;
const MEASURE_MS = 1600;
const MEASURES = 3;
const LEFT_INTERVAL = MEASURE_MS / 2;
const RIGHT_INTERVAL = MEASURE_MS / 3;
const HIT_WINDOW = { perfect: 90, good: 200 };
const BASE_POINTS = { perfect: 100, good: 60, miss: 0 };
const COMBO_CAP = 3;

function buildBeatTimes(interval) {
  const times = [];
  const total = MEASURES * MEASURE_MS;
  for (let t = 0; t <= total - interval / 2; t += interval) {
    times.push(LEAD_IN_MS + Math.round(t));
  }
  return times;
}

const LEFT_BEATS = buildBeatTimes(LEFT_INTERVAL);
const RIGHT_BEATS = buildBeatTimes(RIGHT_INTERVAL);
const DURATION_MS = LEAD_IN_MS + MEASURES * MEASURE_MS + HIT_WINDOW.good + 200;

function maxRawFor(beats) {
  let streak = 0;
  let total = 0;
  for (let i = 0; i < beats.length; i += 1) {
    total += BASE_POINTS.perfect * Math.min(1 + streak, COMBO_CAP);
    streak += 1;
  }
  return total;
}
const LEFT_MAX_RAW = maxRawFor(LEFT_BEATS);
const RIGHT_MAX_RAW = maxRawFor(RIGHT_BEATS);

function createSide(beats) {
  return { beats, index: 0, resolved: false, comboStreak: 0, raw: 0 };
}

export default function PolyClap({ onFinish, scene }) {
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [leftCombo, setLeftCombo] = useState(0);
  const [rightCombo, setRightCombo] = useState(0);
  const [leftFlash, setLeftFlash] = useState(null);
  const [rightFlash, setRightFlash] = useState(null);
  const [status, setStatus] = useState('playing');
  const [finalScore, setFinalScore] = useState(0);

  const startRef = useRef(0);
  const leftRef = useRef(createSide(LEFT_BEATS));
  const rightRef = useRef(createSide(RIGHT_BEATS));
  const finishedRef = useRef(false);

  const maybeFinish = useCallback(() => {
    if (finishedRef.current) return;
    if (leftRef.current.index >= LEFT_BEATS.length && rightRef.current.index >= RIGHT_BEATS.length) {
      finishedRef.current = true;
      const leftScore = leftRef.current.raw / LEFT_MAX_RAW;
      const rightScore = rightRef.current.raw / RIGHT_MAX_RAW;
      const score = Math.round(((leftScore + rightScore) / 2) * 100);
      setFinalScore(score);
      setStatus('done');
      onFinish?.({ score });
    }
  }, [onFinish]);

  const registerJudge = useCallback(
    (side, judge) => {
      const state = side === 'left' ? leftRef.current : rightRef.current;
      const multiplier = judge === 'miss' ? 1 : Math.min(1 + state.comboStreak, COMBO_CAP);
      state.raw += BASE_POINTS[judge] * multiplier;
      state.comboStreak = judge === 'miss' ? 0 : state.comboStreak + 1;
      state.index += 1;
      state.resolved = false;

      if (side === 'left') {
        setLeftCombo(state.comboStreak);
        setLeftFlash(judge);
      } else {
        setRightCombo(state.comboStreak);
        setRightFlash(judge);
      }
      if (judge !== 'miss') playChime();
      maybeFinish();
    },
    [maybeFinish]
  );

  const handleTap = useCallback(
    (side) => {
      if (status !== 'playing') return;
      const state = side === 'left' ? leftRef.current : rightRef.current;
      if (state.resolved || state.index >= state.beats.length) return;
      state.resolved = true;
      const elapsed = performance.now() - startRef.current;
      const diff = Math.abs(elapsed - state.beats[state.index]);
      const judge = diff <= HIT_WINDOW.perfect ? 'perfect' : diff <= HIT_WINDOW.good ? 'good' : 'miss';
      registerJudge(side, judge);
    },
    [status, registerJudge]
  );

  useEffect(() => {
    startRef.current = performance.now();
    let raf = requestAnimationFrame(tick);

    function tick(now) {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(remaining);

      // A `while` here (not `if`) matters: if the tab was backgrounded and
      // rAF paused, many beats on a side can go overdue at once, and they
      // all need to resolve in this single catch-up frame rather than
      // trickling out one per frame.
      for (const [side, ref] of [
        ['left', leftRef],
        ['right', rightRef],
      ]) {
        const state = ref.current;
        while (state.index < state.beats.length && !state.resolved && elapsed > state.beats[state.index] + HIT_WINDOW.good) {
          state.resolved = true;
          registerJudge(side, 'miss');
        }
      }

      if (remaining <= 0) {
        maybeFinish();
        return;
      }
      if (!finishedRef.current) raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
  }, [registerJudge, maybeFinish]);

  return (
    <div className={`game-screen poly-clap scene-${scene}`}>
      <Hud
        items={[
          { label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` },
          { label: 'L', value: `x${leftCombo}` },
          { label: 'R', value: `x${rightCombo}` },
        ]}
      />

      <div className="poly-clap-zones">
        <div
          className={`poly-clap-zone poly-clap-left ${leftFlash ? `flash-${leftFlash}` : ''}`}
          onPointerDown={() => handleTap('left')}
        >
          <span>L・2拍子</span>
        </div>
        <div
          className={`poly-clap-zone poly-clap-right ${rightFlash ? `flash-${rightFlash}` : ''}`}
          onPointerDown={() => handleTap('right')}
        >
          <span>R・3拍子</span>
        </div>
      </div>

      {status === 'playing' && <p className="hint">左手は2拍子、右手は3拍子。両方同時にキープ</p>}

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
