import TiltMazeVisual from '../TiltMazeVisual.jsx';
import { getHint } from '../../data/hints.js';

export default function TiltMazeView({ state }) {
  return (
    <TiltMazeVisual
      scene={state.scene}
      timeLeft={state.timeLeft}
      ball={state.ball}
      status={state.status}
      hint={getHint('tiltMaze', '通常')}
      durationMs={state.durationMs}
    />
  );
}
