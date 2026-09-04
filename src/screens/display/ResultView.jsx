import ResultVisual from '../ResultVisual.jsx';

// Display-side mirror of the final result — the phone computed everything
// and broadcast it once when the last game finished.
export default function ResultView({ state }) {
  return <ResultVisual title={state.title} total={state.total} scores={state.scores} />;
}
