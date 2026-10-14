import { animate, inView, scroll, stagger } from 'motion';
import Lenis from 'lenis';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = [0.16, 1, 0.3, 1] as const;

// Smooth scrolling (skipped for reduced motion).
if (!reduceMotion) {
  const lenis = new Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.11 });
  window.addEventListener('menu', (e) => {
    (e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start();
  });
}

// Page-load entrance: nav drops in, the hero rule draws, corner labels rise.
const intro = document.querySelectorAll<HTMLElement>('[data-intro]');
const hairline = document.querySelector<HTMLElement>('[data-hairline]');
const introLines = document.querySelectorAll<HTMLElement>('.intro-line > span');
if (reduceMotion) {
  intro.forEach((el) => (el.style.opacity = '1'));
} else {
  animate(intro, { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0px)'] }, { duration: 0.9, ease, delay: stagger(0.06, { startDelay: 0.05 }) });
  if (hairline) animate(hairline, { transform: ['scaleX(0)', 'scaleX(1)'] }, { duration: 1.4, ease: [0.7, 0, 0.2, 1], delay: 0.5 });
  animate(introLines, { transform: ['translateY(105%)', 'translateY(0%)'] }, { duration: 1, ease, delay: stagger(0.08, { startDelay: 1.1 }) });
}

// Headline words slide up out of a mask.
document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
  const words = el.querySelectorAll('.word-mask > span');
  if (reduceMotion) return;
  animate(
    words,
    { transform: ['translateY(105%)', 'translateY(0%)'] },
    { duration: 1.1, ease, delay: stagger(0.06, { startDelay: Number(el.dataset.delay ?? 0.1) }) },
  );
});

// Fade-up reveals. Children of [data-reveal-group] stagger.
document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
  if (reduceMotion) return;
  inView(
    el,
    () => {
      const delay = Number(el.dataset.delay ?? 0);
      animate(el, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 1, ease, delay });
    },
    { margin: '0px 0px -12% 0px' },
  );
});

// Toggle .in on anything that runs CSS animations once visible (SVG draws, mock UIs).
document.querySelectorAll<HTMLElement>('[data-inview]').forEach((el) => {
  inView(el, () => el.classList.add('in'), { margin: '0px 0px -15% 0px' });
});

// Count-up numbers.
const formatter = new Intl.NumberFormat('en-US');
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals ?? 0);
  const render = (v: number) => {
    el.textContent = decimals ? v.toFixed(decimals) : formatter.format(Math.round(v));
  };
  if (reduceMotion) return render(target);
  render(0);
  inView(el, () => {
    animate(0, target, { duration: 2, ease, onUpdate: render });
  });
});

// Hero visual drifts and fades as you scroll past it.
const hero = document.querySelector<HTMLElement>('[data-hero]');
const heroArt = document.querySelector<HTMLElement>('[data-hero-art]');
if (hero && heroArt && !reduceMotion) {
  scroll(animate(heroArt, { transform: ['translateY(0px)', 'translateY(140px)'], opacity: [1, 0.15] }, { ease: 'linear' }), {
    target: hero,
    offset: ['start start', 'end start'],
  });
}

// Project cards stack: each one shrinks and dims as the next slides over it (desktop only).
const stack = document.querySelector<HTMLElement>('[data-stack]');
if (stack && !reduceMotion) {
  const wide = window.matchMedia('(min-width: 1024px)');
  const cards = Array.from(stack.querySelectorAll<HTMLElement>('[data-stack-card]'));
  const n = cards.length;
  scroll(
    (progress: number) => {
      cards.forEach((card, i) => {
        if (!wide.matches || i === n - 1) {
          card.style.transform = '';
          card.style.filter = '';
          return;
        }
        const start = i / n;
        const local = Math.min(1, Math.max(0, (progress - start) / (1 - start)));
        const target = 1 - (n - 1 - i) * 0.05;
        card.style.transform = `scale(${1 - (1 - target) * local})`;
        card.style.filter = `brightness(${1 - 0.45 * local})`;
      });
    },
    { target: stack, offset: ['start start', 'end end'] },
  );
}

// Thumbnail rows slide in opposite directions with page scroll.
document.querySelectorAll<HTMLElement>('[data-reel]').forEach((reel) => {
  const rows = reel.querySelectorAll<HTMLElement>('[data-reel-row]');
  const place = (progress: number) => {
    rows.forEach((row, i) => {
      // Start each row centred on its middle copy, then drift ±18% of one copy's width.
      const third = row.scrollWidth / 3;
      const drift = (progress - 0.5) * third * 0.36;
      row.style.transform = `translate3d(${-third + (i % 2 === 0 ? drift : -drift)}px,0,0)`;
    });
  };
  if (reduceMotion) return place(0.5);
  scroll(place, { target: reel, offset: ['start end', 'end start'] });
});

// Words brighten one by one as a paragraph scrolls through the viewport.
document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
  if (reduceMotion) return;
  const words = Array.from(el.querySelectorAll<HTMLElement>('.scrub-word'));
  const n = words.length;
  words.forEach((w) => (w.style.opacity = '0.18'));
  scroll(
    (progress: number) => {
      const lit = progress * (n + 4);
      words.forEach((w, i) => {
        w.style.opacity = String(0.18 + 0.82 * Math.min(1, Math.max(0, lit - i)));
      });
    },
    { target: el, offset: ['start 0.85', 'end 0.45'] },
  );
});

// Cursor spotlight on cards.
document.querySelectorAll<HTMLElement>('.spotlight').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Magnetic buttons (fine pointers only).
if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

// Copy email button.
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const label = btn.querySelector('[data-copy-label]');
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      if (label) {
        const prev = label.textContent;
        label.textContent = 'Copied';
        setTimeout(() => (label.textContent = prev), 1600);
      }
    } catch {
      window.location.href = `mailto:${btn.dataset.copy}`;
    }
  });
});

root.classList.add('motion-ready');
