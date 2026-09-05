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
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleSoloPlay = async () => {
    if (starting) return;
    setStarting(true);
    // All three calls must originate from this click handler — iOS requires
    // both permission prompts and the AudioContext resume to happen inside a
    // user gesture, not after an awaited step that isn't itself a gesture.
    await Promise.all([requestTiltPermission(), requestShakePermission(), initAudio()]);
    // Arriving via the display's shared link (?room=) already pairs the
    // phone before Start ever renders — no need to scan a second time.
    navigate(connected ? '/play' : '/scan');
  };

  const handleDuoPlay = () => setShowComingSoon(true);

  return (
    <div className="screen start-screen scene-coral">
      <div className="particles-layer">
        <Particles mode="idle" color="#FFF6E9" />
      </div>
      <p className="eyebrow">motion mini games</p>
      <h1>うごき、いろ、かたち。</h1>
      <p className="lead">傾ける、狙う、刻む、揺する。</p>
      <div className="mode-select">
        <button className="primary-button" onClick={handleSoloPlay} disabled={starting}>
          {starting ? '準備中…' : '一人で遊ぶ'}
        </button>
        <button className="secondary-button" onClick={handleDuoPlay} disabled={starting}>
          二人で遊ぶ
        </button>
      </div>
      {showComingSoon && <p className="hint">二人で遊ぶモードは近日公開です</p>}
    </div>
  );
}
