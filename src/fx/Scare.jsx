import { useEffect, useRef, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { playBoom } from './audio.js';
import { vibrateGrandImpact } from './haptics.js';

const DURATION_MS = { glitch: 750, blackout: 1100, eye: 2200, asset: 2600 };
const VIDEO_MAX_MS = 9000;
const BAR_COLORS = ['#ff1414', '#ffffff', '#00e5ff', '#ff1414', '#ffffff'];

function Eye() {
  return (
    <svg className="scare-eye" viewBox="0 0 300 200" aria-hidden="true">
      <g className="scare-eye-lid">
        <path d="M10 100 Q150 -10 290 100 Q150 210 10 100 Z" fill="#fff" />
        <circle cx="150" cy="100" r="46" fill="#ff1414" />
        <circle className="scare-eye-pupil" cx="150" cy="100" r="20" fill="#0b0b0f" />
        <path d="M30 100 L70 96 M270 100 L230 96 M60 70 L88 84 M240 70 L212 84" stroke="#ff1414" strokeWidth="2" />
      </g>
    </svg>
  );
}

function Glitch() {
  const [bars] = useState(() =>
    Array.from({ length: 9 }, (_, i) => ({
      top: `${Math.round(Math.random() * 92)}%`,
      height: `${4 + Math.round(Math.random() * 14)}%`,
      background: BAR_COLORS[i % BAR_COLORS.length],
      animationDelay: `${Math.round(Math.random() * 300)}ms`,
    }))
  );
  return (
    <>
      {bars.map((style, i) => (
        <span key={i} className="scare-bar" style={style} />
      ))}
    </>
  );
}

// A rare interruption between games. On the phone that is playing it
// (`passive` false) it makes a sound, buzzes, tells the display what to show,
// and calls onDone when it ends; on the display (`passive`) it just draws the
// same thing.
export default function Scare({ kind, asset, onDone, passive = false }) {
  const { send } = usePeerLink();
  const videoRef = useRef(null);

  useEffect(() => {
    if (passive) return undefined;
    playBoom();
    vibrateGrandImpact();
    send({ type: 'scare', kind, assetId: asset?.id ?? null });

    const finish = () => {
      send({ type: 'scareEnd' });
      onDone?.();
    };
    const video = videoRef.current;
    if (video) {
      // Try with sound (the player has already tapped the page); if the
      // browser refuses, play it muted rather than not at all.
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
      video.addEventListener('ended', finish, { once: true });
      const cap = setTimeout(finish, VIDEO_MAX_MS);
      return () => {
        clearTimeout(cap);
        video.removeEventListener('ended', finish);
      };
    }
    const timer = setTimeout(finish, DURATION_MS[kind] ?? 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`scare-screen scare-kind-${kind}`}>
      {kind === 'glitch' && <Glitch />}
      {kind === 'blackout' && <span className="scare-dot" />}
      {kind === 'eye' && <Eye />}
      {kind === 'asset' && asset?.isVideo && (
        <video
          ref={videoRef}
          className="scare-media"
          src={asset.src}
          playsInline
          muted={passive}
          loop={passive}
          autoPlay={passive}
        />
      )}
      {kind === 'asset' && asset && !asset.isVideo && <img className="scare-media" src={asset.src} alt="" />}
    </div>
  );
}
