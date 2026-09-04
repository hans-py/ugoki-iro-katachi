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
