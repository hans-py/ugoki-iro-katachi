// Shared instrument-panel readout bar used by every game screen: a row of
// {label, value} pairs styled like a measuring device's digital display.
export default function Hud({ items }) {
  return (
    <div className="hud">
      {items.map(({ label, value }) => (
        <span key={label}>
          <span className="hud-label">{label}</span>
          <span className="hud-value">{value}</span>
        </span>
      ))}
    </div>
  );
}
