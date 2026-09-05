import { useCallback, useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playChime, playTick } from '../fx/audio.js';
import PolyClapVisual from './PolyClapVisual.jsx';

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
  return { beats, index: 0, resolved: false, comboStreak: 0, raw: 0, tickIndex: 0 };
}

// How close `elapsed` is to this side's next scheduled beat, as 0 (just
// passed a beat) to 1 (a beat is landing right now) — drives the shrinking
// "beat ring" so the correct tempo is visible before the player has heard
// or tapped a single beat, not just inferred from the written instruction.
function beatPhase(state, elapsed) {
  const prevBeat = state.tickIndex > 0 ? state.beats[state.tickIndex - 1] : 0;
  const nextBeat = state.beats[state.tickIndex] ?? state.beats[state.beats.length - 1];
  const span = nextBeat - prevBeat;
  return span > 0 ? Math.min(1, Math.max(0, (elapsed - prevBeat) / span)) : 1;
}

export default function PolyClap({ onFinish, scene }) {
  const { send } = usePeerLink();
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [leftCombo, setLeftCombo] = useState(0);
  const [rightCombo, setRightCombo] = useState(0);
  const [leftFlash, setLeftFlash] = useState(null);
  const [rightFlash, setRightFlash] = useState(null);
  const [leftPhase, setLeftPhase] = useState(0);
  const [rightPhase, setRightPhase] = useState(0);
  const [status, setStatus] = useState('playing');
  const [finalScore, setFinalScore] = useState(0);

  const startRef = useRef(0);
  const leftRef = useRef(createSide(LEFT_BEATS));
  const rightRef = useRef(createSide(RIGHT_BEATS));
  const finishedRef = useRef(false);
  const leftFlashRef = useRef(null);
  const rightFlashRef = useRef(null);
  const finalScoreRef = useRef(0);

  const maybeFinish = useCallback(() => {
    if (finishedRef.current) return;
    if (leftRef.current.index >= LEFT_BEATS.length && rightRef.current.index >= RIGHT_BEATS.length) {
      finishedRef.current = true;
      const leftScore = leftRef.current.raw / LEFT_MAX_RAW;
      const rightScore = rightRef.current.raw / RIGHT_MAX_RAW;
      const score = Math.round(((leftScore + rightScore) / 2) * 100);
      finalScoreRef.current = score;
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
        leftFlashRef.current = judge;
        setLeftCombo(state.comboStreak);
        setLeftFlash(judge);
      } else {
        rightFlashRef.current = judge;
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
        // Guide ticks play on schedule regardless of whether the player
        // hits, misses, or hasn't tapped yet — the metronome the written
        // instruction alone couldn't convey.
        while (state.tickIndex < state.beats.length && elapsed >= state.beats[state.tickIndex]) {
          playTick(side);
          state.tickIndex += 1;
        }
        while (state.index < state.beats.length && !state.resolved && elapsed > state.beats[state.index] + HIT_WINDOW.good) {
          state.resolved = true;
          registerJudge(side, 'miss');
        }
      }
      const leftPhaseNow = beatPhase(leftRef.current, elapsed);
      const rightPhaseNow = beatPhase(rightRef.current, elapsed);
      setLeftPhase(leftPhaseNow);
      setRightPhase(rightPhaseNow);

      send({
        type: 'polyClap',
        scene,
        timeLeft: remaining,
        durationMs: DURATION_MS,
        leadInMs: LEAD_IN_MS,
        leftCombo: leftRef.current.comboStreak,
        rightCombo: rightRef.current.comboStreak,
        leftFlash: leftFlashRef.current,
        rightFlash: rightFlashRef.current,
        leftPhase: leftPhaseNow,
        rightPhase: rightPhaseNow,
        status: finishedRef.current ? 'done' : 'playing',
        finalScore: finalScoreRef.current,
      });

      if (remaining <= 0) {
        maybeFinish();
        return;
      }
      if (!finishedRef.current) raf = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(raf);
  }, [registerJudge, maybeFinish, scene, send]);

  return (
    <PolyClapVisual
      scene={scene}
      timeLeft={timeLeft}
      durationMs={DURATION_MS}
      leadInMs={LEAD_IN_MS}
      leftCombo={leftCombo}
      rightCombo={rightCombo}
      leftFlash={leftFlash}
      rightFlash={rightFlash}
      leftPhase={leftPhase}
      rightPhase={rightPhase}
      status={status}
      finalScore={finalScore}
      onLeftTap={() => handleTap('left')}
      onRightTap={() => handleTap('right')}
    />
  );
}
