import TimingCenterVisual from '../TimingCenterVisual.jsx';

export default function TimingCenterView({ state }) {
  return (
    <TimingCenterVisual
      scene={state.scene}
      trial={state.trial}
      trials={state.trials}
      position={state.position}
      status={state.status}
      lastJudge={state.lastJudge}
      judgeKey={state.trial}
      averageScore={state.averageScore}
    />
  );
}
