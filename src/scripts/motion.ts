/**
 * Движение страницы: Lenis (инерционный скролл) + GSAP ScrollTrigger.
 *
 * Правила:
 *  - модуль грузится отложенно и ничего не ломает, если не загрузился;
 *  - класс .motion ставится только здесь, поэтому контент по умолчанию виден;
 *  - при prefers-reduced-motion не запускается вообще ничего.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Прилипшая шапка получает нижнюю линейку, когда страница прокручена. */
function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const sentinel = document.querySelector('.nav-sentinel');
  if (!nav || !sentinel) return;

  new IntersectionObserver(([entry]) => {
    nav.toggleAttribute('data-stuck', !entry!.isIntersecting);
  }).observe(sentinel);
}

/** Плавный скролл. Колесо и тач остаются нативными по ощущению, но с инерцией. */
function initLenis(): Lenis {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: -68 },
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Lenis перехватывает нативный scrollTo, поэтому в дев-режиме отдаём
  // инстанс наружу: без него страницу не отладить из консоли.
  if (import.meta.env.DEV) {
    (window as unknown as { lenis: Lenis }).lenis = lenis;
  }

  return lenis;
}

/** Общие появления: заголовки по словам, блоки, линейки, стойки шкалы. */
function initReveals(): void {
  // Заголовки выезжают по словам из-под маски. Режем по словам, а не по
  // строкам: слова не зависят от того, как текст лёг после ресайза, поэтому
  // разметку не нужно пересобирать, и плагин SplitText не требуется.
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    // <br> обязан стать пробелом, иначе соседние слова склеятся:
    // textContent переносы не отдаёт.
    const text = el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map(
        (w) =>
          `<span class="split-mask" aria-hidden="true"><span class="split-word">${w}</span></span>`,
      )
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

  // Стойки шкалы дохода растут от базовой линии слева направо.
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

/** Программа: счётчик этапов и линия прогресса в прилипшей колонке. */
function initProgram(): void {
  const root = document.querySelector<HTMLElement>('[data-program]');
  if (!root) return;

  const steps = [...root.querySelectorAll<HTMLElement>('[data-program-step]')];
  const digits = root.querySelector<HTMLElement>('[data-program-digits]');
  const progress = root.querySelector<HTMLElement>('[data-program-progress]');
  if (!steps.length || !digits || !progress) return;

  const digitEls = [...digits.children] as HTMLElement[];

  // Линия прогресса тянется на всю длину списка этапов.
  gsap.to(progress, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: steps[0]!,
      endTrigger: steps[steps.length - 1]!,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.4,
    },
  });

  // Счётчик листает цифру, когда середина экрана входит в этап.
  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (!self.isActive) {
          step.classList.remove('is-active');
          return;
        }
        step.classList.add('is-active');
        const target = digitEls[i];
        if (target) {
          gsap.to(digits, {
            y: -target.offsetTop,
            duration: 0.55,
            ease: 'power3.inOut',
            overwrite: 'auto',
          });
        }
      },
    });
  });
}

function boot(): void {
  if (reduce.matches) {
    // Без движения: только линейка шапки, всё остальное статично и видимо.
    initNav();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('motion');

  initNav();
  initLenis();
  initReveals();
  initProgram();

  // Пересчёт позиций после того, как высоты перестанут меняться: шрифты
  // меняют высоту строк, отложенные картинки меняют высоту секций.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot();
