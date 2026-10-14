import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TiltProvider } from './engines/useTilt.jsx';
import { ShakeProvider } from './engines/useShake.jsx';
import { PeerLinkProvider, usePeerLink } from './engines/usePeerLink.jsx';
import { pickRandomGames } from './data/titles.js';
import { planScare, preloadScare } from './data/scares.js';
import Scare from './fx/Scare.jsx';
import { GAME_COMPONENTS, SCENES } from './games/gameRegistry.js';
import Start from './screens/Start.jsx';
import ScanQr from './screens/ScanQr.jsx';
import Result from './screens/Result.jsx';
import Display from './screens/Display.jsx';
import Instruction from './screens/Instruction.jsx';
import GoFlash from './screens/GoFlash.jsx';
import DuoPlayRunner from './screens/DuoPlayRunner.jsx';

// Plays a random 5-game playlist (drawn once per run from the full pool),
// then hands the collected scores to /result. A fresh `key` per game forces
// a full remount so each game starts from its own clean initial state.
function GameRunner() {
  const navigate = useNavigate();
  const [playlist] = useState(pickRandomGames);
  const [index, setIndex] = useState(0);
  const [sceneOffset] = useState(() => Math.floor(Math.random() * SCENES.length));
  const [scores, setScores] = useState([]);
  const [phase, setPhase] = useState('instruction'); // 'instruction' | 'go' | 'playing' | 'scare'
  const [scarePlan] = useState(planScare);

  useEffect(() => {
    preloadScare(scarePlan);
  }, [scarePlan]);

  const handleFinish = useCallback(
    (result) => {
      const game = playlist[index];
      const nextScores = [...scores, { id: game.id, score: result.score }];
      const nextIndex = index + 1;
      if (nextIndex >= playlist.length) {
        navigate('/result', { state: { scores: nextScores } });
      } else {
        setScores(nextScores);
        setIndex(nextIndex);
        setPhase(scarePlan?.atIndex === nextIndex ? 'scare' : 'instruction');
      }
    },
    [playlist, index, scores, navigate, scarePlan]
  );

  const game = playlist[index];
  const scene = SCENES[(index + sceneOffset) % SCENES.length];

  if (phase === 'scare') {
    return <Scare kind={scarePlan.kind} asset={scarePlan.asset} onDone={() => setPhase('instruction')} />;
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

// A phone that scanned the display's QR arrives at `/?room=XXXXX`. This
// joins that room once, as soon as the code is present, regardless of which
// route the phone is currently on — the connection then persists across
// Start → Instruction → GO → each game, same as the tilt/shake permissions.
function RoomJoiner() {
  const location = useLocation();
  const { role, joinRoom } = usePeerLink();

  useEffect(() => {
    const room = new URLSearchParams(location.search).get('room');
    if (room && role === 'idle') {
      joinRoom(room);
    }
  }, [location.search, role, joinRoom]);

  return null;
}

function App() {
  return (
    // GitHub Pages serves this build from /kuse-no-katachi/ (see vite.config.js's
    // `base`), not from the domain root — without this, every route fails to
    // match against that prefixed path and the app renders nothing. Vite sets
    // BASE_URL to match `base` automatically, so this stays correct in dev too.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TiltProvider>
        <ShakeProvider>
          <PeerLinkProvider>
            <RoomJoiner />
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/scan" element={<ScanQr />} />
              <Route path="/play" element={<GameRunner />} />
              <Route path="/duo-play" element={<DuoPlayRunner />} />
              <Route path="/result" element={<Result />} />
              <Route path="/display" element={<Display />} />
            </Routes>
          </PeerLinkProvider>
        </ShakeProvider>
      </TiltProvider>
    </BrowserRouter>
  );
}

export default App;
