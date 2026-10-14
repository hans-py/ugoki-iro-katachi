import TiltFillVisual from '../TiltFillVisual.jsx';
import { getHint } from '../../data/hints.js';

// What the exhibit monitor shows while a paired phone is playing ①. Pure
// presentation — all the physics/scoring already happened on the phone;
// this just renders the state it broadcast, using the exact same visual
// component the phone itself would use if it were playing standalone.
export default function TiltFillView({ state }) {
  const hint = getHint('tiltFill', state.pouring ? '注ぎ中' : '待機中');
  return (
    <TiltFillVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      fill={state.fill}
      spilling={state.spilling}
      pouring={state.pouring}
      status={state.status}
      hint={hint}
    />
  );
}
