import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { pickRandomGamesSeeded } from '../data/titles.js';
import { GAME_COMPONENTS, SCENES } from '../games/gameRegistry.js';
import Instruction from './Instruction.jsx';
import GoFlash from './GoFlash.jsx';
import ControllerView from './ControllerView.jsx';

// 二人で遊ぶ's runner: structurally the same instruction → GO → game loop as
// solo's GameRunner, but the playlist comes from a seeded shuffle of the
// room code (see pickRandomGamesSeeded) instead of Math.random — both
// phones joined the same room, so both land on the identical 5 games
// without either one telling the other its choice. Each game already
// broadcasts its own live state for the display to mirror (built for solo
// play); the only thing duo mode adds is one extra message once a phone
// finishes its last game, tagging its final scores as this player's slot.
export default function DuoPlayRunner() {
  const [searchParams] = useSearchParams();
  const duoMode = searchParams.get('mode'); // 'battle' | 'match'
  const { roomId, mySlot, send } = usePeerLink();
  const [playlist] = useState(() => pickRandomGamesSeeded(roomId));
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [phase, setPhase] = useState('instruction'); // 'instruction' | 'go' | 'playing' | 'finished'

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

  const game = playlist[index];
  const scene = SCENES[index % SCENES.length];

  if (phase === 'finished') {
    const total = scores.reduce((a, b) => a + b.score, 0);
    return <ControllerView scene={scene} message="けっか発表!" sub={`ディスプレイを見てね(あなたの合計 ${total})`} />;
  }

  if (phase === 'instruction') {
    return (
      <Instruction game={game} index={index} total={playlist.length} scene={scene} onStart={() => setPhase('go')} />
    );
  }

  if (phase === 'go') {
    return <GoFlash scene={scene} onDone={() => setPhase('playing')} />;
  }

  const GameComponent = GAME_COMPONENTS[game.id];
  return <GameComponent key={game.id} scene={scene} onFinish={handleFinish} />;
}
