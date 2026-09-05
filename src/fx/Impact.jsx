// A one-shot geometric "impact" burst: a handful of flat shapes (not a soft
// particle cloud) fly outward from the center and fade, each on its own
// delay/angle. This is the motion-graphics reveal cue — used the moment a
// result overlay appears — as opposed to Particles, which is an ambient
// continuous effect.
//
// `variant="micro"` is the same burst scaled down, for a single Perfect tap
// rather than a whole game clearing — same shape language, lower intensity.
// `variant="grand"` is the opposite: the final result screen's one big
// payoff, so it gets a second, wider wave of shapes a beat after the first.
export default function Impact({ variant = 'full' }) {
  const sizeClass = variant === 'micro' ? 'impact-burst-micro' : variant === 'grand' ? 'impact-burst-grand' : '';
  return (
    <div className={`impact-burst ${sizeClass}`}>
      <span className="impact-shockwave" />
      <span className="impact-shape impact-tri" />
      <span className="impact-shape impact-circle" />
      <span className="impact-shape impact-bar" />
      <span className="impact-shape impact-square" />
      <span className="impact-shape impact-tri impact-tri-2" />
      <span className="impact-shape impact-circle impact-circle-2" />
      <span className="impact-shape impact-bar impact-bar-2" />
      {variant === 'grand' && (
        <>
          <span className="impact-shockwave impact-shockwave-2" />
          <span className="impact-shape impact-tri impact-tri-3" />
          <span className="impact-shape impact-circle impact-circle-3" />
          <span className="impact-shape impact-bar impact-bar-3" />
          <span className="impact-shape impact-square impact-square-2" />
        </>
      )}
    </div>
  );
}
