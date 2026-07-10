/**
 * MAIN.JS
 * La Memoria de una Ciudad
 *
 * Punto de entrada de la aplicación. Orquesta el arranque de todos
 * los sistemas núcleo en el orden correcto:
 *
 *   1. state     — debe existir antes que cualquier otro módulo
 *   2. scroll    — Lenis + ScrollTrigger
 *   3. reveal    — Intersection Observer + easing personalizado
 *   4. fishbone  — el orquestador de ramas (se registra antes que spine
 *                  porque spine.js necesita el callback de activación)
 *   5. spine     — ScrollTriggers por beat, indicador lateral
 *
 * Tras el arranque, refresca ScrollTrigger una vez que todas las
 * fuentes e imágenes críticas hayan cargado, para que las medidas
 * de pin/scroll sean precisas desde el primer frame.
 */

import { state }                  from './core/state.js';
import { initScroll }             from './core/scroll.js';
import { initReveal, registerEasings } from './core/reveal.js';
import { initFishbone }           from './branches/fishbone.js?v=ernesto-sync-2';
import { initSpine }              from './spine/spine.js';
import { initClimaxFlow }         from './spine/climax.js';
import { initArchiveContribution } from './archive-contribution.js';

function bootstrap() {
  if (typeof gsap === 'undefined') {
    console.info('[LMDC] Animación avanzada no disponible; la experiencia continúa en modo nativo.');
  }

  registerEasings();
  initScroll();
  initReveal();

  const fishbone = initFishbone();
  initSpine({
    onActivateBranch: (branchId) => fishbone.activate(branchId),
  });

  initClimaxFlow();
  initArchiveContribution();
  bindReviewUnlock();
  logArchitectureReady();
}

function bindReviewUnlock() {
  const btn = document.querySelector('#review-unlock');
  if (!btn) return;

  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocal) return;

  btn.hidden = false;
  btn.addEventListener('click', () => {
    ['ernesto196', 'lucia247', 'quispe247Confirmed'].forEach(key => {
      state.recordEvidence(key);
    });

    ['podcast', 'mapa', 'video', 'archivo', 'libreta', 'map-col'].forEach(branchId => {
      state.markVisited(branchId);
      state.markCompleted(branchId);
    });

    state.set('combinationEntered', true);
    state.set('compartmentOpened', true);
    state.set('secondRollReviewed', true);

    document.querySelectorAll('[data-locked="true"]').forEach(el => {
      el.setAttribute('data-locked', 'false');
    });

    document.querySelectorAll('.branch-node__enter').forEach(button => {
      button.disabled = false;
      button.removeAttribute('aria-disabled');
    });

    btn.textContent = 'Todo desbloqueado';
    btn.setAttribute('aria-pressed', 'true');
  });
}

function logArchitectureReady() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log(
      '%cLa Memoria de una Ciudad%c — arquitectura fishbone inicializada.',
      'color:#B07D3A;font-weight:bold;',
      'color:#7A5C3A;'
    );
  }
}

// Esperar a que GSAP y ScrollTrigger (cargados con defer) estén disponibles
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Refresco final tras carga completa de fuentes e imágenes críticas
window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
});
