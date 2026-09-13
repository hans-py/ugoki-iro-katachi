import * as Tone from 'tone';

let started = false;
let boomSynth;
let chimeSynth;

// Must be called from within a user-gesture event handler (Start screen
// button click) — browsers refuse to start an AudioContext otherwise.
export async function initAudio() {
  if (started) return;
  await Tone.start();
  started = true;
}

export function playBoom() {
  if (!started) return;
  if (!boomSynth) {
    boomSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0 },
    }).toDestination();
  }
  boomSynth.triggerAttackRelease(0.35);
}

export function playChime() {
  if (!started) return;
  if (!chimeSynth) {
    chimeSynth = new Tone.PolySynth(Tone.Synth, {
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
    }).toDestination();
  }
  chimeSynth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n');
}

let motionSynth;

function ensureMotionSynth() {
  if (!motionSynth) {
    motionSynth = new Tone.Oscillator({ type: 'sine', frequency: 220 }).toDestination();
    motionSynth.volume.value = -60;
    motionSynth.start();
  }
  return motionSynth;
}

// The "動きを音にする" layer: one continuous tone whose pitch and volume
// track how hard the player is tilting/turning the phone right now, called
// every animation frame while a motion-driven game is playing. Created once
// and left running near-silent rather than started/stopped per round —
// Tone requires each start() to have a strictly later timestamp than the
// last, and a game's own rAF loop can't guarantee that across quick
// mount/unmount cycles (see playTick's same issue above).
export function startMotionTone() {
  if (!started) return;
  ensureMotionSynth();
}

export function updateMotionTone(magnitude) {
  if (!started || !motionSynth) return;
  const m = Math.min(1, Math.max(0, magnitude));
  motionSynth.frequency.rampTo(220 + m * 380, 0.05);
  // Floors to true silence at rest instead of just "quiet" — this is the
  // contrast half of the design: no motion, no sound at all.
  motionSynth.volume.rampTo(m < 0.02 ? -60 : -46 + m * 30, 0.08);
}

export function stopMotionTone() {
  if (!motionSynth) return;
  motionSynth.volume.rampTo(-60, 0.2);
}

let leftTickSynth;
let rightTickSynth;
let leftNextTickTime = 0;
let rightNextTickTime = 0;

// A quiet metronome guide for polyrhythm-style games — one low, one high
// pitch per side, so each hand's own tempo is audible (not just visible)
// regardless of whether the player's tap landed on the beat.
export function playTick(side) {
  if (!started) return;
  const now = Tone.now();
  if (side === 'left') {
    if (!leftTickSynth) {
      leftTickSynth = new Tone.MembraneSynth({ envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).toDestination();
      leftTickSynth.volume.value = -12;
    }
    // Tone requires each trigger's time to be strictly later than the
    // synth's previous one — a caller catching up on several overdue beats
    // in one animation frame would otherwise call this with the same
    // Tone.now() twice and throw. Nudge forward instead of relying on the
    // clock to have visibly advanced between calls.
    const time = Math.max(now, leftNextTickTime + 0.001);
    leftTickSynth.triggerAttackRelease('C2', '32n', time);
    leftNextTickTime = time;
  } else {
    if (!rightTickSynth) {
      rightTickSynth = new Tone.MembraneSynth({ envelope: { attack: 0.001, decay: 0.08, sustain: 0 } }).toDestination();
      rightTickSynth.volume.value = -16;
    }
    const time = Math.max(now, rightNextTickTime + 0.001);
    rightTickSynth.triggerAttackRelease('G3', '32n', time);
    rightNextTickTime = time;
  }
}
