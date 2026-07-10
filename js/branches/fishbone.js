/**
 * Orquestador de las ramas documentales.
 *
 * Cada rama se abre como una experiencia de viewport completo con scroll
 * interno. El eje queda inmóvil y se restaura exactamente al cerrar.
 */

import { state } from '../core/state.js';
import * as scroll from '../core/scroll.js';
import { refreshScrollTriggers } from '../spine/spine.js';

import { initPodcast, destroyPodcast } from './podcast.js?v=ernesto-sync-2';
import { initMapa, destroyMapa } from './mapa.js';
import { initVideo, destroyVideo } from './video.js';
import { initLibreta, destroyLibreta } from './libreta.js';
import { initMapCol, destroyMapCol } from './map-col.js';
import { initArchivo, destroyArchivo } from './archivo.js';

const BRANCH_MODULES = {
  podcast: { init: initPodcast, destroy: destroyPodcast },
  mapa: { init: initMapa, destroy: destroyMapa },
  video: { init: initVideo, destroy: destroyVideo },
  libreta: { init: initLibreta, destroy: destroyLibreta },
  'map-col': { init: initMapCol, destroy: destroyMapCol },
  archivo: { init: initArchivo, destroy: destroyArchivo },
};

const LOCK_CONDITIONS = {
  podcast: () => true,
  mapa: () => true,
  video: () => true,
  libreta: () => true,
  'map-col': () => state.get('lastPointUnlocked'),
  archivo: () => state.get('archiveUnlocked'),
};

const LOCK_MESSAGES = {
  'map-col': 'Primero completa la libreta de Gabriel.',
  archivo: 'Reúne la voz de Ernesto, el mapa de Lucía y la confirmación de los Quispe.',
};

const NAV_STATE = {
  phase: 'SPINE_FLOWING',
  activeBranch: null,
  returnScrollY: 0,
  opener: null,
};

let removeArchiveListener = null;
let removeLastPointListener = null;

export function initFishbone() {
  bindCloseButtons();
  bindKeyboardNavigation();
  syncLockState('archivo');
  syncLockState('map-col');

  removeArchiveListener = state.on('archiveUnlocked', () => syncLockState('archivo'));
  removeLastPointListener = state.on('lastPointUnlocked', () => syncLockState('map-col'));

  return { activate: activateBranch };
}

function activateBranch(branchId) {
  if (NAV_STATE.phase !== 'SPINE_FLOWING') return;

  const asideEl = document.querySelector(`#branch-${branchId}`);
  const button = document.querySelector(`.branch-node__enter[data-branch="${branchId}"]`);
  if (!asideEl || !button) return;

  if (!LOCK_CONDITIONS[branchId]?.()) {
    announceLockedBranch(branchId, button);
    return;
  }

  NAV_STATE.phase = 'BRANCH_ENTERING';
  NAV_STATE.activeBranch = branchId;
  NAV_STATE.returnScrollY = scroll.getScrollY();
  NAV_STATE.opener = button;

  state.set('activeBranch', branchId);
  state.markVisited(branchId);
  scroll.pause();

  button.setAttribute('aria-expanded', 'true');
  asideEl.hidden = false;
  asideEl.setAttribute('aria-hidden', 'false');
  asideEl.setAttribute('role', 'dialog');
  asideEl.setAttribute('aria-modal', 'true');
  asideEl.setAttribute('data-lenis-prevent', '');
  asideEl.classList.add('is-open');
  asideEl.scrollTop = 0;

  const finishOpening = () => {
    NAV_STATE.phase = 'BRANCH_ACTIVE';
    BRANCH_MODULES[branchId]?.init(asideEl, {
      onComplete: () => state.markCompleted(branchId),
    });
    asideEl.querySelector('.branch__close')?.focus();
  };

  if (canAnimate()) {
    gsap.fromTo(
      asideEl,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        onComplete: finishOpening,
      },
    );
  } else {
    asideEl.style.opacity = '1';
    finishOpening();
  }
}

function closeBranch(branchId) {
  if (!['BRANCH_ACTIVE', 'BRANCH_ENTERING'].includes(NAV_STATE.phase)) return;
  if (branchId !== NAV_STATE.activeBranch) return;

  const asideEl = document.querySelector(`#branch-${branchId}`);
  if (!asideEl) return;

  NAV_STATE.phase = 'BRANCH_EXITING';
  BRANCH_MODULES[branchId]?.destroy(asideEl);
  if (typeof window.gsap !== 'undefined') gsap.killTweensOf(asideEl);

  const finishClosing = () => {
    asideEl.classList.remove('is-open');
    asideEl.hidden = true;
    asideEl.setAttribute('aria-hidden', 'true');
    asideEl.removeAttribute('aria-modal');
    asideEl.setAttribute('role', 'complementary');
    asideEl.style.removeProperty('opacity');
    NAV_STATE.opener?.setAttribute('aria-expanded', 'false');

    scroll.resume();
    scroll.scrollTo(NAV_STATE.returnScrollY, { immediate: true });
    state.set('activeBranch', null);

    const opener = NAV_STATE.opener;
    NAV_STATE.phase = 'SPINE_FLOWING';
    NAV_STATE.activeBranch = null;
    NAV_STATE.opener = null;

    refreshScrollTriggers();
    opener?.focus({ preventScroll: true });
  };

  if (canAnimate()) {
    gsap.to(asideEl, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: finishClosing,
    });
  } else {
    finishClosing();
  }
}

function bindCloseButtons() {
  document.querySelectorAll('.branch__close').forEach(button => {
    button.addEventListener('click', () => closeBranch(button.dataset.branch));
  });
}

function bindKeyboardNavigation() {
  document.addEventListener('keydown', event => {
    if (!NAV_STATE.activeBranch) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeBranch(NAV_STATE.activeBranch);
      return;
    }

    if (event.key !== 'Tab' || NAV_STATE.phase !== 'BRANCH_ACTIVE') return;

    const asideEl = document.querySelector(`#branch-${NAV_STATE.activeBranch}`);
    const focusable = getFocusableElements(asideEl);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
  )].filter(element => !element.hidden && element.getClientRects().length > 0);
}

function syncLockState(branchId) {
  const unlocked = Boolean(LOCK_CONDITIONS[branchId]?.());
  const button = document.querySelector(`.branch-node__enter[data-branch="${branchId}"]`);
  const node = button?.closest('.branch-node');
  if (!button) return;

  button.disabled = false;
  button.setAttribute('aria-disabled', String(!unlocked));
  button.dataset.locked = String(!unlocked);
  node?.setAttribute('data-locked', String(!unlocked));
}

function announceLockedBranch(branchId, button) {
  const node = button.closest('.branch-node');
  const liveRegion = node?.querySelector('[aria-live]');
  const message = LOCK_MESSAGES[branchId] || 'Este contenido todavía no está disponible.';

  if (liveRegion) {
    const target = liveRegion.querySelector('p') || liveRegion;
    target.textContent = message;
  } else {
    button.setAttribute('aria-label', message);
  }

  if (!state.get('reducedMotion') && typeof window.gsap !== 'undefined') {
    gsap.fromTo(node, { x: 0 }, {
      x: 5,
      duration: 0.06,
      repeat: 3,
      yoyo: true,
      onComplete: () => gsap.set(node, { x: 0 }),
    });
  }
}

function canAnimate() {
  return !state.get('reducedMotion') && typeof window.gsap !== 'undefined';
}

export function getActiveBranch() {
  return NAV_STATE.activeBranch;
}
