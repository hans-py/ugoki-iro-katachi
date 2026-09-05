import CompassAlignVisual from '../CompassAlignVisual.jsx';

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
      hint="スマホを水平に持って体ごと回す"
      finalMinDiff={state.finalMinDiff}
    />
  );
}
