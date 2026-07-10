/**
 * CORE/SCROLL.JS
 * La Memoria de una Ciudad
 *
 * Inicializa Lenis como motor de scroll suave editorial y lo sincroniza
 * con GSAP ScrollTrigger. Expone pause/resume/scrollTo que fishbone.js
 * consume al entrar y salir de las ramas transmedia.
 *
 * Lenis nunca tiene el efecto elástico de las librerías de scroll "SaaS":
 * lerp bajo, sin overshoot, sensación de papel deslizándose, no de goma.
 */

import { state } from './state.js';

let lenis = null;
let isPaused = false;

/**
 * Inicializa Lenis + ScrollTrigger.
 * Llamar una sola vez desde main.js tras DOMContentLoaded.
 */
export function initScroll() {
  const reduced = state.get('reducedMotion');
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';

  if (!hasGsap || !hasScrollTrigger) {
    console.info('Scroll avanzado no disponible; se usa el desplazamiento nativo.');
    return null;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (reduced || !hasLenis) {
    ScrollTrigger.refresh();
    return null;
  }

  lenis = new Lenis({
    duration:        1.1,        // Editorial, no instantáneo
    lerp:            0.08,       // Bajo = sensación de papel deslizándose
    smoothWheel:     true,
    smoothTouch:     false,      // Sin override agresivo en touch — UX nativa móvil
    wheelMultiplier: 1,
    touchMultiplier: 1.2,
    infinite:        false,
  });

  // Sincronización Lenis ↔ ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    if (!isPaused) lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // ScrollTrigger debe usar el scroll de Lenis, no el nativo
  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0, left: 0,
        width:  window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  ScrollTrigger.refresh();

  return lenis;
}

/**
 * Pausa el scroll por completo.
 * Usado por fishbone.js al entrar a una rama y por el lock-gate del video.
 */
export function pause() {
  isPaused = true;
  document.documentElement.classList.add('is-branch-open');
  document.body.style.overflow = 'hidden';
  lenis?.stop();
}

/**
 * Reanuda el scroll.
 */
export function resume() {
  isPaused = false;
  document.documentElement.classList.remove('is-branch-open');
  document.body.style.overflow = '';
  lenis?.start();
}

/**
 * Desplaza el scroll a una posición o elemento.
 * @param {number|string|HTMLElement} target - scrollY, selector, o elemento
 * @param {object} options - { immediate, offset, duration }
 */
export function scrollTo(target, options = {}) {
  const { immediate = false, offset = 0, duration = 1.1 } = options;

  if (lenis) {
    lenis.scrollTo(target, { immediate, offset, duration });
  } else {
    // Fallback nativo (reduced motion o Lenis no inicializado)
    const y = typeof target === 'number'
      ? target
      : (typeof target === 'string'
          ? document.querySelector(target)?.getBoundingClientRect().top + window.scrollY
          : target?.getBoundingClientRect().top + window.scrollY) || 0;

    window.scrollTo({
      top:      y + offset,
      behavior: immediate || state.get('reducedMotion') ? 'auto' : 'smooth',
    });
  }
}

/** Posición actual de scroll, independiente del motor activo */
export function getScrollY() {
  return lenis ? lenis.scroll : window.scrollY;
}

/** Acceso directo a la instancia de Lenis si algún módulo lo necesita */
export function getLenisInstance() {
  return lenis;
}
