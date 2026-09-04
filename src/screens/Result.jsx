import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTitle } from '../data/titles.js';
import { playBoom } from '../fx/audio.js';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import ResultVisual from './ResultVisual.jsx';
import ControllerView from './ControllerView.jsx';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, send } = usePeerLink();
  // location.state is stable per navigation, so memoizing on it (rather
  // than on the derived array) keeps `scores` referentially stable and
  // stops the effect below from re-firing on every render.
  const scores = useMemo(() => location.state?.scores ?? [], [location.state]);
  const playedRef = useRef(false);

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const title = scores.length > 0 ? getTitle(total) : null;

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

  if (scores.length === 0) return null;

  if (connected) {
    return (
      <ControllerView
        scene="grass"
        message={title}
        sub={`${total} / 500 — けっかはディスプレイで!`}
        actionLabel="もう一度"
        onAction={() => navigate('/')}
      />
    );
  }

  return <ResultVisual title={title} total={total} scores={scores} onRestart={() => navigate('/')} />;
}
