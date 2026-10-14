import Scare from '../../fx/Scare.jsx';
import { getScareAsset } from '../../data/scares.js';

// What the display (or a duo panel) shows while a phone is being scared.
export default function ScareView({ state }) {
  return <Scare kind={state.kind} asset={getScareAsset(state.assetId)} passive />;
}
