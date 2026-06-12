/**
 * Tiny dependency-free confetti burst. Fire-and-forget:
 *   celebrate(event)  — bursts from the click position
 *   celebrate()       — bursts from the center of the viewport
 * Respects prefers-reduced-motion (no-op).
 */

const COLORS = ["#6366f1", "#818cf8", "#a855f7", "#f59e0b", "#10b981", "#f43f5e", "#06b6d4"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: 0 | 1;
  life: number;
};

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx?.scale(devicePixelRatio, devicePixelRatio);
  };
  resize();
  window.addEventListener("resize", resize);
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
  if (particles.length === 0) {
    raf = 0;
    canvas.remove();
    canvas = null;
    ctx = null;
    return;
  }
  for (const p of particles) {
    p.vy += 0.22; // gravity
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.fillStyle = p.color;
    if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  raf = requestAnimationFrame(tick);
}

/** Track the last pointer-down so event-less callers still burst from the right spot. */
let lastPointer: { x: number; y: number } | null = null;
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
    },
    { capture: true, passive: true },
  );
}

export function celebrate(e?: { clientX?: number; clientY?: number } | null, count = 56) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ensureCanvas();
  const x = e?.clientX ?? lastPointer?.x ?? window.innerWidth / 2;
  const y = e?.clientY ?? lastPointer?.y ?? window.innerHeight / 3;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 0 : 1,
      life: 70 + Math.random() * 40,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
