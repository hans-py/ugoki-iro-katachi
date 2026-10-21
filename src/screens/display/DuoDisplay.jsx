import { DISPLAY_VIEWS } from '../../games/gameRegistry.js';
import QrCode from '../../fx/QrCode.jsx';
import DuoResultView from './DuoResultView.jsx';
import { getNickname } from '../../data/nicknames.js';
import { SLOTS } from '../../data/slots.js';

// How much each panel's stage is enlarged, by player count: fewer, wider
// panels can afford a bigger game; four narrow ones need it at 1 (anything smaller leaves a strip of the room background showing).
const STAGE_SCALE = { 2: 1.4, 3: 1.2, 4: 1 };

function DuoPanel({ nickname, connected, state, allReady }) {
  const label = nickname.name;
  if (!connected) {
    return (
      <div className="duo-waiting">
        <p className="eyebrow">{label}</p>
        <p className="hint">つながっていません</p>
      </div>
    );
  }
  const ActiveView = state && DISPLAY_VIEWS[state.type];
  if (!ActiveView) {
    const hint =
      state?.type === 'duoReady'
        ? allReady
          ? 'まもなくスタート…'
          : 'じゅんび完了、みんなを待っています'
        : state?.type === 'duoResult'
          ? 'けっか発表を待っています…'
          : 'じゅんび中…';
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

// A fixed nameplate on each panel (over whatever that player's game is
// drawing), in the same name and color shown on their phone.
function Nameplate({ nickname }) {
  return (
    <div className="duo-nameplate" style={{ '--badge-color': nickname.color }}>
      <span className="player-badge-dot" />
      {nickname.name}({nickname.side})
    </div>
  );
}

// Once a second phone joins (みんなで遊ぶ), the whole display permanently
// switches to this split layout for the rest of the room's life: one panel
// per player who has connected, each mirroring that player's phone with the
// exact same DISPLAY_VIEWS components solo play already built. Until the
// round starts, a QR stays on screen so the next player can still join.
export default function DuoDisplay({ roomId, peerStates, connectedSlots, activeSlots, started, allReady, joinUrl }) {
  const players = activeSlots.map((slot) => ({ slot, nickname: getNickname(roomId, slot) }));

  const connectedPlayers = players.filter((p) => connectedSlots[p.slot]);
  const finished = connectedPlayers.filter((p) => peerStates[p.slot]?.type === 'duoResult');
  if (finished.length >= 2 && finished.length === connectedPlayers.length) {
    return (
      <DuoResultView
        entries={finished.map((p) => ({ slot: p.slot, nickname: p.nickname, result: peerStates[p.slot] }))}
      />
    );
  }

  const count = Math.min(Math.max(players.length, 2), SLOTS.length);

  return (
    <div className="duo-display scene-cycle" style={{ '--duo-scale': STAGE_SCALE[count] }}>
      {players.map((p, i) => (
        <div className="duo-panel-group" key={p.slot}>
          {i > 0 && <div className="duo-panel-divider" />}
          <div className="duo-panel">
            <DuoPanel
              nickname={p.nickname}
              connected={connectedSlots[p.slot]}
              state={peerStates[p.slot]}
              allReady={allReady}
            />
            <Nameplate nickname={p.nickname} />
          </div>
        </div>
      ))}

      {!started && players.length < SLOTS.length && joinUrl && (
        <div className="duo-lobby-qr">
          <QrCode value={joinUrl} size={150} />
          <p>あと{SLOTS.length - players.length}人まで参加できます</p>
        </div>
      )}
    </div>
  );
}
