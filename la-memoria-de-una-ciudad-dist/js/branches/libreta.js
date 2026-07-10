/**
 * La libreta de Gabriel.
 *
 * La portada, las dos dobles páginas y el examen del punto sin nombre forman
 * una secuencia breve. Llegar al mapa no completa la rama: el usuario debe
 * examinar conscientemente la cruz para habilitar el siguiente momento.
 */

import { state } from '../core/state.js';

let coverEl;
let openBtn;
let bodyEl;
let navEl;
let prevBtn;
let nextBtn;
let pageLabel;
let counterEl;
let reviewBtn;
let revelationEl;
let mapImage;
let mapStatus;
let spreads = [];
let currentIndex = 0;
let coverOpened = false;
let coverOpening = false;
let pointReviewed = false;
let listenersBound = false;
let onCompleteCallback = null;

export function initLibreta(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;

  coverEl = asideEl.querySelector('#notebook-cover');
  openBtn = asideEl.querySelector('#notebook-open-btn');
  bodyEl = asideEl.querySelector('#notebook-body');
  navEl = asideEl.querySelector('.notebook-nav');
  prevBtn = asideEl.querySelector('#notebook-prev');
  nextBtn = asideEl.querySelector('#notebook-next');
  pageLabel = asideEl.querySelector('#notebook-page-label');
  counterEl = asideEl.querySelector('#notebook-counter');
  reviewBtn = asideEl.querySelector('#notebook-review-point');
  revelationEl = asideEl.querySelector('#notebook-map-revelation');
  mapImage = asideEl.querySelector('#notebook-map-image');
  mapStatus = asideEl.querySelector('#notebook-map-status');
  spreads = [...asideEl.querySelectorAll('.notebook-spread')];

  pointReviewed = Boolean(
    pointReviewed || state.get('completedBranches')?.has('libreta'),
  );

  if (!listenersBound) {
    bindInteractions();
    listenersBound = true;
  }

  syncView();
}

export function destroyLibreta() {
  if (typeof window.gsap !== 'undefined') {
    window.gsap.killTweensOf([coverEl, bodyEl, ...spreads]);
  }

  if (coverOpening && !coverOpened) {
    coverOpening = false;
    resetAnimatedStyles(coverEl);
    if (coverEl) coverEl.hidden = false;
    if (bodyEl) bodyEl.hidden = true;
    if (navEl) navEl.hidden = true;
  }

  spreads.forEach(resetAnimatedStyles);
}

function bindInteractions() {
  openBtn?.addEventListener('click', openCover);
  prevBtn?.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn?.addEventListener('click', () => goTo(currentIndex + 1));
  reviewBtn?.addEventListener('click', reviewUnnamedPoint);
  mapImage?.addEventListener('load', handleMapLoad);
  mapImage?.addEventListener('error', handleMapError);
}

function syncView() {
  coverEl.hidden = coverOpened;
  bodyEl.hidden = !coverOpened;
  navEl.hidden = !coverOpened;
  counterEl.textContent = coverOpened
    ? `Doble página ${currentIndex + 1} de ${spreads.length}`
    : 'Portada';

  showSpread(currentIndex, { animate: false });
  syncReviewState();

  if (coverOpened && currentIndex >= getMapSpreadIndex()) {
    loadMapResource();
  }
}

function openCover() {
  if (coverOpened || coverOpening) return;
  coverOpening = true;

  if (!canAnimate()) {
    finishCoverOpening();
    return;
  }

  window.gsap.to(coverEl, {
    opacity: 0,
    scale: 0.98,
    duration: 0.45,
    ease: 'power2.inOut',
    onComplete: finishCoverOpening,
  });
}

function finishCoverOpening() {
  coverOpening = false;
  coverOpened = true;
  resetAnimatedStyles(coverEl);
  coverEl.hidden = true;
  bodyEl.hidden = false;
  navEl.hidden = false;
  showSpread(currentIndex, { animate: false });
  nextBtn?.focus();
}

function goTo(index) {
  if (index < 0 || index >= spreads.length || index === currentIndex) return;

  const direction = index > currentIndex ? 1 : -1;
  currentIndex = index;
  showSpread(index, { animate: true, direction });

  if (index >= getMapSpreadIndex()) {
    loadMapResource();
  }

  if (index === getReviewSpreadIndex()) {
    reviewBtn?.focus();
  } else {
    nextBtn?.focus();
  }
}

function showSpread(index, { animate = true, direction = 1 } = {}) {
  spreads.forEach((spread, spreadIndex) => {
    if (typeof window.gsap !== 'undefined') window.gsap.killTweensOf(spread);
    resetAnimatedStyles(spread);
    spread.hidden = spreadIndex !== index;
  });

  const current = spreads[index];
  if (animate && current && canAnimate()) {
    window.gsap.fromTo(
      current,
      { opacity: 0, x: direction * 18 },
      { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' },
    );
  }

  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === spreads.length - 1;
  pageLabel.textContent = `Doble página ${index + 1} de ${spreads.length}`;
  if (coverOpened) {
    counterEl.textContent = `Doble página ${index + 1} de ${spreads.length}`;
  }
}

function loadMapResource() {
  if (!mapImage || mapImage.dataset.loadStarted === 'true') return;

  const source = mapImage.dataset.src;
  if (!source) {
    handleMapError();
    return;
  }

  mapImage.dataset.loadStarted = 'true';
  mapImage.setAttribute('aria-busy', 'true');
  mapStatus.textContent =
    'El mapa empieza a aparecer entre las páginas.';
  mapImage.src = source;

  if (mapImage.complete) {
    if (mapImage.naturalWidth > 0) handleMapLoad();
    else handleMapError();
  }
}

function handleMapLoad() {
  if (!mapImage || !mapStatus) return;
  mapImage.hidden = false;
  mapImage.classList.remove('asset-missing');
  mapImage.removeAttribute('aria-busy');
  mapImage.dataset.resourceReady = 'true';
  mapStatus.textContent =
    'El mapa queda abierto. La cruz todavía espera.';
}

function handleMapError() {
  if (!mapImage || !mapStatus) return;
  mapImage.hidden = true;
  mapImage.classList.add('asset-missing');
  mapImage.removeAttribute('aria-busy');
  mapImage.dataset.resourceReady = 'false';
  mapStatus.textContent =
    'El mapa no aparece, pero los nombres y la cruz siguen en la libreta.';
}

function reviewUnnamedPoint() {
  if (pointReviewed) return;
  pointReviewed = true;
  syncReviewState();
  onCompleteCallback?.();
  revelationEl?.focus();
}

function syncReviewState() {
  if (!reviewBtn || !revelationEl) return;

  revelationEl.hidden = !pointReviewed;
  reviewBtn.setAttribute('aria-expanded', String(pointReviewed));
  reviewBtn.disabled = pointReviewed;
  reviewBtn.textContent = pointReviewed
    ? 'Punto sin nombre examinado'
    : 'Examinar la cruz sin nombre';
}

function getMapSpreadIndex() {
  const index = spreads.findIndex(spread => spread.dataset.spread === 'key');
  return index >= 0 ? index : spreads.length - 1;
}

function getReviewSpreadIndex() {
  const index = spreads.findIndex(spread => spread.dataset.spread === 'review');
  return index >= 0 ? index : spreads.length - 1;
}

function canAnimate() {
  return !state.get('reducedMotion') && typeof window.gsap !== 'undefined';
}

function resetAnimatedStyles(element) {
  if (!element) return;
  element.style.removeProperty('opacity');
  element.style.removeProperty('transform');
}
