import ShakeGaugeVisual from '../ShakeGaugeVisual.jsx';

export default function ShakeGaugeView({ state }) {
  return (
    <ShakeGaugeVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      gauge={state.gauge}
      status={state.status}
      hint="スマホを揺すってゲージを満タンに"
    />
  );
}
