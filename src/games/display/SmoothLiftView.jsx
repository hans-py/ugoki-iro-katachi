import SmoothLiftVisual from '../SmoothLiftVisual.jsx';
import { getHint } from '../../data/hints.js';

export default function SmoothLiftView({ state }) {
  const hint = getHint('smoothLift', state.progress < 0.5 ? '上げ' : '下げ');
  return <SmoothLiftVisual scene={state.scene} progress={state.progress} status={state.status} hint={hint} />;
}
