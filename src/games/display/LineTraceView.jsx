import LineTraceVisual from '../LineTraceVisual.jsx';

export default function LineTraceView({ state }) {
  const hint = state.progress > 0 ? 'そのままゴールまでなぞって' : '光る点(スタート)から指でなぞってね';
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
