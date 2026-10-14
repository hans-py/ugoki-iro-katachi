import CompassAlignVisual from '../CompassAlignVisual.jsx';
import { getHint } from '../../data/hints.js';

export default function CompassAlignView({ state }) {
  return (
    <CompassAlignVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      diff={state.diff}
      target={state.target}
      heading={state.heading}
      holdProgress={state.holdProgress}
      status={state.status}
      hint={getHint('compassAlign', '通常')}
      finalMinDiff={state.finalMinDiff}
    />
  );
}
