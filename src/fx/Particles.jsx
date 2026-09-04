import { useEffect, useRef } from 'react';

// Shared particle engine. `mode` selects the spawn/behaviour profile so all
// five games (and the /display idle screen) can reuse one canvas system:
//   - 'pour'  : small droplets rising from the bottom, used while filling
//   - 'burst' : an outward explosion, used for success/failure moments
//   - 'idle'  : slow, low-density ambient drift, used on /display
const MODE_DEFAULTS = {
  pour: { spawnRate: 12, gravity: -0.03, life: 900, speed: 1.2, size: [2, 4] },
  burst: { spawnRate: 0, gravity: 0.12, life: 700, speed: 6, size: [3, 6] },
  idle: { spawnRate: 2, gravity: -0.01, life: 4000, speed: 0.3, size: [1, 3] },
};

function spawnParticle(config, origin, canvasWidth, canvasHeight) {
  const angle = config.mode === 'burst' ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 0.6;
  const speed = config.speed * (0.5 + Math.random());
  return {
    x: origin?.x ?? Math.random() * canvasWidth,
    y: origin?.y ?? canvasHeight,
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed,
    size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
    born: performance.now(),
    life: config.life * (0.7 + Math.random() * 0.6),
  };
}

export default function Particles({ mode = 'idle', active = true, color = '#FFC53D', origin = null, className }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const burstRequestedRef = useRef(false);

  useEffect(() => {
    if (mode === 'burst' && active) burstRequestedRef.current = true;
  }, [mode, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const config = MODE_DEFAULTS[mode] ?? MODE_DEFAULTS.idle;
    let spawnAccumulator = 0;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      if (active && config.spawnRate > 0) {
        spawnAccumulator += (config.spawnRate * dt) / 1000;
        while (spawnAccumulator >= 1) {
          particlesRef.current.push(spawnParticle({ ...config, mode }, origin, width, height));
          spawnAccumulator -= 1;
        }
      }

      if (burstRequestedRef.current) {
        const count = 24;
        for (let i = 0; i < count; i += 1) {
          particlesRef.current.push(
            spawnParticle({ ...config, mode: 'burst' }, origin ?? { x: width / 2, y: height / 2 }, width, height)
          );
        }
        burstRequestedRef.current = false;
      }

      particlesRef.current = particlesRef.current.filter((p) => now - p.born < p.life);
      for (const p of particlesRef.current) {
        p.vy += config.gravity * (dt / 16.6);
        p.x += p.vx * (dt / 16.6);
        p.y += p.vy * (dt / 16.6);
        const t = (now - p.born) / p.life;
        ctx.globalAlpha = clampAlpha(1 - t);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [mode, active, color, origin]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function clampAlpha(v) {
  return Math.min(1, Math.max(0, v));
}
