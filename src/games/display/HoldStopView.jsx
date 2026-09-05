import HoldStopVisual from '../HoldStopVisual.jsx';

export default function HoldStopView({ state }) {
  return (
    <HoldStopVisual
      scene={state.scene}
      trial={state.trial}
      trials={state.trials}
      fill={state.fill}
      status={state.status}
      lastJudge={state.lastJudge}
      judgeKey={state.trial}
      averageScore={state.averageScore}
    />
  );
}
