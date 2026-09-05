import { useEffect } from 'react';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import QrCode from '../fx/QrCode.jsx';
import TiltFillView from '../games/display/TiltFillView.jsx';
import TiltMazeView from '../games/display/TiltMazeView.jsx';
import ShakeGaugeView from '../games/display/ShakeGaugeView.jsx';
import CompassAlignView from '../games/display/CompassAlignView.jsx';
import SmoothLiftView from '../games/display/SmoothLiftView.jsx';
import TimingCenterView from '../games/display/TimingCenterView.jsx';
import TimingRhythmView from '../games/display/TimingRhythmView.jsx';
import HoldStopView from '../games/display/HoldStopView.jsx';
import FlickSpeedView from '../games/display/FlickSpeedView.jsx';
import HandleSteerView from '../games/display/HandleSteerView.jsx';
import LineTraceView from '../games/display/LineTraceView.jsx';
import PolyClapView from '../games/display/PolyClapView.jsx';
import ResultView from './display/ResultView.jsx';

// Games that know how to render themselves on the display from a phone's
// broadcast state.
const DISPLAY_VIEWS = {
  tiltFill: TiltFillView,
  tiltMaze: TiltMazeView,
  shakeGauge: ShakeGaugeView,
  compassAlign: CompassAlignView,
  smoothLift: SmoothLiftView,
  timingCenter: TimingCenterView,
  timingRhythm: TimingRhythmView,
  holdStop: HoldStopView,
  flickSpeed: FlickSpeedView,
  handleSteer: HandleSteerView,
  lineTrace: LineTraceView,
  polyClap: PolyClapView,
  result: ResultView,
};

// The exhibit monitor screen. Idle, it plays on its own loop (see
// .scene-cycle / .display-ambient in index.css) with a QR code for pairing.
// Once a phone connects and starts sending game state, it switches to
// mirroring that phone's game live instead.
export default function Display() {
  const { hostRoom, roomId, connected, latestState } = usePeerLink();

  useEffect(() => {
    hostRoom();
  }, [hostRoom]);

  const ActiveView = latestState && DISPLAY_VIEWS[latestState.type];

  if (connected && ActiveView) {
    return <ActiveView state={latestState} />;
  }

  // BASE_URL carries the GitHub Pages subpath (e.g. /ugoki-iro-katachi/) in
  // production and is just "/" in dev — window.location.origin alone would
  // silently drop that subpath and point the QR at a 404.
  const joinUrl = roomId ? `${window.location.origin}${import.meta.env.BASE_URL}?room=${roomId}` : null;

  return (
    <div className="screen display-screen scene-cycle">
      <div className="display-ambient">
        <span className="ambient-shape ambient-tri" />
        <span className="ambient-shape ambient-circle" />
        <span className="ambient-shape ambient-bar" />
        <span className="ambient-shape ambient-square" />
        <span className="ambient-shape ambient-tri ambient-tri-2" />
        <span className="ambient-shape ambient-circle ambient-circle-2" />
        <span className="ambient-shape ambient-bar ambient-bar-2" />
        <span className="ambient-shape ambient-square ambient-square-2" />
      </div>
      <p className="eyebrow">{connected ? 'connected — waiting to start' : 'scan to play'}</p>
      <h1>うごき、いろ、かたち。</h1>
      <div className="qr-frame">
        {joinUrl ? <QrCode value={joinUrl} size={420} /> : <p className="qr-placeholder">起動中…</p>}
      </div>
      <p className="lead">スマホで読み取ってください</p>
      {roomId && <p className="room-code">code: {roomId}</p>}
    </div>
  );
}
