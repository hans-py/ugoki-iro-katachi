import TiltMazeVisual from '../TiltMazeVisual.jsx';

export default function TiltMazeView({ state }) {
  return (
    <TiltMazeVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      ball={state.ball}
      status={state.status}
      hint="スマホを傾けてボールをゴールへ"
      durationMs={state.durationMs}
    />
  );
}
