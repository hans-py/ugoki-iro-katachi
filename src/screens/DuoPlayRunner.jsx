import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { pickRandomGamesSeeded } from '../data/titles.js';
import { GAME_COMPONENTS, SCENES } from '../games/gameRegistry.js';
import Instruction from './Instruction.jsx';
import GoFlash from './GoFlash.jsx';
import ControllerView from './ControllerView.jsx';

const RETURN_TO_START_MS = 6000;

// 二人で遊ぶ's runner: structurally the same instruction → GO → game loop as
// solo's GameRunner, but the playlist comes from a seeded shuffle of the
// room code (see pickRandomGamesSeeded) instead of Math.random — both
// phones joined the same room, so both land on the identical 5 games
// without either one telling the other its choice. Each game already
// broadcasts its own live state for the display to mirror (built for solo
// play); the only thing duo mode adds is one extra message once a phone
// finishes its last game, tagging its final scores as this player's slot.
export default function DuoPlayRunner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duoMode = searchParams.get('mode'); // 'battle' | 'match'
  const { roomId, mySlot, hostMessage, send, leaveRoom } = usePeerLink();
  const [playlist] = useState(() => pickRandomGamesSeeded(roomId));
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([]);
  // 'instruction' | 'waitingPartner' | 'go' | 'playing' | 'finished'
  const [phase, setPhase] = useState('instruction');

  const handleFinish = useCallback(
    (result) => {
      const game = playlist[index];
      const nextScores = [...scores, { id: game.id, score: result.score }];
      const nextIndex = index + 1;
      if (nextIndex >= playlist.length) {
        const total = nextScores.reduce((a, b) => a + b.score, 0);
        send({ type: 'duoResult', duoMode, slot: mySlot, scores: nextScores, total });
        setScores(nextScores);
        setPhase('finished');
      } else {
        setScores(nextScores);
        setIndex(nextIndex);
        setPhase('instruction');
      }
    },
    [playlist, index, scores, duoMode, mySlot, send]
  );

  // Neither phone can see the other's screen — pressing "はじめる" on game 1
  // only marks this phone ready and waits; the display (the only side both
  // are connected to) relays a "go" the instant it's seen both players'
  // ready signal, so the very first game's GO flash actually lands for both
  // at the same moment instead of whenever each player happened to tap.
  useEffect(() => {
    if (phase === 'waitingPartner' && hostMessage?.type === 'duoStart') {
      setPhase('go');
    }
  }, [phase, hostMessage]);

  // Once both players' results are in, the display is showing the real
  // comparison for everyone to see — each phone just needs to hand itself
  // back after a beat, freeing its slot for the next pair to use this room.
  useEffect(() => {
    if (phase !== 'finished') return;
    const timer = setTimeout(() => {
      leaveRoom();
      navigate('/');
    }, RETURN_TO_START_MS);
    return () => clearTimeout(timer);
  }, [phase, leaveRoom, navigate]);

  const game = playlist[index];
  const scene = SCENES[index % SCENES.length];

  if (phase === 'finished') {
    const total = scores.reduce((a, b) => a + b.score, 0);
    return <ControllerView scene={scene} message="けっか発表!" sub={`ディスプレイを見てね(あなたの合計 ${total})`} />;
  }

  if (phase === 'waitingPartner') {
    return (
      <div className={`screen instruction-screen scene-${scene}`}>
        <p className="eyebrow">
          GAME {index + 1} / {playlist.length}
        </p>
        <p className="instruction-verb">じゅんび完了!</p>
        <p className="lead">あいてを待っています…</p>
      </div>
    );
  }

  if (phase === 'instruction') {
    return (
      <Instruction
        game={game}
        index={index}
        total={playlist.length}
        scene={scene}
        buttonLabel={index === 0 ? 'じゅんび完了' : 'はじめる'}
        onStart={() => {
          if (index === 0) {
            send({ type: 'duoReady' });
            setPhase('waitingPartner');
          } else {
            setPhase('go');
          }
        }}
      />
    );
  }

  if (phase === 'go') {
    return <GoFlash scene={scene} onDone={() => setPhase('playing')} />;
  }

  const GameComponent = GAME_COMPONENTS[game.id];
  return <GameComponent key={game.id} scene={scene} onFinish={handleFinish} />;
}
