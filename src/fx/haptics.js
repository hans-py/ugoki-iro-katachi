// The "点" of the sound design: a vibration only at the two loudest moments
// (the GO! flash, and a session's final grand reveal) — everywhere else stays
// silent so these two actually land as a physical hit rather than noise.
// navigator.vibrate is unsupported on iOS Safari; it's simply absent there,
// not broken, so every caller degrades to "no vibration" with no branching
// needed at the call site.
function vibrate(pattern) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}

export function vibrateImpact() {
  vibrate(40);
}

export function vibrateGrandImpact() {
  vibrate([30, 60, 90]);
}
