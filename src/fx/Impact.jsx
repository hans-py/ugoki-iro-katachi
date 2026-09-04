// A one-shot geometric "impact" burst: a handful of flat shapes (not a soft
// particle cloud) fly outward from the center and fade, each on its own
// delay/angle. This is the motion-graphics reveal cue — used the moment a
// result overlay appears — as opposed to Particles, which is an ambient
// continuous effect.
// `variant="micro"` is the same burst scaled down, for a single Perfect tap
// rather than a whole game clearing — same shape language, lower intensity.
export default function Impact({ variant = 'full' }) {
  return (
    <div className={`impact-burst ${variant === 'micro' ? 'impact-burst-micro' : ''}`}>
      <span className="impact-shockwave" />
      <span className="impact-shape impact-tri" />
      <span className="impact-shape impact-circle" />
      <span className="impact-shape impact-bar" />
      <span className="impact-shape impact-square" />
      <span className="impact-shape impact-tri impact-tri-2" />
      <span className="impact-shape impact-circle impact-circle-2" />
      <span className="impact-shape impact-bar impact-bar-2" />
    </div>
  );
}
