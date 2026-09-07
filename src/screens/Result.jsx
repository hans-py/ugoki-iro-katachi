import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTitle } from '../data/titles.js';
import { playBoom } from '../fx/audio.js';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import ResultVisual from './ResultVisual.jsx';
import ControllerView from './ControllerView.jsx';

// If nobody touches "もう一度", the phone (and, if paired, the shared
// display) would otherwise sit on this result forever — at an unattended
// exhibit that's the display stuck showing one visitor's score, unable to
// show the QR for the next person. Auto-return covers whoever just walks
// off with their phone.
const RETURN_TO_START_MS = 8000;

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, send, leaveRoom } = usePeerLink();
  // location.state is stable per navigation, so memoizing on it (rather
  // than on the derived array) keeps `scores` referentially stable and
  // stops the effect below from re-firing on every render.
  const scores = useMemo(() => location.state?.scores ?? [], [location.state]);
  const playedRef = useRef(false);

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const title = scores.length > 0 ? getTitle(total) : null;

  const restart = useCallback(() => {
    // Harmless when not paired (leaveRoom is a no-op with nothing to tear
    // down) — freeing the room the moment anyone leaves, not just in duo
    // mode, is what lets the display's QR come back for the next visitor.
    leaveRoom();
    navigate('/');
  }, [leaveRoom, navigate]);

  useEffect(() => {
    // Reached directly (e.g. a page refresh) without playing — there is no
    // score to show, so send back to Start instead of a misleading result.
    if (scores.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    if (playedRef.current) return;
    playedRef.current = true;
    playBoom();
    send({ type: 'result', title, total, scores });
  }, [scores, total, title, navigate, send]);

  useEffect(() => {
    if (scores.length === 0) return;
    const timer = setTimeout(restart, RETURN_TO_START_MS);
    return () => clearTimeout(timer);
  }, [scores, restart]);

  if (scores.length === 0) return null;

  if (connected) {
    return (
      <ControllerView
        scene="grass"
        message={title}
        sub={`${total} / 500 — けっかはディスプレイで!`}
        actionLabel="もう一度"
        onAction={restart}
      />
    );
  }

  return <ResultVisual title={title} total={total} scores={scores} onRestart={restart} />;
}
