/**
 * El último punto.
 *
 * Tres acciones explícitas sustituyen la antigua secuencia automática:
 * ampliar la cruz, seguir la ubicación y registrar la visita. Solo la última
 * completa la rama y permite regresar al laboratorio.
 */

import { state } from '../core/state.js';
import { MAP_POINTS } from '../data/map-points.js';

let pointsContainer;
let statusEl;
let inspectBtn;
let followBtn;
let completeBtn;
let recognitionPhase;
let visitPhase;
let completionEl;
let onCompleteCallback = null;
let listenersBound = false;
let currentStep = 0;
let completed = false;

export function initMapCol(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;

  pointsContainer = asideEl.querySelector('#map-col-points');
  statusEl = asideEl.querySelector('#map-col-status');
  inspectBtn = asideEl.querySelector('#map-col-inspect');
  followBtn = asideEl.querySelector('#map-col-follow');
  completeBtn = asideEl.querySelector('#map-col-complete');
  recognitionPhase = asideEl.querySelector('#map-col-phase-recognition');
  visitPhase = asideEl.querySelector('#map-col-phase-visit');
  completionEl = asideEl.querySelector('#map-col-completion');

  completed = Boolean(
    completed || state.get('completedBranches')?.has('map-col'),
  );
  if (completed) currentStep = 3;

  buildPoints();
  if (!listenersBound) {
    inspectBtn?.addEventListener('click', inspectUnnamedPoint);
    followBtn?.addEventListener('click', followApproximateLocation);
    completeBtn?.addEventListener('click', completeVisit);
    listenersBound = true;
  }

  syncView();
}

export function destroyMapCol() {
  if (typeof window.gsap !== 'undefined') {
    window.gsap.killTweensOf([recognitionPhase, visitPhase, completionEl]);
  }
  [recognitionPhase, visitPhase, completionEl].forEach(resetAnimatedStyles);
}

function buildPoints() {
  if (!pointsContainer) return;
  pointsContainer.innerHTML = '';

  MAP_POINTS.forEach(point => {
    const item = document.createElement('div');
    const isUnnamed = Boolean(point.isEndPoint);
    item.className =
      `map-col-point is-placed${isUnnamed ? ' map-col-point--unnamed' : ''}`;
    item.dataset.pointId = point.id;
    item.style.left = `${point.svgCoords.x * 100}%`;
    item.style.top = `${point.svgCoords.y * 100}%`;
    item.setAttribute('role', 'listitem');
    item.setAttribute(
      'aria-label',
      isUnnamed
        ? 'Cruz sin nombre'
        : `${point.person} · recuerdo relacionado`,
    );

    const mark = document.createElement('span');
    mark.className = 'map-col-point__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '×';
    item.appendChild(mark);

    if (!isUnnamed) {
      const label = document.createElement('span');
      label.className = 'map-col-point__label';
      label.textContent = point.person;
      item.appendChild(label);
    }

    pointsContainer.appendChild(item);
  });
}

function inspectUnnamedPoint() {
  if (currentStep >= 1) return;
  currentStep = 1;
  syncView();
  revealPhase(recognitionPhase);
  recognitionPhase?.focus();
}

function followApproximateLocation() {
  if (currentStep >= 2) return;
  currentStep = 2;
  syncView();
  revealPhase(visitPhase);
  visitPhase?.focus();
}

function completeVisit() {
  if (completed) return;
  completed = true;
  currentStep = 3;
  syncView();
  onCompleteCallback?.();
  revealPhase(completionEl);
  completionEl?.focus();
}

function syncView() {
  const point = pointsContainer?.querySelector('.map-col-point--unnamed');
  point?.classList.toggle('is-emphasized', currentStep >= 1);

  recognitionPhase.hidden = currentStep < 1;
  visitPhase.hidden = currentStep < 2;
  completionEl.hidden = !completed;

  inspectBtn.disabled = currentStep >= 1;
  inspectBtn.setAttribute('aria-expanded', String(currentStep >= 1));
  inspectBtn.textContent = currentStep >= 1
    ? 'Cruz sin nombre ampliada'
    : 'Ampliar la cruz sin nombre';

  followBtn.disabled = currentStep >= 2;
  followBtn.setAttribute('aria-expanded', String(currentStep >= 2));
  followBtn.textContent = currentStep >= 2
    ? 'Ubicación aproximada recorrida'
    : 'Seguir la ubicación aproximada';

  completeBtn.disabled = completed;
  completeBtn.setAttribute('aria-expanded', String(completed));
  completeBtn.textContent = completed
    ? 'Visita registrada'
    : 'Registrar la visita y volver al laboratorio';

  if (statusEl) {
    statusEl.textContent = completed
      ? 'Visita registrada · regreso al laboratorio'
      : currentStep >= 2
        ? 'Visita de campo'
        : currentStep >= 1
          ? 'Zona reconocida'
          : 'Una marca todavía sola';
  }
}

function revealPhase(element) {
  if (!element || state.get('reducedMotion') ||
      typeof window.gsap === 'undefined') return;

  window.gsap.fromTo(
    element,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
  );
}

function resetAnimatedStyles(element) {
  if (!element) return;
  element.style.removeProperty('opacity');
  element.style.removeProperty('transform');
}
