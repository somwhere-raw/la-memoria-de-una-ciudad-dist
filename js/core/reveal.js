/**
 * CORE/REVEAL.JS
 * La Memoria de una Ciudad
 *
 * El motor del efecto central de toda la experiencia: la imagen o el texto
 * que emerge desde el negro, como en un revelador químico.
 *
 * Técnica: clip-path inset() animado + filter brightness/saturate,
 * combinado con Intersection Observer para activar solo cuando el
 * elemento entra en el viewport (lazy reveal de bajo costo).
 *
 * No usa Canvas. El "revelado" es una metáfora de interacción,
 * no una simulación física real — coherente con la dirección de arte
 * de Fase 0: sutil, elegante, nunca kitsch.
 */

import { state } from './state.js';

const DEFAULT_DURATION = 0.9;     // Coincide con --dur-reveal en variables.css
const CLIMAX_DURATION   = 1.4;    // Coincide con --dur-climax

let observer = null;
let revealTargets = [];
let scrollCheckQueued = false;
const activatedTargets = new WeakSet();

/**
 * Inicializa el Intersection Observer global.
 * Llamar una sola vez desde main.js.
 */
export function initReveal() {
  const reduced = state.get('reducedMotion');

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activateTarget(entry.target, reduced);
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: '0px 0px -10% 0px',
    }
  );

  revealTargets = [...document.querySelectorAll('.reveal-target')];
  revealTargets.forEach(el => {
    bindImageSafetyReveal(el);
    observer.observe(el);
  });

  // Algunos motores de scroll suave pueden saltar un umbral completo entre
  // dos frames. Esta comprobación ligera evita que una imagen quede oculta
  // si IntersectionObserver no entregó el cruce.
  window.addEventListener('scroll', () => {
    if (scrollCheckQueued) return;
    scrollCheckQueued = true;
    requestAnimationFrame(() => {
      scrollCheckQueued = false;
      activateNearbyTargets(reduced);
    });
  }, { passive: true });

  activateNearbyTargets(reduced);
  window.setTimeout(() => activateNearbyTargets(reduced), 250);
  window.setTimeout(() => activateNearbyTargets(reduced), 1000);
}

function activateTarget(el, reduced) {
  if (activatedTargets.has(el)) return;
  activatedTargets.add(el);
  observer?.unobserve(el);
  revealWhenReady(el, reduced);
}

function activateNearbyTargets(reduced) {
  revealTargets.forEach(el => {
    if (activatedTargets.has(el)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.2 &&
        rect.bottom > -window.innerHeight * 0.2) {
      activateTarget(el, reduced);
    }
  });
}

async function revealWhenReady(el, reduced) {
  if (el.tagName === 'IMG' && el.dataset.src &&
      !el.getAttribute('src')) {
    const loaded = waitForImage(el);
    el.loading = 'eager';
    el.setAttribute('src', el.dataset.src);
    const succeeded = await loaded;
    if (!succeeded) el.classList.add('asset-missing');
  } else if (el.tagName === 'IMG' && el.getAttribute('src') && !el.complete) {
    const succeeded = await waitForImage(el);
    if (!succeeded) el.classList.add('asset-missing');
  }

  if (reduced) {
    el.classList.add('is-revealed');
    return;
  }

  const delay = parseInt(el.dataset.revealDelay || '0', 10) / 1000;
  const isClimax = el.classList.contains('reveal-target--climax');
  await revealElement(el, { delay, climax: isClimax });
}

function bindImageSafetyReveal(el) {
  if (el.tagName !== 'IMG') return;
  if (el.dataset.revealSafetyBound === 'true') return;
  el.dataset.revealSafetyBound = 'true';

  el.addEventListener('load', () => {
    if (el.naturalWidth > 0 && !activatedTargets.has(el)) {
      const rect = el.getBoundingClientRect();
      const hasLayout = rect.width > 0 && rect.height > 0;
      if (hasLayout) activateTarget(el, state.get('reducedMotion'));
    }
  });

  el.addEventListener('error', () => {
    el.classList.add('asset-missing', 'is-revealed');
  });
}

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve(true);

  return new Promise(resolve => {
    const finish = succeeded => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      resolve(succeeded);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  });
}

/**
 * Anima un único elemento con el efecto de revelado fotográfico.
 * Exportado para que los módulos de rama lo invoquen directamente
 * sobre elementos inyectados dinámicamente (evidencias, fotos del mapa).
 */
export function revealElement(el, { delay = 0, climax = false } = {}) {
  const reduced = state.get('reducedMotion');
  const duration = climax ? CLIMAX_DURATION : DEFAULT_DURATION;
  const finalSaturate = climax ? 0.85 : 1;

  if (reduced || typeof window.gsap === 'undefined') {
    el.classList.add('is-revealed');
    return Promise.resolve();
  }

  return new Promise(resolve => {
    gsap.to(el, {
      clipPath:   'inset(0 0% 0 0)',
      filter:     `brightness(1) saturate(${finalSaturate})`,
      duration,
      delay,
      ease:       'developReveal', // Registrado abajo desde --ease-develop
      onStart:    () => el.classList.add('is-revealing'),
      onComplete: () => {
        el.classList.remove('is-revealing');
        el.classList.add('is-revealed');
        resolve();
      },
    });
  });
}

/**
 * Anima texto con cadencia de tinta secándose: stagger por línea o por palabra.
 * Usado en la cita final de Gabriel (beat-nota) y en map-col__echo.
 *
 * @param {HTMLElement} container - elemento que contiene los nodos a revelar
 * @param {object} opts - { selector, stagger, duration }
 */
export function revealText(container, opts = {}) {
  const {
    selector = '.reveal-target',
    stagger  = 0.15,
    duration = 0.7,
  } = opts;

  const reduced = state.get('reducedMotion');
  const targets = container.querySelectorAll(selector);

  if (reduced || typeof window.gsap === 'undefined') {
    targets.forEach(el => el.classList.add('is-revealed'));
    return Promise.resolve();
  }

  return new Promise(resolve => {
    gsap.to(targets, {
      clipPath:   'inset(0 0% 0 0)',
      filter:     'brightness(1) saturate(1)',
      duration,
      stagger,
      ease:       'developReveal',
      onComplete: resolve,
    });
  });
}

/**
 * Registra la curva de easing personalizada en GSAP a partir
 * de la variable CSS --ease-develop, para que JS y CSS compartan
 * exactamente la misma sensación de movimiento.
 *
 * Nota: usa gsap.parseEase con una función de bezier manual en vez del
 * plugin CustomEase (no incluido en el bundle de producción) para no
 * añadir una dependencia extra solo para una curva.
 */
export function registerEasings() {
  if (typeof window.gsap === 'undefined') return;
  // Aproximación funcional de cubic-bezier(0.22, 0.58, 0.36, 1)
  gsap.registerEase('developReveal', cubicBezierEase(0.22, 0.58, 0.36, 1));
}

/** Genera una función de easing a partir de los cuatro puntos de control */
function cubicBezierEase(x1, y1, x2, y2) {
  return function (t) {
    // Aproximación por bisección sobre la curva de Bézier cúbica
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sampleX = (u) => ((ax * u + bx) * u + cx) * u;
    const sampleY = (u) => ((ay * u + by) * u + cy) * u;
    let u = t;
    for (let i = 0; i < 6; i++) {
      const x = sampleX(u) - t;
      if (Math.abs(x) < 1e-4) break;
      const dx = (3 * ax * u + 2 * bx) * u + cx;
      u -= dx === 0 ? 0 : x / dx;
    }
    return sampleY(u);
  };
}

/**
 * Permite re-observar nuevos elementos `.reveal-target` inyectados
 * dinámicamente después de la inicialización (ej: notas de transcripción,
 * puntos del mapa colaborativo).
 */
export function observe(el) {
  if (!el) return;
  bindImageSafetyReveal(el);
  if (!revealTargets.includes(el)) revealTargets.push(el);
  observer?.observe(el);
  window.requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.2 &&
        rect.bottom > -window.innerHeight * 0.2) {
      activateTarget(el, state.get('reducedMotion'));
    }
  });
}
