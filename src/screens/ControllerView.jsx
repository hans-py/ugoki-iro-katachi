// The phone's screen once it's paired with a display: no game visual at
// all, just the current action as large text — the actual glass/dial/etc.
// is drawn on the display instead. This is what "a phone used as a pure
// controller" looks like.
export default function ControllerView({ scene, message, sub, actionLabel, onAction }) {
  return (
    <div className={`screen controller-view scene-${scene}`}>
      <div className="phone-ambient">
        <span className="ambient-shape ambient-circle ambient-circle-2" />
        <span className="ambient-shape ambient-bar ambient-bar-2" />
        <span className="ambient-shape ambient-tri" />
      </div>
      <p className="eyebrow">ディスプレイを見てね</p>
      <p className="controller-message">{message}</p>
      {sub && <p className="lead">{sub}</p>}
      {actionLabel && (
        <button className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
