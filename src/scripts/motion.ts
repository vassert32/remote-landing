/**
 * Движение страницы: Lenis (инерционный скролл) + GSAP ScrollTrigger.
 *
 * Правила:
 *  - модуль грузится отложенно и ничего не ломает, если не загрузился;
 *  - класс .motion ставится только здесь, поэтому контент по умолчанию
 *    видим и читаем без JS (включая hero: две фазы обычными экранами);
 *  - при prefers-reduced-motion не запускается ничего, кроме темы хедера.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const COAL = '#0c0c0a';
const PAPER = '#f2f1ed';

/* ==========================================================================
   Хедер: гармошка + хамелеон
   ========================================================================== */

/** Сжатие: --nav-t идёт 0→1 на первых 220px скролла. */
function initNavShrink(nav: HTMLElement): void {
  gsap.fromTo(
    nav,
    { '--nav-t': 0 },
    {
      '--nav-t': 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 220, scrub: 0.3 },
    },
  );
}

/**
 * Тема хедера. Считаем, сколько тёмных зон сейчас лежит под линией хедера.
 * Статичные тёмные секции дают вклад через собственные триггеры, hero — через
 * колбэк сцены (его фон меняется по прогрессу, а не по границам секции).
 */
const darkZones = new Set<string>();
let navEl: HTMLElement | null = null;

function setDarkZone(id: string, active: boolean): void {
  if (active) darkZones.add(id);
  else darkZones.delete(id);
  navEl?.toggleAttribute('data-on-dark', darkZones.size > 0);
}

function initNavTheme(): void {
  document
    .querySelectorAll<HTMLElement>('[data-band="dark"]:not([data-hero])')
    .forEach((section, n) => {
      ScrollTrigger.create({
        trigger: section,
        // Линия хедера: ~56px от верха вьюпорта.
        start: 'top 56px',
        end: 'bottom 56px',
        onToggle: (self) => setDarkZone(`band-${n}`, self.isActive),
      });
    });
}

/* ==========================================================================
   Lenis
   ========================================================================== */

function initLenis(): Lenis {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: -80 },
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Lenis перехватывает нативный scrollTo: наружу для отладки из консоли.
  if (import.meta.env.DEV) {
    (window as unknown as { lenis: Lenis }).lenis = lenis;
  }

  return lenis;
}

/* ==========================================================================
   Hero: вопрос → перетекание фона → ответ
   ========================================================================== */

function initHeroScene(): void {
  const scene = document.querySelector<HTMLElement>('[data-hero]');
  if (!scene) return;

  const stage = scene.querySelector<HTMLElement>('.hero__stage');
  const question = scene.querySelector<HTMLElement>('[data-hero-question]');
  if (!stage || !question) return;

  const lines = scene.querySelectorAll<HTMLElement>('[data-hero-line]');
  const rises = scene.querySelectorAll<HTMLElement>('[data-hero-rise]');
  const doc = scene.querySelector<HTMLElement>('[data-hero-doc]');
  const stamp = scene.querySelector<HTMLElement>('[data-hero-stamp]');

  // Пока страница не скроллилась, hero тёмный: вклад в тему хедера сразу.
  setDarkZone('hero', true);

  // Стартовые состояния фазы ответа задаёт мотор, а не CSS: транзформы из
  // стилей и yPercent GSAP не складываются, строки застревали бы за маской.
  gsap.set(lines, { yPercent: 110 });
  gsap.set(rises, { opacity: 0, y: 22 });
  if (doc) gsap.set(doc, { opacity: 0, y: 30 });

  const setSceneDark = (dark: boolean) => {
    setDarkZone('hero', dark);
    if (dark) scene.setAttribute('data-band', 'dark');
    else scene.removeAttribute('data-band');
  };

  // Фон ведём руками по прогрессу, а не под-твином: прямой set не зависит
  // от инвалидции таймлайна при refresh и не может «застрять».
  const mixBg = gsap.utils.pipe(
    gsap.utils.mapRange(0.2, 0.46, 0, 1),
    gsap.utils.clamp(0, 1),
    gsap.utils.interpolate(COAL, PAPER),
  );

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      // Длина сцены в явных пикселях: проценты считались бы от высоты
      // двухэкранного стейджа и раздували путь до 2.5 вьюпортов.
      end: () => '+=' + Math.round(window.innerHeight * 1.7),
      invalidateOnRefresh: true,
      pin: true,
      scrub: 0.5,
      // Порог = середина перетекания фона: тема секции и хедера щёлкает там.
      onUpdate: (self) => {
        setSceneDark(self.progress < 0.33);
        gsap.set(scene, { backgroundColor: mixBg(self.progress) });
      },
    },
  });

  // Фаза 1: вопрос уходит вверх и тает.
  tl.to(question, { yPercent: -30, autoAlpha: 0, duration: 0.3 }, 0.06);

  // Фаза 2: ответ. Строки из-под маски, текст и кнопки поднимаются, документ въезжает.
  tl.to(lines, { yPercent: 0, duration: 0.2, ease: 'power2.out', stagger: 0.045 }, 0.5);
  tl.to(rises, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out', stagger: 0.04 }, 0.58);
  if (doc) tl.to(doc, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.6);

  // Печать прикладывается в конце: быстрый удар, а не проявление.
  if (stamp) {
    tl.fromTo(
      stamp,
      { opacity: 0, rotate: -14, scale: 1.6 },
      { opacity: 1, rotate: -6, scale: 1, duration: 0.08, ease: 'power3.in' },
      0.88,
    );
  }
}

/* ==========================================================================
   Программа: горизонтальная сцена (десктоп), счётчик, прогресс
   ========================================================================== */

function initProgram(): void {
  const root = document.querySelector<HTMLElement>('[data-program]');
  if (!root) return;

  const steps = [...root.querySelectorAll<HTMLElement>('[data-program-step]')];
  const digits = root.querySelector<HTMLElement>('[data-program-digits]');
  const progress = root.querySelector<HTMLElement>('[data-program-progress]');
  if (!steps.length || !digits || !progress) return;

  const digitEls = [...digits.children] as HTMLElement[];
  let active = -1;

  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    steps.forEach((s, n) => s.classList.toggle('is-active', n === index));
    const target = digitEls[index];
    if (target) {
      gsap.to(digits, { y: -target.offsetTop, duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' });
    }
  };

  const mm = gsap.matchMedia();

  // Десктоп: пин + горизонтальный проезд.
  mm.add('(min-width: 901px)', () => {
    const pin = root.querySelector<HTMLElement>('[data-program-pin]');
    const track = root.querySelector<HTMLElement>('[data-program-track]');
    if (!pin || !track) return;
    const dist = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(progress, { scaleX: self.progress });
          setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
        },
      },
    });
    setActive(0);
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  });

  // Мобайл и планшет: вертикальный список, активный этап по центру экрана.
  mm.add('(max-width: 900px)', () => {
    const triggers = steps.map((step, n) =>
      ScrollTrigger.create({
        trigger: step,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => self.isActive && setActive(n),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  });
}

/* ==========================================================================
   Общие появления
   ========================================================================== */

function initReveals(): void {
  // Заголовки выезжают по словам из-под маски: слова не зависят от строк,
  // поэтому разметка не пересобирается на ресайзе и SplitText не нужен.
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    const text = el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((w) => `<span class="split-mask" aria-hidden="true"><span class="split-word">${w}</span></span>`)
      .join(' ');

    gsap.fromTo(
      el.querySelectorAll('.split-word'),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 86%' },
      },
    );
  }

  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="up"], [data-reveal="doc"]')) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  }

  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="rule"]')) {
    gsap.to(el, {
      scaleX: 1,
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  }

  const stems = document.querySelectorAll<HTMLElement>('[data-reveal="stem"]');
  if (stems.length) {
    gsap.to(stems, {
      scaleY: 1,
      duration: 1.0,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: stems[0]!, start: 'top 85%' },
    });
  }
}

/* ==========================================================================
   Курсор: точка + кольцо (десктоп с мышью)
   ========================================================================== */

function initCursor(): void {
  const cursor = document.querySelector<HTMLElement>('[data-cursor-root]');
  if (!cursor) return;
  const dot = cursor.querySelector<HTMLElement>('.cursor__dot');
  const ring = cursor.querySelector<HTMLElement>('.cursor__ring');
  if (!dot || !ring) return;

  document.documentElement.classList.add('has-cursor');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power3.out' });

  let seen = false;
  window.addEventListener('pointermove', (e) => {
    if (!seen) {
      seen = true;
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      cursor.classList.add('is-on');
    }
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  document.documentElement.addEventListener('pointerenter', () => {
    if (seen) cursor.classList.add('is-on');
  });

  // Кольцо реагирует на интерактив. Делегирование: разметка не расширяется.
  const HOT = 'a, button, summary, [data-cursor-grow]';
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hot', !!(e.target as Element).closest(HOT));
  });
}

/* ==========================================================================
   Магнетик-кнопки
   ========================================================================== */

function initMagnetic(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    const toX = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' });
    const toY = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      toX((e.clientX - (r.left + r.width / 2)) * 0.18);
      toY((e.clientY - (r.top + r.height / 2)) * 0.28);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
    });
  }
}

/* ==========================================================================
   Запуск
   ========================================================================== */

function boot(): void {
  navEl = document.querySelector<HTMLElement>('[data-nav]');
  gsap.registerPlugin(ScrollTrigger);

  if (reduce.matches) {
    // Без движения: тема хедера всё равно должна следовать за фоном.
    initNavTheme();
    setDarkZone('hero', true);
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (hero) {
      ScrollTrigger.create({
        trigger: hero,
        start: 'top 56px',
        end: 'bottom 56px',
        onToggle: (self) => setDarkZone('hero', self.isActive),
      });
    }
    return;
  }

  document.documentElement.classList.add('motion');

  initLenis();
  if (navEl) initNavShrink(navEl);
  initHeroScene();
  initProgram();
  initReveals();
  // Тема хедера считается по границам секций: создаём эти триггеры после
  // пинов, чтобы границы сразу учитывали пин-спейсеры.
  initNavTheme();
  ScrollTrigger.refresh();
  if (finePointer.matches) {
    initCursor();
    initMagnetic();
  }

  // Пересчёт после стабилизации высот: шрифты и отложенные картинки.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
