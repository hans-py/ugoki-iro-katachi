import { DISPLAY_VIEWS } from '../../games/gameRegistry.js';
import DuoResultView from './DuoResultView.jsx';
import { getNickname } from '../../data/nicknames.js';

function DuoPanel({ nickname, connected, state }) {
  const label = nickname.name;
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
    const hint =
      state?.type === 'duoReady'
        ? 'じゅんび完了、あいてを待っています'
        : state?.type === 'duoResult'
          ? 'けっか発表を待っています…'
          : 'まもなくスタート…';
    return (
      <div className="duo-waiting">
        <p className="eyebrow">{label}</p>
        <p className="hint">{hint}</p>
      </div>
    );
  }
  return (
    <div className="duo-panel-stage">
      <ActiveView state={state} />
    </div>
  );
}

// A fixed nameplate on each half (over whatever that player's game is
// drawing), in the same name and color shown on their phone.
function Nameplate({ nickname }) {
  return (
    <div className="duo-nameplate" style={{ '--badge-color': nickname.color }}>
      <span className="player-badge-dot" />
      {nickname.name}({nickname.side})
    </div>
  );
}

// Once a second phone joins (二人で遊ぶ), the whole display permanently
// switches to this split layout: each half mirrors one player's phone using
// the exact same DISPLAY_VIEWS components solo play already built — a duo
// game never needed its own display rendering, just a smaller stage to
// render into (see `.duo-panel-stage` in index.css for the scale trick).
export default function DuoDisplay({ roomId, peerStates, connectedSlots }) {
  const nickA = getNickname(roomId, 'A');
  const nickB = getNickname(roomId, 'B');
  const bothFinished = peerStates.A?.type === 'duoResult' && peerStates.B?.type === 'duoResult';
  if (bothFinished) {
    return <DuoResultView a={peerStates.A} b={peerStates.B} nameA={nickA} nameB={nickB} />;
  }

  return (
    <div className="duo-display scene-cycle">
      <div className="duo-panel duo-panel-a">
        <DuoPanel nickname={nickA} connected={connectedSlots.A} state={peerStates.A} />
        <Nameplate nickname={nickA} />
      </div>
      <div className="duo-panel-divider" />
      <div className="duo-panel duo-panel-b">
        <DuoPanel nickname={nickB} connected={connectedSlots.B} state={peerStates.B} />
        <Nameplate nickname={nickB} />
      </div>
    </div>
  );
}
