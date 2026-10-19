import Particles from '../fx/Particles.jsx';
import Impact from '../fx/Impact.jsx';
import Hud from '../screens/Hud.jsx';

// The rich visual for ① — pulled out of TiltFill.jsx so both the phone's own
// standalone screen and the display's mirrored view can render identically
// from whichever state they each have (local state vs. state received over
// the peer link).
export default function TiltFillVisual({ scene, timeLeft, fill, spilling, pouring, status, hint }) {
  return (
    <div className={`game-screen tilt-fill scene-${scene}`}>
      <Hud
        items={[
          { label: 'のこり', value: `${Math.ceil(timeLeft / 1000)}s` },
          { label: 'たまり', value: `${Math.round(fill)}%` },
        ]}
      />

      <div className={`glass ${spilling ? 'spilling' : ''}`}>
        <div className="liquid" style={{ height: `${fill}%` }} />
        <div className="particles-layer">
          <Particles mode="pour" active={status === 'playing' && pouring} color="#FF1414" />
        </div>
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}
      {spilling && status === 'playing' && <p className="warning">こぼれてる!</p>}

      {status !== 'playing' && (
        <div className="result-overlay">
          <Particles mode="burst" active={status === 'cleared'} color="#FF1414" />
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>到達量 {Math.round(fill)}%</p>
        </div>
      )}
    </div>
  );
}
