import { animate, inView, scroll, stagger } from 'motion';
import Lenis from 'lenis';
import { startParticles } from './particles';
import { compile } from './mathexpr';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const ease = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Once per visit: smooth scrolling, the nav entrance, and page-transition hooks.
// ---------------------------------------------------------------------------

let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: true, lerp: 0.11 });
  window.addEventListener('menu', (e) => {
    (e as CustomEvent<boolean>).detail ? lenis!.stop() : lenis!.start();
  });
}

// In-page section links ("/#work" while on "/"). Smooth scrolling keeps its own scroll
// position, so a plain browser or router jump gets undone; scroll through Lenis instead.
const NAV_OFFSET = -72;
function scrollToHash(hash: string, immediate = false) {
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!target) return false;
  if (lenis) lenis.scrollTo(target, { offset: NAV_OFFSET, immediate, force: true, duration: 1.2 });
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + NAV_OFFSET, behavior: immediate || reduceMotion ? 'auto' : 'smooth' });
  return true;
}
(window as Window & { scrollToHash?: typeof scrollToHash }).scrollToHash = scrollToHash;

document.addEventListener(
  'click',
  (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    if (!document.getElementById(decodeURIComponent(url.hash.slice(1)))) return;
    // Stops the router's own jump; other click handlers (closing the mobile menu) still run.
    e.preventDefault();
    history.pushState(history.state, '', url.hash);
    // Let the mobile menu close (which restarts smooth scrolling) before scrolling.
    setTimeout(() => scrollToHash(url.hash), 0);
  },
  true,
);

const intro = document.querySelectorAll<HTMLElement>('[data-intro]');
if (reduceMotion) {
  intro.forEach((el) => (el.style.opacity = '1'));
} else {
  animate(intro, { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0px)'] }, { duration: 0.9, ease, delay: stagger(0.06, { startDelay: 0.05 }) });
}

// When a project card is clicked, name its visual so the browser morphs it into the
// case study's visual (which carries the same name).
document.addEventListener('astro:before-preparation', (e) => {
  const source = (e as Event & { sourceElement?: Element }).sourceElement;
  const card = source?.closest('[data-stack-card]');
  const visual = card?.querySelector<HTMLElement>('[data-visual]');
  if (visual) visual.style.viewTransitionName = 'project-visual';
});

// Astro replaces <html> attributes on navigation; restore the classes our CSS relies on
// before the new page paints, and reset smooth scroll to the new page.
document.addEventListener('astro:after-swap', () => {
  root.classList.add('js', 'motion-ready');
  if (lenis) {
    root.classList.add('lenis', 'lenis-smooth');
    lenis.resize();
    lenis.scrollTo(0, { immediate: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Per page: everything below runs on first load and after every navigation.
// ---------------------------------------------------------------------------

let cleanups: (() => void)[] = [];
const keep = (fn: (() => void) | void) => {
  if (typeof fn === 'function') cleanups.push(fn);
};

function init() {
  // Headline words slide up out of a mask.
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (reduceMotion) return;
    const words = el.querySelectorAll('.word-mask > span');
    animate(
      words,
      { transform: ['translateY(105%)', 'translateY(0%)'] },
      { duration: 1.1, ease, delay: stagger(0.06, { startDelay: Number(el.dataset.delay ?? 0.1) }) },
    );
  });

  // Fade-up reveals.
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (reduceMotion) return;
    keep(
      inView(
        el,
        () => {
          const delay = Number(el.dataset.delay ?? 0);
          animate(el, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 1, ease, delay });
        },
        { margin: '0px 0px -12% 0px' },
      ),
    );
  });

  // Toggle .in on anything that runs CSS animations once visible (SVG draws).
  document.querySelectorAll<HTMLElement>('[data-inview]').forEach((el) => {
    keep(inView(el, () => el.classList.add('in'), { margin: '0px 0px -15% 0px' }));
  });

  // Count-up numbers.
  const formatter = new Intl.NumberFormat('en-US');
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const render = (v: number) => (el.textContent = formatter.format(Math.round(v)));
    if (reduceMotion) return void render(target);
    render(0);
    keep(inView(el, () => void animate(0, target, { duration: 2, ease, onUpdate: render })));
  });

  // Hero visual drifts and fades as you scroll past it.
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const heroArt = document.querySelector<HTMLElement>('[data-hero-art]');
  if (hero && heroArt && !reduceMotion) {
    keep(
      scroll(animate(heroArt, { transform: ['translateY(0px)', 'translateY(140px)'], opacity: [1, 0.15] }, { ease: 'linear' }), {
        target: hero,
        offset: ['start start', 'end start'],
      }),
    );
  }

  initParticles();

  // Project cards stack: each one shrinks and dims as the next slides over it (desktop only).
  const stack = document.querySelector<HTMLElement>('[data-stack]');
  if (stack && !reduceMotion) {
    const wide = window.matchMedia('(min-width: 1024px)');
    const cards = Array.from(stack.querySelectorAll<HTMLElement>('[data-stack-card]'));
    const n = cards.length;
    keep(
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
      ),
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
    keep(scroll(place, { target: reel, offset: ['start end', 'end start'] }));
  });

  // Words brighten one by one as a paragraph scrolls through the viewport.
  document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
    if (reduceMotion) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>('.scrub-word'));
    const n = words.length;
    words.forEach((w) => (w.style.opacity = '0.18'));
    keep(
      scroll(
        (progress: number) => {
          const lit = progress * (n + 4);
          words.forEach((w, i) => {
            w.style.opacity = String(0.18 + 0.82 * Math.min(1, Math.max(0, lit - i)));
          });
        },
        { target: el, offset: ['start 0.85', 'end 0.45'] },
      ),
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

  // Magnetic buttons (fine pointers only). The nav persists across pages, so skip it here.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll<HTMLElement>('main [data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  // Copy email button.
  document.querySelectorAll<HTMLButtonElement>('main [data-copy]').forEach((btn) => {
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

  initShorts();
  root.classList.add('motion-ready');

  // Arriving with a hash (e.g. "/#work" from a case study): land on that section.
  if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash, true));
}

// ---------------------------------------------------------------------------
// Hero particles and the "Play with the math" panel.
// ---------------------------------------------------------------------------

function initParticles() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-particles]');
  if (!canvas) return;
  const labels = Array.from(document.querySelectorAll<HTMLElement>('[data-orbit-label]'));
  const ctl = startParticles(canvas, labels);
  if (!ctl) return;
  keep(() => ctl.stop());

  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-shape]'));
  const form = document.querySelector<HTMLFormElement>('[data-fn-form]');
  const input = document.querySelector<HTMLInputElement>('[data-fn-input]');
  const msg = document.querySelector<HTMLElement>('[data-fn-msg]');
  const msgDefault = msg?.innerHTML ?? '';

  ctl.onChange((i) => chips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.shape) === i))));
  canvas.addEventListener('click', () => ctl.next());
  chips.forEach((c) => c.addEventListener('click', () => ctl.show(Number(c.dataset.shape))));

  const draw = (src: string) => {
    if (!msg) return;
    try {
      ctl.plot(compile(src));
      msg.innerHTML = msgDefault;
      msg.classList.remove('text-[#ff8a8a]');
    } catch (err) {
      msg.textContent = (err as Error).message;
      msg.classList.add('text-[#ff8a8a]');
    }
  };
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input) draw(input.value);
  });
  msg?.addEventListener('click', (e) => {
    const ex = (e.target as HTMLElement).closest<HTMLElement>('[data-fn-example]')?.dataset.fnExample;
    if (ex && input) {
      input.value = ex;
      draw(ex);
    }
  });
}

// ---------------------------------------------------------------------------
// YouTube Shorts: silent preview on hover (desktop), full playback on click.
// ---------------------------------------------------------------------------

function shortsSrc(id: string, preview: boolean) {
  const params = preview
    ? `autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1&disablekb=1`
    : 'autoplay=1&playsinline=1&rel=0&modestbranding=1';
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

function initShorts() {
  document.querySelectorAll<HTMLElement>('[data-short]').forEach((tile) => {
    const id = tile.dataset.short!;
    const screen = tile.querySelector<HTMLElement>('.short-screen')!;
    const button = tile.querySelector<HTMLButtonElement>('button')!;
    let timer = 0;
    let frame: HTMLIFrameElement | null = null;

    const mount = (preview: boolean) => {
      frame?.remove();
      frame = document.createElement('iframe');
      frame.src = shortsSrc(id, preview);
      frame.title = button.getAttribute('aria-label') ?? 'YouTube Short';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.className = `absolute inset-0 h-full w-full ${preview ? 'pointer-events-none z-[5]' : 'z-20'}`;
      frame.style.border = '0';
      screen.appendChild(frame);
    };

    if (finePointer && !reduceMotion) {
      tile.addEventListener('pointerenter', () => {
        if (tile.dataset.playing) return;
        timer = window.setTimeout(() => mount(true), 350);
      });
      tile.addEventListener('pointerleave', () => {
        clearTimeout(timer);
        if (!tile.dataset.playing) {
          frame?.remove();
          frame = null;
        }
      });
    }
    button.addEventListener('click', () => {
      tile.dataset.playing = '1';
      mount(false);
      button.style.display = 'none';
    });
  });
}

// ---------------------------------------------------------------------------

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
document.addEventListener('astro:page-load', init);
