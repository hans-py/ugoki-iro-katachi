import { useEffect, useState } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import QrCode from '../fx/QrCode.jsx';
import { DISPLAY_VIEWS } from '../games/gameRegistry.js';
import DuoDisplay from './display/DuoDisplay.jsx';
import { SLOTS } from '../data/slots.js';

// The exhibit monitor screen. Idle, it plays on its own loop (see
// .scene-cycle / .display-ambient in index.css) with a QR code for pairing.
// Once a phone connects and starts sending game state, it switches to
// mirroring that phone's game live instead. If a *second* phone joins (二人
// で遊ぶ), it switches again to a permanent split-screen layout for the rest
// of this room's life — even if one player's connection later hiccups, the
// display shouldn't flicker back to the single-player layout mid-match.
const START_DELAY_MS = 2500;
const MODE_KEY = 'ugoki-room-mode';
// What a phone that scans this display's QR will play. Chosen here, by
// whoever runs the exhibit, so a visitor only has to scan and tap start.
const MODES = [
  { id: 'battle', label: 'みんなで対戦', caption: '2〜4人で対戦できます' },
  { id: 'match', label: 'みんなでマッチ度診断', caption: '2〜4人でマッチ度診断ができます' },
  { id: 'solo', label: '一人で遊ぶ', caption: '一人で遊べます' },
];

function readMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return MODES.some((m) => m.id === saved) ? saved : 'battle';
  } catch {
    return 'battle';
  }
}

export default function Display() {
  const { hostRoom, roomId, connected, latestState, peerStates, connectedSlots, broadcast, lockRoom, setHostMode } = usePeerLink();
  // Every slot that has connected during this room's life, in slot order —
  // the duo layout keeps a panel for each even if that phone later drops.
  const [activeSlots, setActiveSlots] = useState([]);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState(readMode);

  useEffect(() => {
    setHostMode(mode);
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // storage blocked — the switch just won't be remembered
    }
  }, [mode, setHostMode]);

  // One player per room in solo mode: lock it once that phone is in, so a
  // second scan can't turn the display into the split layout.
  useEffect(() => {
    if (mode === 'solo' && connected) lockRoom();
  }, [mode, connected, lockRoom]);

  useEffect(() => {
    hostRoom();
  }, [hostRoom]);

  useEffect(() => {
    const now = SLOTS.filter((s) => connectedSlots[s]);
    if (now.length === 0) {
      // Everyone has left (each phone calls leaveRoom() after its own
      // result) — this room is free for a fresh group, back to idle/QR.
      setActiveSlots((prev) => (prev.length === 0 ? prev : []));
      setStarted(false);
      return;
    }
    setActiveSlots((prev) => {
      const merged = SLOTS.filter((s) => prev.includes(s) || now.includes(s));
      return merged.length === prev.length ? prev : merged;
    });
  }, [connectedSlots]);

  const isDuo = activeSlots.length >= 2;

  // Neither phone can see the others' "ready" taps — only the host they're
  // all connected to can. Once everyone connected (at least two) is ready,
  // wait a beat before starting: a latecomer joining in that window resets
  // the gate (they aren't ready yet), so the group isn't started without
  // them. Starting also locks the room against joiners mid-game.
  const connectedList = SLOTS.filter((s) => connectedSlots[s]);
  const allReady = connectedList.length >= 2 && connectedList.every((s) => peerStates[s]?.type === 'duoReady');
  useEffect(() => {
    if (started || !allReady) return undefined;
    const timer = setTimeout(() => {
      broadcast({ type: 'duoStart' });
      lockRoom();
      setStarted(true);
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [allReady, started, broadcast, lockRoom]);

  // A solo game in progress shouldn't be joined by someone else's scan.
  const soloPlaying = !isDuo && Boolean(latestState && DISPLAY_VIEWS[latestState.type]);
  useEffect(() => {
    if (soloPlaying) lockRoom();
  }, [soloPlaying, lockRoom]);

  // BASE_URL carries the GitHub Pages subpath (e.g. /ugoki-iro-katachi/) in
  // production and is just "/" in dev — window.location.origin alone would
  // silently drop that subpath and point the QR at a 404.
  const joinUrl = roomId ? `${window.location.origin}${import.meta.env.BASE_URL}?room=${roomId}` : null;

  if (isDuo) {
    return (
      <DuoDisplay
        roomId={roomId}
        peerStates={peerStates}
        connectedSlots={connectedSlots}
        activeSlots={activeSlots}
        started={started}
        allReady={allReady}
        joinUrl={joinUrl}
      />
    );
  }

  const ActiveView = latestState && DISPLAY_VIEWS[latestState.type];

  if (connected && ActiveView) {
    return <ActiveView state={latestState} />;
  }


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
      {connected && <p className="eyebrow">つながりました</p>}
      <h1>うごき、いろ、かたち。</h1>
      <div className="qr-frame">
        {joinUrl ? <QrCode value={joinUrl} size={420} /> : <p className="qr-placeholder">起動中…</p>}
      </div>
      <p className="lead">スマホのカメラで読み取ってください</p>
      <p className="mode-caption">{MODES.find((m) => m.id === mode).caption}</p>
      {roomId && <p className="room-code">code: {roomId}</p>}
      {!connected && (
        <div className="mode-switch" role="group" aria-label="遊び方の切り替え">
          {MODES.map((m) => (
            <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
