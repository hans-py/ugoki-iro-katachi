import PolyClapVisual from '../PolyClapVisual.jsx';

export default function PolyClapView({ state }) {
  return (
    <PolyClapVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      durationMs={state.durationMs}
      leadInMs={state.leadInMs}
      leftCombo={state.leftCombo}
      rightCombo={state.rightCombo}
      leftFlash={state.leftFlash}
      rightFlash={state.rightFlash}
      leftPhase={state.leftPhase}
      rightPhase={state.rightPhase}
      status={state.status}
      finalScore={state.finalScore}
    />
  );
}
