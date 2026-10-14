import ShakeGaugeVisual from '../ShakeGaugeVisual.jsx';
import { getHint } from '../../data/hints.js';

export default function ShakeGaugeView({ state }) {
  return (
    <ShakeGaugeVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      gauge={state.gauge}
      status={state.status}
      hint={getHint('shakeGauge', '通常')}
    />
  );
}
