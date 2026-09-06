import { DISPLAY_VIEWS } from '../../games/gameRegistry.js';
import DuoResultView from './DuoResultView.jsx';

function DuoPanel({ label, connected, state }) {
  if (!connected) {
    return (
      <div className="duo-waiting">
        <p className="eyebrow">{label}</p>
        <p className="hint">スマホでQRを読み取って参加待ち…</p>
      </div>
    );
  }
  const ActiveView = state && DISPLAY_VIEWS[state.type];
  if (!ActiveView) {
    return (
      <div className="duo-waiting">
        <p className="eyebrow">{label}</p>
        <p className="hint">まもなくスタート…</p>
      </div>
    );
  }
  return (
    <div className="duo-panel-stage">
      <ActiveView state={state} />
    </div>
  );
}

// Once a second phone joins (二人で遊ぶ), the whole display permanently
// switches to this split layout: each half mirrors one player's phone using
// the exact same DISPLAY_VIEWS components solo play already built — a duo
// game never needed its own display rendering, just a smaller stage to
// render into (see `.duo-panel-stage` in index.css for the scale trick).
export default function DuoDisplay({ peerStates, connectedSlots }) {
  const bothFinished = peerStates.A?.type === 'duoResult' && peerStates.B?.type === 'duoResult';
  if (bothFinished) {
    return <DuoResultView a={peerStates.A} b={peerStates.B} />;
  }

  return (
    <div className="duo-display scene-cycle">
      <div className="duo-panel duo-panel-a">
        <DuoPanel label="PLAYER A" connected={connectedSlots.A} state={peerStates.A} />
      </div>
      <div className="duo-panel-divider" />
      <div className="duo-panel duo-panel-b">
        <DuoPanel label="PLAYER B" connected={connectedSlots.B} state={peerStates.B} />
      </div>
    </div>
  );
}
