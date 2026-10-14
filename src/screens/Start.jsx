import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTilt } from '../engines/useTilt.jsx';
import { useShake } from '../engines/useShake.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { initAudio } from '../fx/audio.js';
import Particles from '../fx/Particles.jsx';

export default function Start() {
  const navigate = useNavigate();
  const { requestPermission: requestTiltPermission } = useTilt();
  const { requestPermission: requestShakePermission } = useShake();
  const { connected } = usePeerLink();
  const [starting, setStarting] = useState(false);
  const [showDuoSelect, setShowDuoSelect] = useState(false);

  const preparePlayer = async () => {
    // All three calls must originate from a click handler — iOS requires
    // both permission prompts and the AudioContext resume to happen inside a
    // user gesture, not after an awaited step that isn't itself a gesture.
    await Promise.all([requestTiltPermission(), requestShakePermission(), initAudio()]);
  };

  const handleSoloPlay = async () => {
    if (starting) return;
    setStarting(true);
    await preparePlayer();
    // Arriving via the display's shared link (?room=) already pairs the
    // phone before Start ever renders — no need to scan a second time.
    navigate(connected ? '/play' : '/scan');
  };

  const handleDuoMode = async (mode) => {
    if (starting) return;
    setStarting(true);
    await preparePlayer();
    navigate(connected ? `/duo-play?mode=${mode}` : `/scan?duo=${mode}`);
  };

  return (
    <div className="screen start-screen scene-pop">
      <div className="phone-ambient">
        <span className="ambient-shape ambient-tri ambient-tri-2" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-square" />
        <span className="ambient-shape ambient-bar ambient-bar-2" />
      </div>
      <div className="particles-layer">
        <Particles mode="idle" color="#FFF6E9" />
      </div>
      <p className="eyebrow">motion mini games</p>
      <h1>うごき、いろ、かたち。</h1>
      <p className="lead">傾ける、狙う、刻む、揺する。</p>

      {!showDuoSelect && (
        <div className="mode-select">
          <button className="primary-button" onClick={handleSoloPlay} disabled={starting}>
            {starting ? '準備中…' : '一人で遊ぶ'}
          </button>
          <button className="secondary-button" onClick={() => setShowDuoSelect(true)} disabled={starting}>
            二人で遊ぶ
          </button>
        </div>
      )}

      {showDuoSelect && (
        <div className="mode-select">
          <button className="primary-button" onClick={() => handleDuoMode('battle')} disabled={starting}>
            {starting ? '準備中…' : '対戦する'}
          </button>
          <button className="primary-button" onClick={() => handleDuoMode('match')} disabled={starting}>
            {starting ? '準備中…' : 'マッチ度診断'}
          </button>
          <button className="secondary-button" onClick={() => setShowDuoSelect(false)} disabled={starting}>
            もどる
          </button>
          <p className="hint">二人ともスマホを1台ずつ用意して、同じディスプレイのQRを読み取ってね</p>
        </div>
      )}
    </div>
  );
}
