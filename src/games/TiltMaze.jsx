import { useCallback, useEffect, useRef, useState } from 'react';
import { useTilt } from '../engines/useTilt.jsx';
import { usePeerLink } from '../engines/usePeerLink.jsx';
import { startMotionTone, updateMotionTone, stopMotionTone } from '../fx/audio.js';
import ControllerView from '../screens/ControllerView.jsx';
import TiltMazeVisual, {
  BALL_RADIUS,
  GOAL,
  GOAL_RADIUS,
  LOGICAL_H,
  LOGICAL_W,
  START,
  WALLS,
  WALL_THICKNESS,
} from './TiltMazeVisual.jsx';

const DURATION_MS = 10000;
const ACCEL = 1100; // px/s^2 per unit of tilt magnitude
const DAMPING_PER_SEC = 2.2; // higher = more friction
const RESTITUTION = 0.4;

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: x1 + dx * t, y: y1 + dy * t };
}

export default function TiltMaze({ onFinish, scene }) {
  const { tilt, isFallback } = useTilt();
  const { connected, send } = usePeerLink();
  const tiltRef = useRef(tilt);
  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  const ballRef = useRef({ x: START.x, y: START.y, vx: 0, vy: 0 });
  const finishedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [ball, setBall] = useState({ x: START.x, y: START.y });
  const [status, setStatus] = useState('playing');

  const finish = useCallback(
    (cleared, clearElapsedMs) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const score = cleared ? Math.round(Math.max(30, 100 - (clearElapsedMs / DURATION_MS) * 70)) : 0;
      setStatus(cleared ? 'cleared' : 'timeup');
      onFinish?.({ score });
    },
    [onFinish]
  );

  useEffect(() => {
    const start = performance.now();
    let last = start;
    startMotionTone();
    let raf = requestAnimationFrame(tick);

    function resolveWallCollisions(b) {
      for (const wall of WALLS) {
        const closest = closestPointOnSegment(b.x, b.y, wall.x1, wall.y1, wall.x2, wall.y2);
        const dx = b.x - closest.x;
        const dy = b.y - closest.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = BALL_RADIUS + WALL_THICKNESS / 2;
        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = closest.x + nx * minDist;
          b.y = closest.y + ny * minDist;
          const velAlongNormal = b.vx * nx + b.vy * ny;
          if (velAlongNormal < 0) {
            b.vx -= (1 + RESTITUTION) * velAlongNormal * nx;
            b.vy -= (1 + RESTITUTION) * velAlongNormal * ny;
          }
        }
      }
    }

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const elapsed = now - start;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(remaining);

      const b = ballRef.current;
      const { x: tx, y: ty } = tiltRef.current;
      updateMotionTone(Math.hypot(tx, ty));
      b.vx += tx * ACCEL * dt;
      b.vy += ty * ACCEL * dt;
      const damping = Math.max(0, 1 - DAMPING_PER_SEC * dt);
      b.vx *= damping;
      b.vy *= damping;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < BALL_RADIUS) {
        b.x = BALL_RADIUS;
        b.vx *= -RESTITUTION;
      } else if (b.x > LOGICAL_W - BALL_RADIUS) {
        b.x = LOGICAL_W - BALL_RADIUS;
        b.vx *= -RESTITUTION;
      }
      if (b.y < BALL_RADIUS) {
        b.y = BALL_RADIUS;
        b.vy *= -RESTITUTION;
      } else if (b.y > LOGICAL_H - BALL_RADIUS) {
        b.y = LOGICAL_H - BALL_RADIUS;
        b.vy *= -RESTITUTION;
      }

      resolveWallCollisions(b);
      setBall({ x: b.x, y: b.y });

      const cleared = Math.hypot(b.x - GOAL.x, b.y - GOAL.y) < GOAL_RADIUS - BALL_RADIUS * 0.3;
      send({
        type: 'tiltMaze',
        scene,
        timeLeft: remaining,
        ball: { x: b.x, y: b.y },
        status: cleared ? 'cleared' : remaining <= 0 ? 'timeup' : 'playing',
        durationMs: DURATION_MS,
      });

      if (cleared) {
        finish(true, elapsed);
        return;
      }
      if (remaining <= 0) {
        finish(false, elapsed);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      stopMotionTone();
    };
  }, [finish, scene, send]);

  const hint = isFallback ? 'マウス/指で傾けて' : 'みつからないうちに';

  if (connected) {
    return (
      <ControllerView
        scene={scene}
        message={status === 'playing' ? hint : status === 'cleared' ? 'クリア!' : 'タイムアップ'}
      />
    );
  }

  return (
    <TiltMazeVisual scene={scene} timeLeft={timeLeft} ball={ball} status={status} hint={hint} durationMs={DURATION_MS} />
  );
}
