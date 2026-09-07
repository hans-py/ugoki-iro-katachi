// Shown for a beat before each game: a big verb + one-line explanation, like
// an arcade "READY?" card, so the player knows what body motion to use
// before the timer starts. Unlike the game itself (fast, reactive), this is
// the "calm" beat of the rhythm — a slow ambient drift and background
// breathe instead of silence, so the contrast with GO!'s hard punch and the
// game's snap-judgment flashes actually reads as contrast.
export default function Instruction({ game, index, total, scene, onStart, buttonLabel = 'はじめる' }) {
  return (
    <div className={`screen instruction-screen scene-${scene}`}>
      <div className="phone-ambient">
        <span className="ambient-shape ambient-tri" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-bar" />
        <span className="ambient-shape ambient-square ambient-square-2" />
      </div>
      <p className="eyebrow">
        GAME {index + 1} / {total}
      </p>
      <p className="instruction-verb">{game.verb}</p>
      <p className="lead">{game.instruction}</p>
      <button className="primary-button" onClick={onStart}>
        {buttonLabel}
      </button>
    </div>
  );
}
