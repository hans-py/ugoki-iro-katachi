import { useEffect, useState } from 'react';
import { POOL, STILL_THRESHOLD, getProgress, pickStill, recordSeen } from '../data/stills.js';
import ShareButtons from './ShareButtons.jsx';

// What a finished session earns on the phone that played it: a random still
// if the total reached STILL_THRESHOLD, otherwise a locked silhouette showing
// how far off it was. Which stills a phone has found is remembered on that
// phone, so replaying keeps turning up new ones until the set is complete.
export default function ResultStill({ total, title }) {
  const earned = total >= STILL_THRESHOLD;
  const [draw] = useState(() => (earned ? pickStill() : null));

  useEffect(() => {
    if (draw) recordSeen(draw.still.id);
  }, [draw]);

  if (!earned) {
    return (
      <figure className="still-card">
        <div className="still-frame still-locked">
          <span className="still-lock-mark">?</span>
          <span className="still-scan" />
        </div>
        <p className="still-count">あと {STILL_THRESHOLD - total} 点で、見られる</p>
        <ShareButtons info={{ title, total, seenCount: getProgress().count, stillTotal: POOL.length, stillSrc: null }} />
      </figure>
    );
  }

  if (!draw) return null;
  const { still, isNew, isFinal, seenCount, total: poolTotal, complete } = draw;

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
      <p className="still-count">{complete ? 'COMPLETE' : `${seenCount} / ${poolTotal}`}</p>
      <ShareButtons
        info={{ title, total, seenCount, stillTotal: poolTotal, stillSrc: still.isVideo ? null : still.src }}
      />
    </figure>
  );
}
