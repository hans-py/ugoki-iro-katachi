import { useEffect } from 'react';

const FLASH_MS = 700;

// A quick punchy beat between the instruction card and the game itself —
// the "3, 2, 1, GO" of a WarioWare-style microgame, compressed to one flash
// so 5 rounds in a row don't feel like they're dragging.
export default function GoFlash({ scene, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, FLASH_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`go-flash-screen scene-${scene}`}>
      <span className="go-flash-text">GO!</span>
    </div>
  );
}
