import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

// Connects a phone (controller) to the exhibit monitor (display) directly
// over WebRTC — no backend of our own, just PeerJS's free public signalling
// server to find each other. On the same venue Wi-Fi this stays low-latency
// enough for the display to mirror a game's motion smoothly.
//
// The display calls hostRoom() once and shows the returned room code as a
// QR; a phone that scans it calls joinRoom(code). Whichever side is
// "sending" game state calls send(data); the other side reads it from
// `latestState`. One instance of this context is shared by the whole app via
// <PeerLinkProvider>, mirroring the useTilt/useShake pattern.
const ROOM_PREFIX = 'ugokiiro-';

function usePeerLinkState() {
  const [role, setRole] = useState('idle'); // 'idle' | 'host' | 'client'
  const [roomId, setRoomId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [latestState, setLatestState] = useState(null);
  const peerRef = useRef(null);
  const connRef = useRef(null);

  const wireConnection = useCallback((conn) => {
    connRef.current = conn;
    conn.on('open', () => setConnected(true));
    conn.on('data', (data) => setLatestState(data));
    conn.on('close', () => {
      setConnected(false);
      connRef.current = null;
    });
  }, []);

  // `disconnected` fires when a peer loses its connection to PeerJS's
  // signalling server (e.g. the Wi-Fi hiccups) — the WebRTC connection to
  // the other side can survive that, but this peer won't be reachable by a
  // *new* connection until it reconnects. This is PeerJS's own documented
  // recovery call, not something it does automatically.
  const wireLifecycle = useCallback((peer) => {
    peer.on('disconnected', () => {
      if (!peer.destroyed) peer.reconnect();
    });
    peer.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[peer-link]', err.type, err.message);
    });
  }, []);

  const hostRoom = useCallback(() => {
    // Checking `.destroyed` (not just truthiness) matters in dev: React
    // StrictMode's double-invoke can destroy the first peer created here
    // before this same ref is checked again — a plain truthy check would
    // then permanently refuse to create a replacement.
    if (peerRef.current && !peerRef.current.destroyed) return;
    const code = Math.random().toString(36).slice(2, 7);
    const peer = new Peer(`${ROOM_PREFIX}${code}`);
    peerRef.current = peer;
    setRole('host');
    peer.on('open', () => setRoomId(code));
    peer.on('connection', wireConnection);
    wireLifecycle(peer);
  }, [wireConnection, wireLifecycle]);

  const joinRoom = useCallback(
    (code) => {
      if ((peerRef.current && !peerRef.current.destroyed) || !code) return;
      const peer = new Peer();
      peerRef.current = peer;
      setRole('client');
      peer.on('open', () => {
        const conn = peer.connect(`${ROOM_PREFIX}${code}`);
        wireConnection(conn);
      });
      wireLifecycle(peer);
    },
    [wireConnection, wireLifecycle]
  );

  const send = useCallback((data) => {
    if (connRef.current?.open) {
      connRef.current.send(data);
    }
  }, []);

  useEffect(
    () => () => {
      // In StrictMode's dev-only double-invoke, this cleanup runs once
      // immediately after the very first mount (before a real unmount).
      // Without nulling the refs here, hostRoom()/joinRoom()'s "already
      // have a peer" guard would see the now-destroyed peer as still
      // present and silently refuse to create a replacement — the room
      // would never actually open.
      peerRef.current?.destroy();
      peerRef.current = null;
      connRef.current = null;
    },
    []
  );

  return { role, roomId, connected, latestState, hostRoom, joinRoom, send };
}

const PeerLinkContext = createContext(null);

export function PeerLinkProvider({ children }) {
  const value = usePeerLinkState();
  return <PeerLinkContext.Provider value={value}>{children}</PeerLinkContext.Provider>;
}

export function usePeerLink() {
  const ctx = useContext(PeerLinkContext);
  if (!ctx) throw new Error('usePeerLink must be used within a <PeerLinkProvider>');
  return ctx;
}
