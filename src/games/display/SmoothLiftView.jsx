import SmoothLiftVisual from '../SmoothLiftVisual.jsx';

export default function SmoothLiftView({ state }) {
  const hint = state.progress < 0.5 ? '持ち上げて…' : 'おろして…';
  return <SmoothLiftVisual scene={state.scene} progress={state.progress} status={state.status} hint={hint} />;
}
