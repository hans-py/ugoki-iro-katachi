import HandleSteerVisual from '../HandleSteerVisual.jsx';

export default function HandleSteerView({ state }) {
  return (
    <HandleSteerVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      diff={state.diff}
      target={state.target}
      rotation={state.rotation}
      holdProgress={state.holdProgress}
      gripped={state.gripped}
      status={state.status}
      finalDiff={state.finalDiff}
    />
  );
}
