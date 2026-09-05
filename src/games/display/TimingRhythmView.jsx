import TimingRhythmVisual from '../TimingRhythmVisual.jsx';

export default function TimingRhythmView({ state }) {
  return (
    <TimingRhythmVisual
      scene={state.scene}
      beatIndex={state.beatIndex}
      rounds={state.rounds}
      combo={state.combo}
      ringScale={state.ringScale}
      status={state.status}
      lastJudge={state.lastJudge}
      judgeKey={state.beatIndex}
      finalScore={state.finalScore}
    />
  );
}
