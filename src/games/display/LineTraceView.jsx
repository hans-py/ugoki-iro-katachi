import LineTraceVisual from '../LineTraceVisual.jsx';
import { getHint } from '../../data/hints.js';

export default function LineTraceView({ state }) {
  const hint = getHint('lineTrace', state.progress > 0 ? 'なぞり中' : '開始前');
  return (
    <LineTraceVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      progress={state.progress}
      cursor={state.cursor}
      status={state.status}
      markers={state.markers}
      hint={hint}
    />
  );
}
