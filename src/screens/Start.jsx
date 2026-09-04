import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTilt } from '../engines/useTilt.jsx';
import { useShake } from '../engines/useShake.jsx';
import { initAudio } from '../fx/audio.js';
import Particles from '../fx/Particles.jsx';

export default function Start() {
  const navigate = useNavigate();
  const { requestPermission: requestTiltPermission } = useTilt();
  const { requestPermission: requestShakePermission } = useShake();
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    // All three calls must originate from this click handler — iOS requires
    // both permission prompts and the AudioContext resume to happen inside a
    // user gesture, not after an awaited step that isn't itself a gesture.
    await Promise.all([requestTiltPermission(), requestShakePermission(), initAudio()]);
    navigate('/play');
  };

  return (
    <div className="screen start-screen scene-coral">
      <div className="particles-layer">
        <Particles mode="idle" color="#FFF6E9" />
      </div>
      <p className="eyebrow">5 games</p>
      <h1>うごき、いろ、かたち。</h1>
      <p className="lead">傾ける、狙う、刻む、揺する。</p>
      <button className="primary-button" onClick={handleStart} disabled={starting}>
        {starting ? '準備中…' : 'はじめる'}
      </button>
    </div>
  );
}
