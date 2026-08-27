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

/**
 * Держит Lenis в курсе реальной высоты документа. Пины ScrollTrigger
 * добавляют высоту ПОСЛЕ инициализации, а Lenis кэширует размеры: без
 * пересчёта его лимит остаётся коротким и скролл упирается в невидимую
 * стену задолго до конца страницы.
 */
function syncLenisHeight(): void {
  lenisRef?.resize();
}

function initLenis(): Lenis {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: -70 },
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /*
   * Тачпад против колеса. У тачпада (маки, precision-тачпады) поток мелких,
   * часто дробных дельт с СОБСТВЕННОЙ инерцией ОС; виртуальный скролл поверх
   * неё двоит инерцию — страница разгоняется и плывёт, ровно это увидел
   * заказчик на ноутбуке. Детектим устройство по форме дельт: на тачпаде
   * отдаём wheel нативному скроллу (родную инерцию не переиграть), мышь
   * продолжает ехать через сглаживание Lenis. Переключатель двусторонний —
   * мышь, воткнутая к ноуту, возвращает сглаживание первым же тиком.
   */
  let padVotes = 0;
  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      if (e.deltaMode !== 0) {
        // Дельты в строках/страницах шлют только мыши.
        lenis.options.smoothWheel = true;
        padVotes = 0;
        return;
      }
      const a = Math.abs(e.deltaY);
      if (a >= 80 && Number.isInteger(e.deltaY)) {
        lenis.options.smoothWheel = true;
        padVotes = 0;
        return;
      }
      if ((a > 0 && a < 40) || !Number.isInteger(e.deltaY)) {
        padVotes += 1;
        if (padVotes >= 3) lenis.options.smoothWheel = false;
      }
    },
    { passive: true, capture: true },
  );

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
  const leadWords = scene.querySelectorAll<HTMLElement>('[data-hero-lead] .bw');
  const marks = scene.querySelectorAll<HTMLElement>('[data-hero-lead] .mark');
  const marksHl = scene.querySelectorAll<HTMLElement>('[data-hero-lead] .mark__hl');
  const doc = scene.querySelector<HTMLElement>('[data-hero-doc]');
  const stamp = scene.querySelector<HTMLElement>('[data-hero-stamp]');

  // На фазе вопроса хедера нет (страховку от не доехавшего мотора
  // снимает инлайн-скрипт в SiteNav).
  setNavAway(true);

  // Стартовые состояния фазы ответа задаёт мотор, а не CSS: транзформы из
  // стилей и yPercent GSAP не складываются, строки застревали бы за маской.
  gsap.set(lines, { yPercent: 110 });
  gsap.set(rises, { opacity: 0, y: 22 });
  // Лид проявляется словами с размытием — тем же приёмом, что абзацы Ментора.
  // Хинт will-change здесь постоянный законно: слова ездят по скрабу
  // в обе стороны всё время, пока герой запинен.
  gsap.set(leadWords, { opacity: 0, y: 12, filter: 'blur(9px)', willChange: 'transform, filter, opacity' });
  // Накладка маркера: не прочерчена. CSS держит противоположное — залито
  // целиком — на случай, когда мотор не доехал.
  gsap.set(marksHl, { clipPath: 'inset(0 100% 0 0)' });
  // Лист приходит из-за нижней кромки экрана: это подача документа,
  // а не появление карточки интерфейса.
  if (doc) gsap.set(doc, { opacity: 0, y: () => window.innerHeight * 0.62, rotate: 1.5 });

  // Пока идёт пересчёт, запиненная сцена прогоняется до конца: и progress,
  // и scroll() кратковременно показывают конец пина. Любое «сработай один
  // раз, когда доехали» без этого флага срабатывает прямо на загрузке.
  let marksDrawn = false;
  let marksTween: gsap.core.Tween | null = null;
  let refreshing = false;
  ScrollTrigger.addEventListener('refreshInit', () => {
    refreshing = true;
  });
  ScrollTrigger.addEventListener('refresh', () => {
    refreshing = false;
  });

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
        // Маркер прочерчивается один раз и в реальном времени: на скрабе
        // отмотка назад возила бы заливку туда-сюда. Порог 0.66 — сразу за
        // последним словом лида (оно догорает к 0.60), но ещё до того, как
        // документ заберёт внимание на себя.
        //
        // Порог считается от ФАКТИЧЕСКОЙ позиции скролла, а не от progress.
        // Грабли, на которые я наступил трижды: при ScrollTrigger.refresh()
        // запиненная сцена прогоняется до конца, и progress кратковременно
        // равен 1. Любая проверка по нему (tl.call, self.progress) срабатывает
        // прямо на загрузке, и маркер оказывается залит до появления текста.
        // Отдельный триггер по запиненному stage тоже не годится: его
        // геометрия при пине не пересекает точку старта. Скролл же refresh
        // не двигает — по нему и сверяемся.
        if (!refreshing && marks.length) {
          const pos = self.scroll() - self.start;
          const range = self.end - self.start;
          if (!marksDrawn && pos > range * 0.66) {
            marksDrawn = true;
            marksTween?.kill();
            marksTween = gsap.to(marksHl, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.5,
              ease: 'power2.inOut',
              stagger: 0.22,
            });
          } else if (marksDrawn && pos < range * 0.62) {
            // Реверс: плашки уезжают влево ДО того, как текст начнёт таять
            // (слова держат полную видимость до ~0.60). Зазор 0.62/0.66 —
            // гистерезис, чтобы на границе не мигало туда-сюда.
            marksDrawn = false;
            marksTween?.kill();
            marksTween = gsap.to(marksHl, {
              clipPath: 'inset(0 100% 0 0)',
              duration: 0.35,
              ease: 'power2.in',
              stagger: { each: 0.1, from: 'end' },
            });
          }
          // Резкий прыжок вверх (якорь, восстановление позиции): отъезд ещё
          // играет, а вокруг уже тёмная фаза — доводим мгновенно, чтобы
          // оранжевые плашки не мигали на чёрном.
          if (!marksDrawn && marksTween?.isActive() && pos < range * 0.45) {
            marksTween.progress(1);
          }
        }
      },
    },
  });

  // Отладочный хэндл: без него прогресс сцены приходится вычислять по
  // положению скролла, а пин смещает точку отсчёта.
  if (import.meta.env.DEV) {
    (window as unknown as { __hero: gsap.core.Timeline }).__hero = tl;
  }

  // Фаза 1: вопрос уходит вверх и тает.
  tl.to(question, { yPercent: -30, autoAlpha: 0, duration: 0.3 }, 0.06);

  // Фаза 2: ответ. Строки из-под маски, текст и кнопки поднимаются, документ въезжает.
  tl.to(lines, { yPercent: 0, duration: 0.2, ease: 'power2.out', stagger: 0.045 }, 0.5);
  // Лид набирается словами: каждое выходит из размытия. Шаг мелкий — на
  // скрабе стагтер растягивается по всей длине сцены, а не по секундам.
  tl.to(
    leadWords,
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.12, ease: 'power2.out', stagger: 0.005 },
    0.55,
  );
  tl.to(rises, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out', stagger: 0.04 }, 0.62);

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

  const segs = [...root.querySelectorAll<HTMLElement>('[data-route-seg]')];

  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    steps.forEach((s, n) => s.classList.toggle('is-active', n === index));
    // Сегменты маршрута: пройденные тускло-оранжевые, текущий яркий.
    segs.forEach((seg, n) => {
      seg.classList.toggle('is-done', n < index);
      seg.classList.toggle('is-active', n === index);
    });
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

  /*
   * ВСЕ точки — числовые, через snap.add. addElement НЕ использовать:
   * аддон обмеряет элементы собственным ResizeObserver'ом в произвольные
   * моменты (инерция, транзишны, пересчёт пинов) и получает сдвинутые
   * значения — FAQ, например, стабильно парковался на 40px ниже начала,
   * и снизу подглядывал чёрный сосед. Числовые точки пересчитываются
   * только здесь, в заведомо спокойный момент после refresh.
   *
   * Программа — исключение по составу точек: её пин длиной в несколько
   * экранов везёт горизонтальную сцену со своим ритмом, и притягивать к
   * началу секции изнутри проезда нельзя. У неё только вход и выход пина.
   */
  let snapPoints: number[] = [];

  const rebuildSnaps = () => {
    // У аддона нет remove: чистим его реестр напрямую.
    (snap as unknown as { snaps: Map<number, unknown> }).snaps.clear();
    snapPoints = [];

    const push = (v: number) => {
      snap.add(v);
      snapPoints.push(v);
    };

    for (const el of document.querySelectorAll<HTMLElement>(
      'main section:not([data-hero]):not([data-program]), footer.closer',
    )) {
      push(Math.round(el.getBoundingClientRect().top + window.scrollY));
    }

    const pin = document.querySelector<HTMLElement>('[data-program-pin]');
    const host = pin?.closest<HTMLElement>('.pin-spacer') ?? pin;
    if (!host) return;
    const top = Math.round(host.getBoundingClientRect().top + window.scrollY);
    const exit = Math.round(top + host.offsetHeight - window.innerHeight);
    push(top);
    if (exit > top) push(exit);
  };
  rebuildSnaps();

  /*
   * Микро-доводчик. Родной снап не трогает мелкие недолёты: колесо,
   * остановившееся в 40px от начала секции, так и оставляло снизу полосу
   * соседней полосы. Сторож ждёт полной остановки (два тика подряд на
   * одном месте, нулевая скорость) и дожимает последние пиксели сам.
   * Дальше 64px не лезет — это уже осознанная позиция читателя.
   */
  let prevY = -1;
  let nudged = -1;
  window.setInterval(() => {
    if (snap.isStopped) return;
    const y = Math.round(lenis.scroll);
    const still = y === prevY;
    prevY = y;
    if (!still || Math.abs(lenis.velocity) > 0.05) return;
    let best = -1;
    for (const p of snapPoints) if (best === -1 || Math.abs(p - y) < Math.abs(best - y)) best = p;
    if (best === -1) return;
    const dist = Math.abs(best - y);
    if (dist < 2 || dist > 64) {
      if (dist > 96) nudged = -1; // ушли далеко: сторож снова заряжен
      return;
    }
    if (nudged === best) return; // уже доводили сюда: не зацикливаемся
    nudged = best;
    lenis.scrollTo(best, { duration: 0.45, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
  }, 160);

  // Пины меняют геометрию документа: после пересчёта собираем точки заново.
  ScrollTrigger.addEventListener('refresh', () => {
    snap.resize();
    rebuildSnaps();
  });

  /*
   * Аккордеон FAQ (и любой другой ресайз контента по месту) дёргает
   * ResizeObserver Lenis'а, снап принимает это за скролл-активность и после
   * своего дебаунса «доводит» страницу к точке — при клике по вопросу
   * страница уезжала на десятки пикселей, снизу вылезал чёрный сосед.
   * Хуже того, точка могла быть посчитана во время инерции, когда сглаженный
   * скролл расходится с фактическим, — и довод целился мимо начала секции.
   *
   * Поэтому на время локального ресайза снап глушится, а после — пересчёт
   * точек в покое и только затем включение.
   */
  if (import.meta.env.DEV) {
    (window as unknown as { __snap: Snap }).__snap = snap;
  }

  let reflowTimer = 0;
  document.addEventListener('ui:reflow', () => {
    snap.stop();
    window.clearTimeout(reflowTimer);
    reflowTimer = window.setTimeout(() => {
      snap.resize();
      rebuildSnaps();
      snap.start();
    }, 550);
  });
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

  // Лид героя режем на месте: подход через textContent, как выше, стёр бы
  // <mark>, а без него нечего прочерчивать маркером.
  for (const el of document.querySelectorAll<HTMLElement>('[data-hero-lead]')) {
    wrapWordsInPlace(el);
  }
}

/**
 * Оборачивает слова в .bw, не разрушая разметку внутри. Разделители
 * переносятся дословно: среди них неразрывные пробелы, которые держат
 * маркер от начала строки. Слова остаются обычным текстом для скринридера —
 * aria-hidden здесь не нужен, инлайновые span-ы читаются слитно.
 */
function wrapWordsInPlace(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (!text.trim()) continue;
      const frag = document.createDocumentFragment();
      for (const chunk of text.split(/(\s+)/)) {
        if (!chunk) continue;
        if (/^\s+$/.test(chunk)) {
          frag.append(chunk);
          continue;
        }
        const span = document.createElement('span');
        span.className = 'bw';
        span.textContent = chunk;
        frag.append(span);
      }
      child.replaceWith(frag);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      // Накладка маркера — цельная плашка, её резать на слова нельзя.
      // Помечена aria-hidden, потому что дублирует текст под собой.
      if ((child as HTMLElement).getAttribute('aria-hidden') === 'true') continue;
      wrapWordsInPlace(child);
    }
  }
}

const numFmt = new Intl.NumberFormat('ru-RU');

function initSectionEntrances(): void {
  const blocks = document.querySelectorAll<HTMLElement>('main section, footer.closer');

  for (const section of blocks) {
    // Герой живёт своим пином и своим таймлайном. Пока в нём не было .bw,
    // цикл проскакивал его сам; со словами лида — подхватил бы, и два
    // таймлайна начали бы драться за одни и те же слова: вход показывал их
    // ещё на нулевом скролле, а скраб сцены тут же утаскивал обратно.
    if (section.matches('[data-hero]')) continue;

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
      // will-change живёт только на время анимации: постоянный хинт на всех
      // словах страницы держал бы им слои растровыми без всякой пользы.
      tl.fromTo(
        blurWords,
        { opacity: 0, y: 12, filter: 'blur(9px)', willChange: 'transform, filter, opacity' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.018,
          onComplete: () => gsap.set(blurWords, { clearProps: 'will-change,filter' }),
        },
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
  syncLenisHeight();
  ScrollTrigger.addEventListener('refresh', syncLenisHeight);
  initSnap(lenis);
  if (finePointer.matches) {
    initCursor();
    initMagnetic();
  }

  // Пересчёт после стабилизации высот: шрифты и отложенные картинки.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  // Страховка: высоты картинок и шрифтов доезжают позже первого refresh.
  window.setTimeout(syncLenisHeight, 1200);
}

boot();
