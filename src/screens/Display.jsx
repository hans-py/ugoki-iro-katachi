import { useEffect } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import QrCode from '../fx/QrCode.jsx';
import TiltFillView from '../games/display/TiltFillView.jsx';
import ResultView from './display/ResultView.jsx';

// Games that know how to render themselves on the display from a phone's
// broadcast state. Not every game has been converted yet — anything without
// an entry here just falls back to the idle loop while that phone plays
// locally on its own screen.
const DISPLAY_VIEWS = {
  tiltFill: TiltFillView,
  result: ResultView,
};

// The exhibit monitor screen. Idle, it plays on its own loop (see
// .scene-cycle / .display-ambient in index.css) with a QR code for pairing.
// Once a phone connects and starts sending game state, it switches to
// mirroring that phone's game live instead.
export default function Display() {
  const { hostRoom, roomId, connected, latestState } = usePeerLink();

  useEffect(() => {
    hostRoom();
  }, [hostRoom]);

  const ActiveView = latestState && DISPLAY_VIEWS[latestState.type];

  if (connected && ActiveView) {
    return <ActiveView state={latestState} />;
  }

  const joinUrl = roomId ? `${window.location.origin}/?room=${roomId}` : null;

  return (
    <div className="screen display-screen scene-cycle">
      <div className="display-ambient">
        <span className="ambient-shape ambient-tri" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-bar" />
        <span className="ambient-shape ambient-square" />
        <span className="ambient-shape ambient-tri ambient-tri-2" />
      </div>
      <p className="eyebrow">{connected ? 'connected — waiting to start' : 'scan to play'}</p>
      <h1>うごき、いろ、かたち。</h1>
      <div className="qr-frame">{joinUrl ? <QrCode value={joinUrl} size={220} /> : <p className="qr-placeholder">起動中…</p>}</div>
      <p className="lead">スマホで読み取ってください</p>
      {roomId && <p className="room-code">code: {roomId}</p>}
    </div>
  );
}
