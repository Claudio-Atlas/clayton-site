// A cloud of particles that morphs between mathematical shapes, rendered on a 2D canvas.
// Shapes: an orbital atom, a saddle surface (z = x² − y²), a double helix and a torus.

type Vec = Float32Array;

const TAU = Math.PI * 2;

function rand(seed: number) {
  // Small deterministic PRNG so shapes look the same on every load.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(TAU * r());
}

function atom(n: number): Vec {
  const r = rand(1);
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number;
    if (i < n * 0.22) {
      const rad = 0.22 * Math.cbrt(r());
      const th = TAU * r();
      const ph = Math.acos(2 * r() - 1);
      x = rad * Math.sin(ph) * Math.cos(th);
      y = rad * Math.sin(ph) * Math.sin(th);
      z = rad * Math.cos(ph);
    } else {
      const ring = i % 3;
      const a = TAU * r();
      const rr = 1 + gauss(r) * 0.025;
      const lx = Math.cos(a) * rr;
      const ly = Math.sin(a) * rr * 0.32;
      const lz = gauss(r) * 0.02;
      const rot = (ring * TAU) / 3;
      x = lx * Math.cos(rot) - ly * Math.sin(rot);
      y = lx * Math.sin(rot) + ly * Math.cos(rot);
      z = lz;
    }
    p.set([x, y, z], i * 3);
  }
  return p;
}

function saddle(n: number): Vec {
  const r = rand(2);
  const p = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const u = ((i % side) / (side - 1)) * 2 - 1 + (r() - 0.5) * 0.01;
    const v = (Math.floor(i / side) / (side - 1)) * 2 - 1 + (r() - 0.5) * 0.01;
    p.set([u * 1.05, (u * u - v * v) * 0.55, v * 1.05], i * 3);
  }
  return p;
}

function helix(n: number): Vec {
  const r = rand(3);
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = r();
    const a = t * TAU * 2.4;
    const y = (t - 0.5) * 2.3;
    const kind = i % 10;
    let x: number, z: number;
    if (kind < 4) {
      x = Math.cos(a) * 0.55;
      z = Math.sin(a) * 0.55;
    } else if (kind < 8) {
      x = Math.cos(a + Math.PI) * 0.55;
      z = Math.sin(a + Math.PI) * 0.55;
    } else {
      // Rungs between the strands.
      const rung = Math.round(t * 28) / 28;
      const ra = rung * TAU * 2.4;
      const s = r() * 2 - 1;
      x = Math.cos(ra) * 0.55 * s;
      z = Math.sin(ra) * 0.55 * s;
      p.set([x, (rung - 0.5) * 2.3, z], i * 3);
      continue;
    }
    p.set([x + gauss(r) * 0.02, y, z + gauss(r) * 0.02], i * 3);
  }
  return p;
}

function torus(n: number): Vec {
  const r = rand(4);
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = TAU * r();
    const v = TAU * r();
    const R = 0.72;
    const rr = 0.3;
    p.set([(R + rr * Math.cos(v)) * Math.cos(u), rr * Math.sin(v), (R + rr * Math.cos(v)) * Math.sin(u)], i * 3);
  }
  return p;
}

// Sample z = f(x, y) on a grid over [-3, 3]² and scale it to fit the camera.
export function surface(n: number, f: (x: number, y: number) => number): Vec {
  const p = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  const zs = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    const u = ((i % side) / (side - 1)) * 2 - 1;
    const v = (Math.floor(i / side) / (side - 1)) * 2 - 1;
    let z = f(u * 3, v * 3);
    if (!Number.isFinite(z)) z = NaN;
    zs[i] = z;
    if (Number.isFinite(z)) max = Math.max(max, Math.abs(z));
  }
  const k = max > 0 ? 0.75 / max : 0;
  for (let i = 0; i < n; i++) {
    const u = ((i % side) / (side - 1)) * 2 - 1;
    const v = (Math.floor(i / side) / (side - 1)) * 2 - 1;
    // Points where f is undefined collapse onto the floor rather than disappearing.
    const z = Number.isFinite(zs[i]) ? zs[i] * k : -0.9;
    p.set([u * 1.05, -z, v * 1.05], i * 3);
  }
  return p;
}

export const SHAPES = ['Atom', 'Saddle', 'Helix', 'Torus'] as const;

export interface ParticleController {
  /** Morph to a built-in shape by index. */
  show(index: number): void;
  /** Morph to the next built-in shape. */
  next(): void;
  /** Morph to the surface z = f(x, y). */
  plot(f: (x: number, y: number) => number): void;
  /** Called with the active shape index, or -1 for a custom function. */
  onChange(cb: (index: number) => void): void;
  stop(): void;
}

export function startParticles(canvas: HTMLCanvasElement, labels: HTMLElement[] = []): ParticleController | undefined {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 767px)').matches;
  const N = small ? 2600 : 5200;
  const shapes = [atom(N), saddle(N), helix(N), torus(N)];
  // Tilt applied per shape so each reads well from the default camera.
  const tilts = [0.9, 0.35, 0.15, 0.55];
  const CUSTOM_TILT = 0.45;
  const seeds = new Float32Array(N).map((_, i) => (i * 9301 + 49297) % 233280 / 233280);

  let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, radius = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Match the CSS lg breakpoint (viewport width, scrollbar included), not the canvas width.
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    // Between 1024 and 1279px the text column is close to the shape, so keep it smaller and further right.
    const snug = wide && !window.matchMedia('(min-width: 1280px)').matches;
    cx = w * (wide ? (snug ? 0.77 : 0.73) : 0.5);
    cy = h * (wide ? (snug ? 0.3 : 0.33) : 0.42);
    radius = Math.min(w * (wide ? (snug ? 0.16 : 0.2) : 0.32), h * (wide ? (snug ? 0.21 : 0.24) : 0.26));
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let mx = 0, my = 0, tmx = 0, tmy = 0;
  const onPointer = (e: PointerEvent) => {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(canvas);

  const HOLD = 5.5;
  const MORPH = 2.2;
  // After a visitor picks a shape, leave it alone this long before auto-cycling resumes.
  const USER_HOLD = 14;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const colors = ['#2f6bff', '#5b8cff', '#7dd3fc', '#e8f0ff'];
  const start = performance.now();
  const clock = () => (performance.now() - start) / 1000;

  // Morph state: blend from A to B starting at mStart. `cur` holds the last drawn positions,
  // so a new morph can start from wherever the cloud is right now.
  let A: Vec = shapes[0];
  let B: Vec = shapes[0];
  let tiltA = tilts[0], tiltB = tilts[0];
  let mStart = -MORPH;
  let index = 0;
  let nextAuto = HOLD;
  const cur = new Float32Array(shapes[0]);
  let listener: (i: number) => void = () => {};

  const morphTo = (target: Vec, tilt: number, i: number, hold: number) => {
    const t = clock();
    A = new Float32Array(cur);
    const m = Math.min(1, Math.max(0, (t - mStart) / MORPH));
    tiltA = tiltA + (tiltB - tiltA) * ease(m);
    B = target;
    tiltB = tilt;
    mStart = t;
    index = i;
    nextAuto = t + MORPH + hold;
    listener(i);
  };

  let raf = 0;
  let stopped = false;

  const frame = () => {
    if (stopped) return;
    if (!reduce) raf = requestAnimationFrame(frame);
    if (!visible && !reduce) return;
    const t = reduce ? 0 : clock();

    if (!reduce && t >= nextAuto) {
      const i = index < 0 ? 0 : (index + 1) % shapes.length;
      morphTo(shapes[i], tilts[i], i, HOLD);
    }
    const m = reduce ? 1 : ease(Math.min(1, Math.max(0, (t - mStart) / MORPH)));
    const tilt = tiltA + (tiltB - tiltA) * m;

    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    const ry = t * 0.18 + mx * 0.5;
    const rx = tilt + my * 0.25;
    const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Ripples on the "water" below the shape.
    const baseY = cy + radius * 1.35;
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5; i++) {
      const q = ((t * 0.12 + i / 5) % 1);
      const rr = radius * (0.25 + q * 2.2);
      ctx.beginPath();
      ctx.ellipse(cx, baseY, rr, rr * 0.16, 0, 0, TAU);
      ctx.strokeStyle = `rgba(80,130,255,${(1 - q) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Soft elliptical glow: a circular gradient squashed vertically, so it has no hard edges.
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(1, 0.22);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.8);
    glow.addColorStop(0, 'rgba(60,110,255,0.24)');
    glow.addColorStop(1, 'rgba(60,110,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-radius * 1.8, -radius * 1.8, radius * 3.6, radius * 3.6);
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';
    const f = 3.2;
    for (let c = 0; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
      for (let i = c; i < N; i += colors.length) {
        const j = i * 3;
        const s = seeds[i];
        const wob = Math.sin(t * 1.3 + s * 40) * 0.012;
        const x = A[j] + (B[j] - A[j]) * m;
        const y = A[j + 1] + (B[j + 1] - A[j + 1]) * m;
        const z = A[j + 2] + (B[j + 2] - A[j + 2]) * m;
        cur[j] = x;
        cur[j + 1] = y;
        cur[j + 2] = z;
        // Rotate around Y, then X.
        const x1 = (x + wob) * cyr + z * syr;
        const z1 = -(x + wob) * syr + z * cyr;
        const y2 = (y + wob) * cxr - z1 * sxr;
        const z2 = (y + wob) * sxr + z1 * cxr;
        const sc = f / (f + z2);
        const px = cx + x1 * radius * sc;
        const py = cy + y2 * radius * sc;
        const size = (c === 3 ? 1.6 : 1.1) * sc;
        ctx.globalAlpha = Math.min(1, 0.35 + (1 - z2) * 0.35);
        ctx.fillRect(px, py, size, size);
      }
    }
    ctx.globalAlpha = 1;

    // Floating labels orbit the shape.
    labels.forEach((el, i) => {
      const a = t * 0.25 + (i / labels.length) * TAU;
      const lx = Math.cos(a) * 1.3;
      const lz = Math.sin(a) * 1.3;
      const ly = Math.sin(a * 2 + i) * 0.25;
      const sc = f / (f + lz * 0.6);
      el.style.transform = `translate(${cx + lx * radius * sc}px, ${cy + ly * radius * sc}px) translate(-50%, -50%) scale(${0.85 + (sc - 1) * 0.8})`;
      el.style.opacity = String(Math.max(0.25, Math.min(1, 0.65 - lz * 0.35)));
      el.style.zIndex = lz < 0 ? '2' : '0';
    });
  };
  raf = requestAnimationFrame(frame);

  const redrawIfStill = () => {
    if (reduce) requestAnimationFrame(frame);
  };

  return {
    show(i) {
      morphTo(shapes[i], tilts[i], i, USER_HOLD);
      redrawIfStill();
    },
    next() {
      this.show(index < 0 ? 0 : (index + 1) % shapes.length);
    },
    plot(fn) {
      morphTo(surface(N, fn), CUSTOM_TILT, -1, USER_HOLD * 2);
      redrawIfStill();
    },
    onChange(cb) {
      listener = cb;
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
    },
  };
}
