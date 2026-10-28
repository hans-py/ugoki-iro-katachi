import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTilt } from '../engines/useTilt.jsx';
import { useShake } from '../engines/useShake.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { initAudio } from '../fx/audio.js';
import Particles from '../fx/Particles.jsx';

export default function Start() {
  const navigate = useNavigate();
  const { requestPermission: requestTiltPermission } = useTilt();
  const { requestPermission: requestShakePermission } = useShake();
  const { connected, roomMode, joinError, joinRoom, leaveRoom } = usePeerLink();
  const [searchParams] = useSearchParams();
  const roomInLink = searchParams.get('room');
  const [starting, setStarting] = useState(false);

  const preparePlayer = async () => {
    // All three calls must originate from a click handler — iOS requires
    // both permission prompts and the AudioContext resume to happen inside a
    // user gesture, not after an awaited step that isn't itself a gesture.
    await Promise.all([requestTiltPermission(), requestShakePermission(), initAudio()]);
  };

  // A phone that scanned the display's QR with its ordinary camera app is
  // already connected by the time it lands here, and the display has already
  // said what to play — so there is nothing to choose, only this one tap
  // (which also grants the motion/audio permissions iOS insists on).
  const handleStartAtDisplay = async () => {
    if (starting) return;
    setStarting(true);
    await preparePlayer();
    navigate(roomMode === 'solo' ? '/play' : `/duo-play?mode=${roomMode}`);
  };

  // Plays entirely on this phone — each game falls back to its own on-screen
  // visual when nothing is paired.
  const handlePhoneOnly = async () => {
    if (starting) return;
    setStarting(true);
    await preparePlayer();
    leaveRoom();
    navigate('/play');
  };

  const modeNote =
    roomMode === 'solo'
      ? 'ディスプレイと一人で遊びます'
      : '2〜4人で遊びます。全員がつながってから、じゅんび完了を押してね';

  return (
    <div className="screen start-screen scene-coral">
      <div className="phone-ambient">
        <span className="ambient-shape ambient-tri ambient-tri-2" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-square" />
        <span className="ambient-shape ambient-bar ambient-bar-2" />
      </div>
      <div className="particles-layer">
        <Particles mode="idle" color="#FFF6E9" />
      </div>
      <h1>うごき、いろ、かたち。</h1>
      <p className="lead">傾ける、狙う、刻む、揺する。</p>

      {connected ? (
        <div className="mode-select">
          {roomMode ? (
            <>
              <button className="primary-button" onClick={handleStartAtDisplay} disabled={starting}>
                {starting ? '準備中…' : 'はじめる'}
              </button>
              <p className="hint">{modeNote}</p>
            </>
          ) : (
            <p className="hint">ディスプレイとつながっています…</p>
          )}
        </div>
      ) : (
        <div className="mode-select">
          <button className="primary-button" onClick={handlePhoneOnly} disabled={starting}>
            {starting ? '準備中…' : 'スマホだけで遊ぶ'}
          </button>
          <button className="secondary-button" onClick={() => navigate('/scan')} disabled={starting}>
            ディスプレイにつないで遊ぶ
          </button>
        </div>
      )}

      {joinError === 'refused' && (
        <p className="hint">このルームは満員か、もう始まっています。ディスプレイを確認してね</p>
      )}

      {joinError === 'unreachable' && (
        <div className="join-failed">
          <p className="hint">ディスプレイにつながりませんでした。ディスプレイのQRを、もう一度読み取ってね</p>
          {roomInLink && (
            <button className="secondary-button" onClick={() => joinRoom(roomInLink)}>
              もう一度つなぐ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
