// Confetti: a full-screen canvas that bursts when a task is ticked off, when someone types the
// Konami code (up up down down left right left right b a), or from quick search ("party").
// Pure canvas, no library. Nothing shows when the device asks for reduced motion.
import { useEffect, useRef } from 'react';

const CELEBRATE = 'engtrack:celebrate';
type Burst = { x?: number; y?: number; big?: boolean };

/** Throws confetti from a point on screen (defaults to the middle), or a full party with `big`. */
export const celebrate = (b: Burst = {}) => window.dispatchEvent(new CustomEvent<Burst>(CELEBRATE, { detail: b }));

const COLOURS = ['#c72a6b', '#3b0f27', '#f2b705', '#2fb67c', '#3a7bd5', '#ff7a59', '#9b5de5'];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

type Bit = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; life: number; round: boolean };

const reduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let bits: Bit[] = [];
    let frame = 0;

    const size = () => {
      const d = window.devicePixelRatio || 1;
      canvas.width = innerWidth * d;
      canvas.height = innerHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits = bits.filter((b) => b.life > 0 && b.y < innerHeight + 40);
      for (const b of bits) {
        b.vy += 0.22;
        b.vx *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        b.life -= 1;
        ctx.save();
        ctx.globalAlpha = Math.min(1, b.life / 40);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        if (b.round) {
          ctx.beginPath();
          ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Squash on one axis so the paper looks like it flips as it falls.
          ctx.fillRect(-b.w / 2, (-b.h / 2) * Math.cos(b.r * 2), b.w, b.h * Math.cos(b.r * 2));
        }
        ctx.restore();
      }
      frame = bits.length ? requestAnimationFrame(tick) : 0;
    };

    const add = (x: number, y: number, n: number, spread: number, up: number) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        const v = up * (0.6 + Math.random() * 0.7);
        bits.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: COLOURS[(Math.random() * COLOURS.length) | 0],
          life: 140 + Math.random() * 80, round: Math.random() < 0.25,
        });
      }
    };

    const onCelebrate = (e: Event) => {
      if (reduced()) return;
      const d = (e as CustomEvent<Burst>).detail ?? {};
      if (d.big) {
        add(0, innerHeight, 120, 1.2, 22);
        add(innerWidth, innerHeight, 120, 1.2, 22);
        // Left cannon fires right, right cannon fires left.
        bits.slice(-240).forEach((b) => { b.vx = b.x < innerWidth / 2 ? Math.abs(b.vx) + 4 : -Math.abs(b.vx) - 4; });
      } else {
        add(d.x ?? innerWidth / 2, d.y ?? innerHeight / 2, 40, 1.6, 9);
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    let typed: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      typed = [...typed, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
      if (typed.join() === KONAMI.join()) {
        typed = [];
        celebrate({ big: true });
      }
    };

    size();
    addEventListener('resize', size);
    addEventListener(CELEBRATE, onCelebrate);
    addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', size);
      removeEventListener(CELEBRATE, onCelebrate);
      removeEventListener('keydown', onKey);
    };
  }, []);

  return <canvas ref={ref} aria-hidden data-testid="confetti" className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />;
}
