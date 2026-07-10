/**
 * Control del desenlace.
 *
 * La Fase 6 no se desbloquea automáticamente al completar el último punto.
 * El usuario debe decidir observar el fotograma pendiente del segundo rollo.
 * Recién entonces se activa `secondRollReviewed`, de donde deriva
 * `climaxUnlocked`.
 */

import { state } from '../core/state.js';
import { observe } from '../core/reveal.js';
import { scrollTo } from '../core/scroll.js';

export function initClimaxFlow() {
  bindSecondRollReview();
  bindClimaxFallback();
}

function bindSecondRollReview() {
  const button = document.querySelector('#second-roll-review');
  const status = document.querySelector('#second-roll-review-status');
  const target = document.querySelector('#beat-nina');
  if (!button || !target) return;

  const sync = () => {
    const unlocked = state.get('climaxUnlocked');
    button.setAttribute('aria-expanded', String(unlocked));
    button.setAttribute('aria-disabled', String(unlocked));
    button.textContent = unlocked
      ? 'Último fotograma abierto'
      : 'Observar el último fotograma';
    if (unlocked) button.disabled = true;
  };

  button.addEventListener('click', () => {
    if (state.get('climaxUnlocked')) return;

    state.set('secondRollReviewed', true);
    if (status) {
      status.textContent = 'El último fotograma queda listo para mirarse.';
    }

    const image = target.querySelector('.reveal-target--climax');
    if (image) observe(image);

    requestAnimationFrame(() => {
      scrollTo(target, { offset: -24 });
      target.focus?.({ preventScroll: true });
    });
  });

  state.on('climaxUnlocked', sync);
  sync();
}

function bindClimaxFallback() {
  const image = document.querySelector('#photo-nina img');
  const fallback = document.querySelector('#nina-valeria-fallback');
  if (!image || !fallback) return;

  image.addEventListener('error', () => {
    fallback.hidden = false;
  });
}
