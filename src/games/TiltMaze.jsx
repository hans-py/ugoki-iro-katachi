import { useCallback, useEffect, useRef, useState } from 'react';
import { useTilt } from '../engines/useTilt.jsx';
import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

const DURATION_MS = 10000;
const LOGICAL_W = 220;
const LOGICAL_H = 420;
const BALL_RADIUS = 10;
const GOAL_RADIUS = 18;
const ACCEL = 1100; // px/s^2 per unit of tilt magnitude
const DAMPING_PER_SEC = 2.2; // higher = more friction
const RESTITUTION = 0.4;
const WALL_THICKNESS = 6;

// A 2-wall zig-zag: wall A leaves a gap on the right, wall B leaves a gap on
// the left, so the ball must weave right-then-left to reach the goal.
// (The previous 4-wall layout left no gap at all in the second wall across
// the region the ball was funneled into — the maze was unsolvable.)
const WALLS = [
  { x1: 0, y1: 150, x2: 160, y2: 150 },
  { x1: 60, y1: 290, x2: 220, y2: 290 },
];

const START = { x: 30, y: 50 };
const GOAL = { x: 40, y: 390 };

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
  const tiltRef = useRef(tilt);
  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  const canvasRef = useRef(null);
  const ballRef = useRef({ x: START.x, y: START.y, vx: 0, vy: 0 });
  const finishedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const start = performance.now();
    let last = start;
    let raf = requestAnimationFrame(tick);

    const resize = () => {
      const scale = window.devicePixelRatio || 1;
      canvas.width = LOGICAL_W * scale;
      canvas.height = LOGICAL_H * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    function resolveWallCollisions(ball) {
      for (const wall of WALLS) {
        const closest = closestPointOnSegment(ball.x, ball.y, wall.x1, wall.y1, wall.x2, wall.y2);
        const dx = ball.x - closest.x;
        const dy = ball.y - closest.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = BALL_RADIUS + WALL_THICKNESS / 2;
        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          ball.x = closest.x + nx * minDist;
          ball.y = closest.y + ny * minDist;
          const velAlongNormal = ball.vx * nx + ball.vy * ny;
          if (velAlongNormal < 0) {
            ball.vx -= (1 + RESTITUTION) * velAlongNormal * nx;
            ball.vy -= (1 + RESTITUTION) * velAlongNormal * ny;
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

      const ball = ballRef.current;
      const { x: tx, y: ty } = tiltRef.current;
      ball.vx += tx * ACCEL * dt;
      ball.vy += ty * ACCEL * dt;
      const damping = Math.max(0, 1 - DAMPING_PER_SEC * dt);
      ball.vx *= damping;
      ball.vy *= damping;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x < BALL_RADIUS) {
        ball.x = BALL_RADIUS;
        ball.vx *= -RESTITUTION;
      } else if (ball.x > LOGICAL_W - BALL_RADIUS) {
        ball.x = LOGICAL_W - BALL_RADIUS;
        ball.vx *= -RESTITUTION;
      }
      if (ball.y < BALL_RADIUS) {
        ball.y = BALL_RADIUS;
        ball.vy *= -RESTITUTION;
      } else if (ball.y > LOGICAL_H - BALL_RADIUS) {
        ball.y = LOGICAL_H - BALL_RADIUS;
        ball.vy *= -RESTITUTION;
      }

      resolveWallCollisions(ball);

      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

      ctx.strokeStyle = 'rgba(23, 16, 43, 0.7)';
      ctx.lineWidth = WALL_THICKNESS;
      ctx.lineCap = 'round';
      for (const wall of WALLS) {
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(31, 200, 163, 0.3)';
      ctx.beginPath();
      ctx.arc(GOAL.x, GOAL.y, GOAL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1FC8A3';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#17102B';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      if (Math.hypot(ball.x - GOAL.x, ball.y - GOAL.y) < GOAL_RADIUS - BALL_RADIUS * 0.3) {
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
      window.removeEventListener('resize', resize);
    };
  }, [finish]);

  return (
    <div className={`game-screen tilt-maze scene-${scene}`}>
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }]} />

      <div className="maze-frame">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {status === 'playing' && (
        <p className="hint">{isFallback ? 'マウス/指で盤面を傾ける' : 'スマホを傾けてボールをゴールへ'}</p>
      )}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>経過 {((DURATION_MS - timeLeft) / 1000).toFixed(1)}秒</p>
        </div>
      )}
    </div>
  );
}
