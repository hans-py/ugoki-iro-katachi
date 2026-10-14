import { useEffect, useRef } from 'react';
import Hud from '../screens/Hud.jsx';
import Impact from '../fx/Impact.jsx';

export const LOGICAL_W = 220;
export const LOGICAL_H = 420;
export const BALL_RADIUS = 10;
export const GOAL_RADIUS = 18;
export const WALL_THICKNESS = 6;

// A 2-wall zig-zag: wall A leaves a gap on the right, wall B leaves a gap on
// the left, so the ball must weave right-then-left to reach the goal.
export const WALLS = [
  { x1: 0, y1: 150, x2: 160, y2: 150 },
  { x1: 60, y1: 290, x2: 220, y2: 290 },
];

export const START = { x: 30, y: 50 };
export const GOAL = { x: 40, y: 390 };

// Shared between the phone's own maze screen and the display's mirrored
// view — the phone owns the physics simulation and passes down just the
// ball's current position each frame; this only draws.
export default function TiltMazeVisual({ scene, timeLeft, ball, status, hint, durationMs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * scale;
    canvas.height = LOGICAL_H * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ball) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = WALL_THICKNESS;
    ctx.lineCap = 'round';
    for (const wall of WALLS) {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }

    // The goal is a dark hole and the thing being rolled is an eyeball whose
    // pupil keeps looking at the hole — same physics, different meaning.
    ctx.fillStyle = 'rgba(255, 20, 20, 0.28)';
    ctx.beginPath();
    ctx.arc(GOAL.x, GOAL.y, GOAL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF1414';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS * 1.35, 0, Math.PI * 2);
    ctx.fill();

    const lookX = GOAL.x - ball.x;
    const lookY = GOAL.y - ball.y;
    const lookLen = Math.hypot(lookX, lookY) || 1;
    const px = ball.x + (lookX / lookLen) * 4;
    const py = ball.y + (lookY / lookLen) * 4;
    ctx.fillStyle = '#FF1414';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0B0B0F';
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }, [ball]);

  return (
    <div className={`game-screen tilt-maze scene-${scene}`}>
      <Hud items={[{ label: 'TIME', value: `${(timeLeft / 1000).toFixed(1)}s` }]} />

      <div className="maze-frame">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {status === 'playing' && <p className="hint">{hint}</p>}

      {status !== 'playing' && (
        <div className="result-overlay">
          {status === 'cleared' && <Impact />}
          <h2>{status === 'cleared' ? 'クリア!' : 'タイムアップ'}</h2>
          <p>経過 {((durationMs - timeLeft) / 1000).toFixed(1)}秒</p>
        </div>
      )}
    </div>
  );
}
