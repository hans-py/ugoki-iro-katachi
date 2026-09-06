import TiltFill from './TiltFill.jsx';
import TiltMaze from './TiltMaze.jsx';
import TimingCenter from './TimingCenter.jsx';
import TimingRhythm from './TimingRhythm.jsx';
import ShakeGauge from './ShakeGauge.jsx';
import CompassAlign from './CompassAlign.jsx';
import HoldStop from './HoldStop.jsx';
import LineTrace from './LineTrace.jsx';
import FlickSpeed from './FlickSpeed.jsx';
import HandleSteer from './HandleSteer.jsx';
import PolyClap from './PolyClap.jsx';
import SmoothLift from './SmoothLift.jsx';
import TiltFillView from './display/TiltFillView.jsx';
import TiltMazeView from './display/TiltMazeView.jsx';
import ShakeGaugeView from './display/ShakeGaugeView.jsx';
import CompassAlignView from './display/CompassAlignView.jsx';
import SmoothLiftView from './display/SmoothLiftView.jsx';
import TimingCenterView from './display/TimingCenterView.jsx';
import TimingRhythmView from './display/TimingRhythmView.jsx';
import HoldStopView from './display/HoldStopView.jsx';
import FlickSpeedView from './display/FlickSpeedView.jsx';
import HandleSteerView from './display/HandleSteerView.jsx';
import LineTraceView from './display/LineTraceView.jsx';
import PolyClapView from './display/PolyClapView.jsx';
import ResultView from '../screens/display/ResultView.jsx';

// Shared between the solo GameRunner and the duo runner — one place mapping
// a game id to its playable component, instead of two copies of the same
// 12-entry import list drifting apart.
export const GAME_COMPONENTS = {
  tiltFill: TiltFill,
  tiltMaze: TiltMaze,
  timingCenter: TimingCenter,
  timingRhythm: TimingRhythm,
  shakeGauge: ShakeGauge,
  compassAlign: CompassAlign,
  holdStop: HoldStop,
  lineTrace: LineTrace,
  flickSpeed: FlickSpeed,
  handleSteer: HandleSteer,
  polyClap: PolyClap,
  smoothLift: SmoothLift,
};

// The four vivid "scene" backgrounds, cycled by playlist position so
// consecutive rounds read like cuts between scenes in a motion-graphics
// reel — instruction card, GO flash and the game itself all share one
// scene's color for continuity.
export const SCENES = ['coral', 'cobalt', 'grass', 'magenta'];

// Games that know how to render themselves on the display from a phone's
// broadcast state — shared by the solo Display (one panel) and the duo
// Display (one panel per player).
export const DISPLAY_VIEWS = {
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
