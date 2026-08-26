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
import Snap from 'lenis/snap';
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

  // Отладочный хэндл под своим именем: window.lenis занят служебным
  // реестром самого Lenis ({version, horizontal, snap, touch}), и запись
  // инстанса туда ломает его собственную бухгалтерию и аддоны.
  if (import.meta.env.DEV) {
    (window as unknown as { __lenis: Lenis }).__lenis = lenis;
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
  // Лист приходит из-за нижней кромки экрана: это подача документа,
  // а не появление карточки интерфейса.
  if (doc) gsap.set(doc, { opacity: 0, y: () => window.innerHeight * 0.62, rotate: 1.5 });

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
  // Лист подаётся ПОСЛЕ основного текста и заметно спокойнее его: сначала
  // читаешь обещание, потом получаешь на руки бумагу.
  if (doc) tl.to(doc, { opacity: 1, y: 0, rotate: 0, duration: 0.46, ease: 'power2.out' }, 0.72);

  // Печать прикладывается в конце: быстрый удар, а не проявление.
  if (stamp) {
    tl.fromTo(
      stamp,
      { opacity: 0, rotate: -14, scale: 1.6 },
      { opacity: 1, rotate: -6, scale: 1, duration: 0.08, ease: 'power3.in' },
      1.2,
    );
  }

  /*
   * Сторож сцены. Общий снап Lenis работает по близости и внутри длинной
   * сцены молчит — можно застрять в полусвете перетекания. Здесь состояний
   * ровно два: вопрос и ответ. Зоны не пересекаются с общим снапом: тот
   * отвечает за секции от Ментора и ниже.
   *
   * Остановку ловим по НЕПОДВИЖНОСТИ позиции: Lenis шлёт события скролла
   * каждый кадр даже на стоящей странице, поэтому дебаунс на событиях не
   * срабатывает никогда, а порог скорости не ловит момент.
   */
  const sceneEnd = () => Math.round(window.innerHeight * 1.7);
  let heroSnapping = false;
  let lastInput = 0;
  for (const evt of ['wheel', 'touchstart', 'touchmove', 'keydown'] as const) {
    window.addEventListener(evt, () => {
      lastInput = performance.now();
    }, { passive: true });
  }

  const TICK = 120;
  let lastPos = -1;
  let stillFor = 0;

  window.setInterval(() => {
    if (heroSnapping || !lenisRef) return;

    const end = sceneEnd();
    const y = lenisRef.actualScroll;
    // Только строго внутри сцены: на краях и ниже сторож молчит.
    if (y <= 6 || y >= end - 6) {
      lastPos = y;
      stillFor = 0;
      return;
    }

    stillFor = Math.abs(y - lastPos) < 1.5 ? stillFor + TICK : 0;
    lastPos = y;
    if (stillFor < 240) return;
    if (performance.now() - lastInput < 200) return;

    // Куда ближе, туда и садимся: без рывков против направления чтения.
    const target = y > end * 0.42 ? end : 0;
    stillFor = 0;
    heroSnapping = true;
    lenisRef.scrollTo(target, {
      duration: 0.75,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      onComplete: () => {
        heroSnapping = false;
      },
    });
    window.setTimeout(() => {
      heroSnapping = false;
    }, 1200);
  }, TICK);

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
    // Порог щедрый: важно лишь, что пользователь ещё не уехал сам.
    if (userTook || y > window.innerHeight * 0.25) return;
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
   Снап позиций
   Каждая секция ростом с экран, поэтому остановка «между» показывает
   полоску соседней и читается поломкой. Лечим родным аддоном Lenis:
   он живёт ВНУТРИ его физики скролла, а не догоняет страницу отдельной
   анимацией после остановки — именно это раздражало в самодельных
   версиях. Тип proximity: тянет только когда граница уже рядом, при
   быстром пролистывании молчит.
   ========================================================================== */

function initSnap(lenis: Lenis): void {
  const snap = new Snap(lenis, {
    type: 'proximity',
    // Тянет, когда граница в пределах 40% экрана. Дальше — не трогает:
    // быстрый пролёт через несколько секций остаётся свободным.
    distanceThreshold: '40%',
    duration: 0.9,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
    debounce: 260,
  });

  // Точек hero здесь нет: за сцену отвечает отдельный сторож ниже.
  // Общий снап работает от Ментора и дальше.

  // Обычные секции: начало секции = её контент по центру экрана,
  // потому что внутри он отцентрован вёрсткой.
  for (const el of document.querySelectorAll<HTMLElement>(
    'main section:not([data-hero]):not([data-program]), footer.closer',
  )) {
    snap.addElement(el, { align: ['start'] });
  }

  /*
   * Программа — исключение. Её пин длиной в несколько экранов везёт
   * горизонтальную сцену со своим ритмом, и притягивать к началу секции
   * изнутри проезда нельзя. Поэтому у неё только две точки: вход в пин
   * и выход из него, между ними снап молчит.
   */
  const addProgramEdges = () => {
    const pin = document.querySelector<HTMLElement>('[data-program-pin]');
    const host = pin?.closest<HTMLElement>('.pin-spacer') ?? pin;
    if (!host) return;
    const top = Math.round(host.getBoundingClientRect().top + window.scrollY);
    const exit = Math.round(top + host.offsetHeight - window.innerHeight);
    snap.add(top);
    if (exit > top) snap.add(exit);
  };
  addProgramEdges();

  // Пины меняют геометрию документа: после пересчёта обновляем точки.
  ScrollTrigger.addEventListener('refresh', () => snap.resize());
}

/* ==========================================================================
   Появление секций
   Каждый блок собирается ОДНИМ заходом: как только секция подходит к кадру,
   заголовок выезжает словами, тексты собираются из блюра, панели и колонны
   поднимаются — всё за ~секунду, а не размазанно по нескольким прокруткам.
   Пинов здесь нет намеренно: пин-спейсеры сдвигают документ и ломают
   позиции соседних сцен (наложение Программы на соседей). Остановку на
   блоке обеспечивает доводка скролла.
   ========================================================================== */

/** Разрезает заголовки на слова-маски, а blur-абзацы на слова. */
function splitTexts(): void {
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
    el.innerHTML = words.map((w) => `<span class="bw" aria-hidden="true">${w}</span>`).join(' ');
  }
}

const numFmt = new Intl.NumberFormat('ru-RU');

function initSectionEntrances(): void {
  const blocks = document.querySelectorAll<HTMLElement>('main section, footer.closer');

  for (const section of blocks) {
    const words = section.querySelectorAll<HTMLElement>('.split-word');
    const blurWords = section.querySelectorAll<HTMLElement>('.bw');
    const rises = section.querySelectorAll<HTMLElement>('[data-reveal="up"], [data-reveal="doc"]');
    const bars = section.querySelectorAll<HTMLElement>('[data-reveal="bar"]');
    const rules = section.querySelectorAll<HTMLElement>('[data-reveal="rule"]');
    const counters = section.querySelectorAll<HTMLElement>('[data-count-to]');

    if (!words.length && !blurWords.length && !rises.length && !bars.length && !rules.length && !counters.length) {
      continue;
    }

    // Тёмная секция сначала закрывает экран целиком чёрным полотном и
    // только потом наполняется: старт входа отложен почти до её верха.
    const isDark = section.matches('[data-band="dark"]');

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: section, start: isDark ? 'top 22%' : 'top 72%' },
    });

    if (words.length) {
      tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.75, ease: 'power4.out', stagger: 0.045 }, 0);
    }
    if (blurWords.length) {
      tl.fromTo(
        blurWords,
        { opacity: 0, y: 12, filter: 'blur(9px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', stagger: 0.018 },
        0.16,
      );
    }
    if (rises.length) {
      tl.fromTo(rises, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.22);
    }
    if (bars.length) {
      tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.8, stagger: 0.075 }, 0.3);
    }
    if (rules.length) {
      tl.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: 'power3.inOut' }, 0.26);
    }

    // Тикающие цифры: порт CountUp (React Bits) на GSAP. В разметке лежит
    // полное число (SEO и no-JS), мотор сбрасывает в ноль и докручивает
    // вместе со всем блоком.
    for (const el of counters) {
      const to = Number(el.dataset.countTo ?? '0');
      const prefix = el.dataset.countPrefix ?? '';
      const suffix = el.dataset.countSuffix ?? '';
      const state = { v: 0 };
      const render = () => {
        el.textContent = prefix + numFmt.format(Math.round(state.v)) + suffix;
      };
      render();
      tl.to(state, { v: to, duration: 1.1, ease: 'expo.out', onUpdate: render }, 0.3);
    }
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
  // Сцена hero рассчитана на старт с нуля: восстановление позиции браузером
  // высаживало пользователя в середину перетекания и глушило автопилот.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  navEl = document.querySelector<HTMLElement>('[data-nav]');
  veilEl = document.querySelector<HTMLElement>('[data-nav-veil]');
  gsap.registerPlugin(ScrollTrigger);

  if (reduce.matches) {
    // Без движения хедер виден всегда; страховочный data-away снимаем.
    setNavAway(false);
    return;
  }

  document.documentElement.classList.add('motion');

  const lenis = initLenis();
  initNavShrink();
  splitTexts();
  initHeroScene();
  initProgram();
  initSectionEntrances();
  // Пины меняют высоту документа: сначала даём ScrollTrigger посчитать
  // геометрию, только потом снимаем с неё точки снапа.
  ScrollTrigger.refresh();
  initSnap(lenis);
  if (finePointer.matches) {
    initCursor();
    initMagnetic();
  }

  // Пересчёт после стабилизации высот: шрифты и отложенные картинки.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
