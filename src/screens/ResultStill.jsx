import { useEffect, useState } from 'react';
import { pickStill, recordSeen } from '../data/stills.js';

// A random still shown at the end of a session, on the phone that played it.
// Which stills a phone has found is remembered on that phone, so replaying
// keeps turning up new ones until the set is complete.
export default function ResultStill() {
  const [draw] = useState(() => pickStill());

  useEffect(() => {
    if (draw) recordSeen(draw.still.id);
  }, [draw]);

  if (!draw) return null;
  const { still, isNew, isFinal, seenCount, total, complete } = draw;

  return (
    <figure className="still-card">
      <div className="still-frame">
        {still.isVideo ? (
          <video src={still.src} autoPlay loop muted playsInline />
        ) : (
          <img src={still.src} alt="" />
        )}
        <span className="still-scan" />
        {(isNew || isFinal) && <span className="still-new">{isFinal ? 'FINAL' : 'NEW'}</span>}
      </div>
      {still.caption && <figcaption className="still-caption">{still.caption}</figcaption>}
      <p className="still-count">
        {complete ? 'COMPLETE' : `${seenCount} / ${total}`}
      </p>
    </figure>
  );
}
