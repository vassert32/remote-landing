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
   Хедер: гармошка + появление после фазы вопроса
   ========================================================================== */

let navEl: HTMLElement | null = null;
let veilEl: HTMLElement | null = null;
let lenisRef: Lenis | null = null;

/** Хедер отсутствует на фазе вопроса и выезжает вместе с перетеканием. */
function setNavAway(away: boolean): void {
  navEl?.toggleAttribute('data-away', away);
  veilEl?.toggleAttribute('data-away', away);
}

/** Сжатие: --nav-t идёт 0→1 на первых 220px скролла. */
function initNavShrink(): void {
  const targets = [navEl, veilEl].filter(Boolean) as HTMLElement[];
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { '--nav-t': 0 },
    {
      '--nav-t': 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 220, scrub: 0.3 },
    },
  );
}

/* ==========================================================================
   Lenis
   ========================================================================== */

function initLenis(): Lenis {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: -70 },
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Lenis перехватывает нативный scrollTo: наружу для отладки из консоли.
  if (import.meta.env.DEV) {
    (window as unknown as { lenis: Lenis }).lenis = lenis;
  }

  lenisRef = lenis;
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

  // На фазе вопроса хедера нет (страховку от не доехавшего мотора
  // снимает инлайн-скрипт в SiteNav).
  setNavAway(true);

  // Стартовые состояния фазы ответа задаёт мотор, а не CSS: транзформы из
  // стилей и yPercent GSAP не складываются, строки застревали бы за маской.
  gsap.set(lines, { yPercent: 110 });
  gsap.set(rises, { opacity: 0, y: 22 });
  if (doc) gsap.set(doc, { opacity: 0, y: 30 });

  const setSceneDark = (dark: boolean) => {
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
      // ВАЖНО: без invalidateOnRefresh — инвалидция при refresh стирает
      // записанные старты дочерних твинов, и вся фаза ответа замирает.
      end: () => '+=' + Math.round(window.innerHeight * 1.7),
      pin: true,
      scrub: 0.5,
      // Порог = середина перетекания фона: тема секции и хедера щёлкает там.
      onUpdate: (self) => {
        setSceneDark(self.progress < 0.33);
        setNavAway(self.progress < 0.24);
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

  // Автопрокрутка: когда вопрос допечатан, сцена сама везёт к ответу.
  // Любое действие пользователя (колесо, тач, клавиши) отменяет автопилот.
  const chars = scene.querySelectorAll('.hero__ch').length;
  const printDoneMs = 260 + chars * 42;
  let userTook = false;
  const takeOver = () => {
    userTook = true;
  };
  window.addEventListener('wheel', takeOver, { once: true, passive: true });
  window.addEventListener('touchstart', takeOver, { once: true, passive: true });
  window.addEventListener('keydown', takeOver, { once: true });

  window.setTimeout(() => {
    const y = lenisRef?.actualScroll ?? window.scrollY;
    if (userTook || y > 40) return;
    lenisRef?.scrollTo(Math.round(window.innerHeight * 1.7), {
      duration: 2.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  }, printDoneMs + 900);
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

  // GSAP масштабирует от центра, если не сказать иначе: линия прогресса
  // обязана расти от левого края.
  gsap.set(progress, { transformOrigin: 'left center', scaleX: 0 });

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

    gsap.fromTo(
      steps,
      { y: 42, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: pin, start: 'top 72%' },
      },
    );

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
    for (const step of steps) {
      gsap.fromTo(
        step,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 90%' },
        },
      );
    }
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
   Доводка скролла
   Скролл полностью свободный: колесо, тач, клавиши, скроллбар — всё
   нативное чувство Lenis. Единственное вмешательство: когда инерция
   затухает РЯДОМ с границей секции (или этапом горизонтальной сцены),
   страницу плавно докатывает до неё. Пользователь продолжил крутить —
   Lenis сам обрывает доводку, никакой борьбы за колесо.
   ========================================================================== */

function initSnapScroll(): void {
  if (!lenisRef || !finePointer.matches) return;
  const lenis = lenisRef;

  let stops: number[] = [];

  const collect = () => {
    const vh = window.innerHeight;
    const raw: number[] = [0, Math.round(vh * 1.7)]; // верх и конец hero-сцены

    for (const el of document.querySelectorAll<HTMLElement>(
      'main > section:not([data-program]), footer',
    )) {
      raw.push(Math.round(el.getBoundingClientRect().top + window.scrollY));
    }

    // Этапы горизонтального проезда Программы.
    const pin = document.querySelector<HTMLElement>('[data-program-pin]');
    const host = pin?.parentElement ?? null;
    if (host && pin) {
      const top = Math.round(host.getBoundingClientRect().top + window.scrollY);
      const travel = Math.max(0, host.getBoundingClientRect().height - vh);
      const count = document.querySelectorAll('[data-program-step]').length;
      for (let i = 0; i <= Math.max(1, count - 1); i++) {
        raw.push(Math.round(top + (travel * i) / Math.max(1, count - 1)));
      }
    }

    raw.sort((a, b) => a - b);
    stops = raw.filter((v, i) => i === 0 || v - raw[i - 1]! > 60);
  };

  collect();
  ScrollTrigger.addEventListener('refresh', collect);

  // Аккордеон FAQ меняет высоту страницы без refresh — пересчитываем сами.
  let resizeT = 0;
  new ResizeObserver(() => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(collect, 220);
  }).observe(document.body);

  let settling = false;
  let lastY = 0;
  let dir = 1;

  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    const y = lenis.actualScroll;
    if (Math.abs(y - lastY) > 0.5) dir = y > lastY ? 1 : -1;
    lastY = y;

    const speed = Math.abs(velocity);
    if (settling || speed === 0 || speed > 0.6) return;

    // Инерция затухает: вперёд по ходу тянем с трети экрана, назад — только
    // если границу едва переехали (короткое подтягивание, не откат).
    const vh = window.innerHeight;
    let best = -1;
    let bestDist = Infinity;
    for (const point of stops) {
      const d = Math.abs(point - y);
      const ahead = dir > 0 ? point >= y - 8 : point <= y + 8;
      const reach = ahead ? vh * 0.3 : vh * 0.15;
      if (d <= reach && d < bestDist) {
        bestDist = d;
        best = point;
      }
    }
    if (best < 0 || bestDist < 4) return;

    settling = true;
    lenis.scrollTo(best, {
      duration: 0.65,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        settling = false;
      },
    });
    // Юзер перехватил колесо — Lenis оборвал твин, onComplete не придёт.
    window.setTimeout(() => {
      settling = false;
    }, 900);
  });
}

/* ==========================================================================
   Общие появления
   ========================================================================== */

/** Разрезает заголовки на слова-маски и blur-абзацы на слова. Без анимаций. */
function splitTexts(): void {
  // Заголовки: слова не зависят от строк, разметка не пересобирается
  // на ресайзе и SplitText не нужен.
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    const text = el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((w) => `<span class="split-mask" aria-hidden="true"><span class="split-word">${w}</span></span>`)
      .join(' ');
  }

  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="blur"]')) {
    const text = el.textContent ?? '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((w) => `<span class="bw" aria-hidden="true">${w}</span>`)
      .join(' ');
  }
}

/* ==========================================================================
   Сцены секций (десктоп)
   То самое ощущение hero на каждом блоке: секция пинится, и пока страница
   стоит, её контент въезжает по скраблу — заголовок словами из-под маски,
   тексты собираются из блюра, панели и колонны поднимаются. Последние ~30%
   пина контент стоит целиком (холд на прочитать), затем секция отпускает.
   Никакого перехвата колеса: это просто участок пути.
   ========================================================================== */

const SCENE_SECTIONS = 'main > section:not([data-hero]):not([data-program])';

function buildScene(section: HTMLElement, opts: { pin: boolean }): void {
  section.setAttribute('data-scene', '');

  const words = section.querySelectorAll<HTMLElement>('.split-word');
  const blurWords = section.querySelectorAll<HTMLElement>('.bw');
  const rises = section.querySelectorAll<HTMLElement>('[data-reveal="up"], [data-reveal="doc"]');
  const bars = section.querySelectorAll<HTMLElement>('[data-reveal="bar"]');
  const rules = section.querySelectorAll<HTMLElement>('[data-reveal="rule"]');

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: opts.pin
      ? {
          trigger: section,
          start: 'top top',
          end: '+=72%',
          pin: true,
          scrub: 0.4,
        }
      : {
          // Финал не пинится: контент собирается по мере доезда.
          trigger: section,
          start: 'top 88%',
          end: 'top 4%',
          scrub: 0.4,
        },
  });

  if (words.length) {
    tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.3, stagger: 0.03 }, 0);
  }
  if (blurWords.length) {
    tl.fromTo(
      blurWords,
      { opacity: 0, y: 12, filter: 'blur(9px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.28, stagger: 0.012 },
      0.12,
    );
  }
  if (rises.length) {
    tl.fromTo(rises, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, 0.2);
  }
  if (bars.length) {
    tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.34, ease: 'power3.out', stagger: 0.045 }, 0.28);
  }
  if (rules.length) {
    tl.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power3.inOut' }, 0.25);
  }
  // Холд: пустой хвост таймлайна, чтобы собранный блок постоял в пине.
  tl.to({}, { duration: 0.32 });
}

/**
 * Возвращает true, когда сцены построены: обычные появления тогда не нужны.
 * На таче и узких экранах сцен нет — там прежние лёгкие появления.
 */
function initSectionScenes(): boolean {
  if (!window.matchMedia('(min-width: 901px)').matches) return false;

  for (const section of document.querySelectorAll<HTMLElement>(SCENE_SECTIONS)) {
    buildScene(section, { pin: true });
  }
  const closer = document.querySelector<HTMLElement>('footer.closer');
  if (closer) buildScene(closer, { pin: false });
  return true;
}

function initReveals(): void {
  const skip = (el: HTMLElement) => el.closest('[data-scene]') !== null;

  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    if (skip(el)) continue;
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
    if (skip(el)) continue;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  }

  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="rule"]')) {
    if (skip(el)) continue;
    gsap.to(el, {
      scaleX: 1,
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  }

  // Портрет чуть плывёт в своей рамке при проезде: глубина без шума.
  const portrait = document.querySelector<HTMLElement>('.mentor__figure img');
  if (portrait) {
    gsap.set(portrait, { scale: 1.12 });
    gsap.fromTo(
      portrait,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: portrait.closest('figure'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  }

  // Колонны Пути (вне сцен — мобайл): растут от земли каскадом.
  const bars = [...document.querySelectorAll<HTMLElement>('[data-reveal="bar"]')].filter((el) => !skip(el));
  if (bars.length) {
    gsap.fromTo(
      bars,
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: bars[0]!, start: 'top 85%' },
      },
    );
  }

  // Появление текста по словам с блюром: порт BlurText (React Bits) на GSAP.
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="blur"]')) {
    if (skip(el)) continue;
    gsap.fromTo(
      el.querySelectorAll('.bw'),
      { opacity: 0, y: 14, filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        ease: 'power2.out',
        stagger: 0.04,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      },
    );
  }
}

/**
 * Тикающие цифры: порт CountUp (React Bits) на GSAP.
 * В разметке лежит полное число (SEO и no-JS), мотор сбрасывает его в ноль
 * и пружиной докручивает при входе в кадр.
 */
function initCounters(): void {
  const fmt = new Intl.NumberFormat('ru-RU');
  for (const el of document.querySelectorAll<HTMLElement>('[data-count-to]')) {
    const to = Number(el.dataset.countTo ?? '0');
    const prefix = el.dataset.countPrefix ?? '';
    const suffix = el.dataset.countSuffix ?? '';
    const state = { v: 0 };
    const render = () => {
      el.textContent = prefix + fmt.format(Math.round(state.v)) + suffix;
    };
    render();

    ScrollTrigger.create({
      trigger: el,
      start: 'top 87%',
      once: true,
      onEnter: () => {
        gsap.to(state, {
          v: to,
          duration: 1.5,
          ease: 'expo.out',
          onUpdate: render,
        });
      },
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
  veilEl = document.querySelector<HTMLElement>('[data-nav-veil]');
  gsap.registerPlugin(ScrollTrigger);

  if (reduce.matches) {
    // Без движения хедер виден всегда; страховочный data-away снимаем.
    setNavAway(false);
    return;
  }

  document.documentElement.classList.add('motion');

  initLenis();
  initNavShrink();
  splitTexts();
  initHeroScene();
  initProgram();
  initSectionScenes();
  initReveals();
  initCounters();
  initSnapScroll();
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
