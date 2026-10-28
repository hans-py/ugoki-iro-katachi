import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { SLOTS, slotMap } from '../data/slots.js';

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
// A room accepts up to four phones at once (みんなで遊ぶ) — the host assigns
// each new connection the first free slot (A, B, C, D), tracked in
// `peerStates`/`connectedSlots`. Solo play only ever fills slot A, so
// `latestState`/`connected` mirror slot A exactly as before — existing
// solo-only code (Display's idle/QR branch, every game's `send()` call)
// keeps working unmodified. Once a round has started the host can lock the
// room so a latecomer can't join mid-game.
const ROOM_PREFIX = 'ugokiiro-';
const SLOT_MSG = '__peerlink_slot__';
const REFUSE_MSG = '__peerlink_refused__';
// A phone that gets no answer from the room within this long gives up and
// says so, instead of waiting forever.
const JOIN_TIMEOUT_MS = 12000;
// How often the display checks that its room is still reachable, and quietly
// repairs it if not.
const WATCHDOG_MS = 4000;
// Errors that mean this room cannot be reached any more (as opposed to one
// phone's connection hiccuping) — the display should start a fresh room.
const FATAL_HOST_ERRORS = ['network', 'server-error', 'socket-error', 'socket-closed', 'unavailable-id', 'invalid-id'];

function usePeerLinkState() {
  const [role, setRole] = useState('idle'); // 'idle' | 'host' | 'client'
  const [roomId, setRoomId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [latestState, setLatestState] = useState(null);
  const [mySlot, setMySlot] = useState(null);
  const [hostMessage, setHostMessage] = useState(null);
  const [peerStates, setPeerStates] = useState(() => slotMap(null));
  const [connectedSlots, setConnectedSlots] = useState(() => slotMap(false));
  const [joinError, setJoinError] = useState(null);

  const peerRef = useRef(null);
  const connRef = useRef(null); // client's own single connection to the host
  const hostConnsRef = useRef(new Map()); // host: peerId -> { conn, slot }
  const slotsTakenRef = useRef(slotMap(false));
  const lockedRef = useRef(false);
  const watchdogRef = useRef(null);
  const joinTimerRef = useRef(null);
  const joinSettledRef = useRef(true);
  const hostRoomRef = useRef(null);

  // The phone could not reach (or was never answered by) the room: tear the
  // half-made peer down and return to idle, so that trying again is
  // possible — a stuck peer would make joinRoom refuse every later attempt.
  const failJoin = useCallback((peer) => {
    if (joinSettledRef.current) return;
    joinSettledRef.current = true;
    clearTimeout(joinTimerRef.current);
    peer?.destroy();
    if (peerRef.current === peer) peerRef.current = null;
    connRef.current = null;
    setRole('idle');
    setRoomId(null);
    setConnected(false);
    setJoinError('unreachable');
  }, []);

  const wireClientConnection = useCallback((conn, peer) => {
    connRef.current = conn;
    // "Connected" only counts once the host has actually seated this phone
    // (SLOT_MSG) — a full or already-started room accepts the raw connection
    // just long enough to say so, and must not look like a successful join.
    conn.on('data', (data) => {
      if (data && data.__peerLink === SLOT_MSG) {
        joinSettledRef.current = true;
        clearTimeout(joinTimerRef.current);
        setMySlot(data.slot);
        setConnected(true);
        return;
      }
      if (data && data.__peerLink === REFUSE_MSG) {
        joinSettledRef.current = true;
        clearTimeout(joinTimerRef.current);
        setJoinError('refused');
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
      failJoin(peer);
    });
    conn.on('error', () => failJoin(peer));
  }, [failJoin]);

  const wireHostConnection = useCallback((conn) => {
    const slot = lockedRef.current ? null : SLOTS.find((s) => !slotsTakenRef.current[s]);
    if (!slot) {
      // Room is full or its round already started — refuse rather than
      // silently overwriting an active slot or joining mid-game.
      conn.on('open', () => {
        conn.send({ __peerLink: REFUSE_MSG });
        setTimeout(() => conn.close(), 300);
      });
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
      if (hostConnsRef.current.size === 0) lockedRef.current = false;
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

  // Runs for as long as this page is the display. If the room's peer has been
  // lost (the laptop slept, Wi-Fi dropped, the signalling server went away),
  // the QR on screen would point at nothing — so reconnect when only the
  // signalling link is down, and open a brand-new room (new QR) when the peer
  // itself is gone and nobody is mid-game.
  const startWatchdog = useCallback(() => {
    if (watchdogRef.current) return;
    watchdogRef.current = setInterval(() => {
      const peer = peerRef.current;
      if (!peer || peer.destroyed) {
        if (hostConnsRef.current.size === 0) hostRoomRef.current?.();
        return;
      }
      if (peer.disconnected) peer.reconnect();
    }, WATCHDOG_MS);
  }, []);

  const hostRoom = useCallback(() => {
    startWatchdog();
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
    peer.on('error', (err) => {
      if (!FATAL_HOST_ERRORS.includes(err.type) || hostConnsRef.current.size > 0) return;
      peer.destroy();
      if (peerRef.current === peer) peerRef.current = null;
      setRoomId(null);
    });
  }, [wireHostConnection, wireLifecycle, startWatchdog]);

  useEffect(() => {
    hostRoomRef.current = hostRoom;
  }, [hostRoom]);

  const joinRoom = useCallback(
    (code) => {
      if ((peerRef.current && !peerRef.current.destroyed) || !code) return;
      joinSettledRef.current = false;
      setJoinError(null);
      const peer = new Peer();
      peerRef.current = peer;
      setRole('client');
      setRoomId(code);
      joinTimerRef.current = setTimeout(() => failJoin(peer), JOIN_TIMEOUT_MS);
      peer.on('open', () => {
        const conn = peer.connect(`${ROOM_PREFIX}${code}`);
        wireClientConnection(conn, peer);
      });
      wireLifecycle(peer);
      // "peer-unavailable" is the room not existing (an old QR); the rest are
      // network problems. Either way, tell the phone instead of hanging.
      peer.on('error', () => failJoin(peer));
    },
    [wireClientConnection, wireLifecycle, failJoin]
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
    slotsTakenRef.current = slotMap(false);
    lockedRef.current = false;
    clearTimeout(joinTimerRef.current);
    joinSettledRef.current = true;
    setRole('idle');
    setRoomId(null);
    setConnected(false);
    setLatestState(null);
    setMySlot(null);
    setHostMessage(null);
    setJoinError(null);
    setPeerStates(slotMap(null));
    setConnectedSlots(slotMap(false));
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

  // Host-only: stop seating new phones until everyone has left (the lock
  // clears itself when the last connection closes).
  const lockRoom = useCallback(() => {
    lockedRef.current = true;
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
      slotsTakenRef.current = slotMap(false);
      lockedRef.current = false;
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
      clearTimeout(joinTimerRef.current);
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
    joinError,
    hostRoom,
    joinRoom,
    leaveRoom,
    send,
    broadcast,
    lockRoom,
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
