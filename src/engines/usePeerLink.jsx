import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

// Connects phones (controllers) to the exhibit monitor (display) directly
// over WebRTC — no backend of our own, just PeerJS's free public signalling
// server to find each other. On the same venue Wi-Fi this stays low-latency
// enough for the display to mirror a game's motion smoothly.
//
// The display calls hostRoom() once and shows the returned room code as a
// QR; a phone that scans it calls joinRoom(code). Whichever side is
// "sending" game state calls send(data); the other side reads it from
// `latestState`. One instance of this context is shared by the whole app via
// <PeerLinkProvider>, mirroring the useTilt/useShake pattern.
//
// A room now accepts up to two phones at once (for 二人で遊ぶ) — the host
// assigns whichever connects first slot 'A' and a second one slot 'B',
// tracked in `peerStates`/`connectedSlots`. Solo play only ever fills slot
// A, so `latestState`/`connected` mirror slot A exactly as before — existing
// solo-only code (Display's idle/QR branch, every game's `send()` call)
// keeps working unmodified.
const ROOM_PREFIX = 'ugokiiro-';
const SLOT_MSG = '__peerlink_slot__';

function usePeerLinkState() {
  const [role, setRole] = useState('idle'); // 'idle' | 'host' | 'client'
  const [roomId, setRoomId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [latestState, setLatestState] = useState(null);
  const [mySlot, setMySlot] = useState(null);
  const [hostMessage, setHostMessage] = useState(null);
  const [peerStates, setPeerStates] = useState({ A: null, B: null });
  const [connectedSlots, setConnectedSlots] = useState({ A: false, B: false });

  const peerRef = useRef(null);
  const connRef = useRef(null); // client's own single connection to the host
  const hostConnsRef = useRef(new Map()); // host: peerId -> { conn, slot }
  const slotsTakenRef = useRef({ A: false, B: false });

  const wireClientConnection = useCallback((conn) => {
    connRef.current = conn;
    conn.on('open', () => setConnected(true));
    conn.on('data', (data) => {
      if (data && data.__peerLink === SLOT_MSG) {
        setMySlot(data.slot);
        return;
      }
      // Everything else the host sends down (e.g. "both players are ready,
      // go") is app-level, not game state a phone would ever mirror itself
      // — kept separate from `latestState` so it stays unambiguous which
      // channel a given message came in on.
      setHostMessage(data);
    });
    conn.on('close', () => {
      setConnected(false);
      connRef.current = null;
    });
  }, []);

  const wireHostConnection = useCallback((conn) => {
    let slot = null;
    if (!slotsTakenRef.current.A) slot = 'A';
    else if (!slotsTakenRef.current.B) slot = 'B';
    if (!slot) {
      // Room already has two players — a third scan is politely refused
      // rather than silently overwriting one of the active slots.
      conn.on('open', () => conn.close());
      return;
    }
    slotsTakenRef.current[slot] = true;
    hostConnsRef.current.set(conn.peer, { conn, slot });

    conn.on('open', () => {
      setConnectedSlots((prev) => ({ ...prev, [slot]: true }));
      setConnected(true);
      conn.send({ __peerLink: SLOT_MSG, slot });
    });
    conn.on('data', (data) => {
      setPeerStates((prev) => ({ ...prev, [slot]: data }));
      if (slot === 'A') setLatestState(data);
    });
    conn.on('close', () => {
      hostConnsRef.current.delete(conn.peer);
      slotsTakenRef.current[slot] = false;
      setConnectedSlots((prev) => ({ ...prev, [slot]: false }));
      setPeerStates((prev) => ({ ...prev, [slot]: null }));
      if (slot === 'A') setLatestState(null);
      setConnected(hostConnsRef.current.size > 0);
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
    peer.on('connection', wireHostConnection);
    wireLifecycle(peer);
  }, [wireHostConnection, wireLifecycle]);

  const joinRoom = useCallback(
    (code) => {
      if ((peerRef.current && !peerRef.current.destroyed) || !code) return;
      const peer = new Peer();
      peerRef.current = peer;
      setRole('client');
      setRoomId(code);
      peer.on('open', () => {
        const conn = peer.connect(`${ROOM_PREFIX}${code}`);
        wireClientConnection(conn);
      });
      wireLifecycle(peer);
    },
    [wireClientConnection, wireLifecycle]
  );

  // Lets a phone walk away from a finished duo session and become a fresh,
  // unpaired peer again — without this, `joinRoom`'s "already have a peer"
  // guard would refuse to ever connect that phone to anything again for the
  // rest of the page's life, and the host would keep this player's slot
  // occupied forever.
  const leaveRoom = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    hostConnsRef.current.clear();
    slotsTakenRef.current = { A: false, B: false };
    setRole('idle');
    setRoomId(null);
    setConnected(false);
    setLatestState(null);
    setMySlot(null);
    setHostMessage(null);
    setPeerStates({ A: null, B: null });
    setConnectedSlots({ A: false, B: false });
  }, []);

  const send = useCallback((data) => {
    if (connRef.current?.open) {
      connRef.current.send(data);
    }
  }, []);

  // Host-only: the reverse direction of `send` — e.g. telling both duo
  // players "you're both ready, go" the instant the second one confirms,
  // since neither phone can otherwise know what the other is doing.
  const broadcast = useCallback((data) => {
    for (const { conn } of hostConnsRef.current.values()) {
      if (conn.open) conn.send(data);
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
      hostConnsRef.current.clear();
      slotsTakenRef.current = { A: false, B: false };
    },
    []
  );

  return {
    role,
    roomId,
    connected,
    latestState,
    mySlot,
    hostMessage,
    peerStates,
    connectedSlots,
    hostRoom,
    joinRoom,
    leaveRoom,
    send,
    broadcast,
  };
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
