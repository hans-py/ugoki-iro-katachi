import { useEffect } from 'react';
import Impact from '../fx/Impact.jsx';

const FLASH_MS = 700;

// A quick punchy beat between the instruction card and the game itself —
// the "3, 2, 1, GO" of a WarioWare-style microgame, compressed to one flash
// so 5 rounds in a row don't feel like they're dragging. Deliberately the
// loudest, sharpest moment in the between-rounds sequence — a hard cut out
// of Instruction's slow ambient drift, into the game's own instant
// judge-flashes — reusing the same geometric burst a successful play gets,
// so "something is about to happen" reads with the same visual language as
// "something just happened."
export default function GoFlash({ scene, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, FLASH_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`go-flash-screen scene-${scene}`}>
      <span className="go-flash-frame" />
      <Impact variant="grand" />
      <span className="go-flash-text">GO!</span>
    </div>
  );
}
