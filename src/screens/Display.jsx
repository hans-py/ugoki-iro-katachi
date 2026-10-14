import { useEffect, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import QrCode from '../fx/QrCode.jsx';
import { DISPLAY_VIEWS } from '../games/gameRegistry.js';
import DuoDisplay from './display/DuoDisplay.jsx';

// The exhibit monitor screen. Idle, it plays on its own loop (see
// .scene-cycle / .display-ambient in index.css) with a QR code for pairing.
// Once a phone connects and starts sending game state, it switches to
// mirroring that phone's game live instead. If a *second* phone joins (二人
// で遊ぶ), it switches again to a permanent split-screen layout for the rest
// of this room's life — even if one player's connection later hiccups, the
// display shouldn't flicker back to the single-player layout mid-match.
export default function Display() {
  const { hostRoom, roomId, connected, latestState, peerStates, connectedSlots, broadcast } = usePeerLink();
  const [isDuo, setIsDuo] = useState(false);

  useEffect(() => {
    hostRoom();
  }, [hostRoom]);

  useEffect(() => {
    if (connectedSlots.B) setIsDuo(true);
  }, [connectedSlots.B]);

  // Once the match is over and both players have walked away (each phone
  // calls leaveRoom() after showing its own result), this room is free for
  // a completely fresh pair — go back to the plain idle/QR screen instead
  // of staying stuck on stale split-screen state forever.
  useEffect(() => {
    if (isDuo && !connectedSlots.A && !connectedSlots.B) setIsDuo(false);
  }, [isDuo, connectedSlots.A, connectedSlots.B]);

  // Neither phone can see the other's "ready" tap directly — only the host
  // they're both connected to can. The instant both report ready, tell both
  // to go at once. A harmless no-op to re-fire if this ever runs again
  // while both happen to still read 'duoReady' (the client ignores a
  // duoStart it isn't waiting for).
  useEffect(() => {
    if (peerStates.A?.type === 'duoReady' && peerStates.B?.type === 'duoReady') {
      broadcast({ type: 'duoStart' });
    }
  }, [peerStates.A, peerStates.B, broadcast]);

  if (isDuo) {
    return <DuoDisplay roomId={roomId} peerStates={peerStates} connectedSlots={connectedSlots} />;
  }

  const ActiveView = latestState && DISPLAY_VIEWS[latestState.type];

  if (connected && ActiveView) {
    return <ActiveView state={latestState} />;
  }

  // BASE_URL carries the GitHub Pages subpath (e.g. /ugoki-iro-katachi/) in
  // production and is just "/" in dev — window.location.origin alone would
  // silently drop that subpath and point the QR at a 404.
  const joinUrl = roomId ? `${window.location.origin}${import.meta.env.BASE_URL}?room=${roomId}` : null;

  return (
    <div className="screen display-screen scene-cycle">
      <div className="display-ambient">
        <span className="ambient-shape ambient-tri" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-bar" />
        <span className="ambient-shape ambient-square" />
        <span className="ambient-shape ambient-tri ambient-tri-2" />
        <span className="ambient-shape ambient-circle ambient-circle-2" />
        <span className="ambient-shape ambient-bar ambient-bar-2" />
        <span className="ambient-shape ambient-square ambient-square-2" />
      </div>
      <p className="eyebrow">{connected ? 'connected — waiting to start' : 'scan to play'}</p>
      <h1>うごき、いろ、かたち。</h1>
      <div className="qr-frame">
        {joinUrl ? <QrCode value={joinUrl} size={420} /> : <p className="qr-placeholder">起動中…</p>}
      </div>
      <p className="lead">スマホで読み取ってください</p>
      {roomId && <p className="room-code">code: {roomId}</p>}
    </div>
  );
}
