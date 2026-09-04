// Shown for a beat before each game: a big verb + one-line explanation, like
// an arcade "READY?" card, so the player knows what body motion to use
// before the timer starts.
export default function Instruction({ game, index, total, scene, onStart }) {
  return (
    <div className={`screen instruction-screen scene-${scene}`}>
      <p className="eyebrow">
        GAME {index + 1} / {total}
      </p>
      <p className="instruction-verb">{game.verb}</p>
      <p className="lead">{game.instruction}</p>
      <button className="primary-button" onClick={onStart}>
        はじめる
      </button>
    </div>
  );
}
