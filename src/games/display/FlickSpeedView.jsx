import FlickSpeedVisual from '../FlickSpeedVisual.jsx';

export default function FlickSpeedView({ state }) {
  return (
    <FlickSpeedVisual
      scene={state.scene}
      trial={state.trial}
      trials={state.trials}
      target={state.target}
      status={state.status}
      lastJudge={state.lastJudge}
      judgeKey={state.trial}
      averageScore={state.averageScore}
    />
  );
}
