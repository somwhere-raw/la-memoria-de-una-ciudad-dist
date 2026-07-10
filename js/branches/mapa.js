/**
 * BRANCHES/MAPA.JS
 * La Memoria de una Ciudad — Rama 02: El mapa vivo de Lucía
 *
 * Gestiona la revelación secuencial de los puntos sobre el mapa,
 * la interacción de selección (panel de detalle lateral), el
 * trama de zonas amenazadas, y la revelación de la marca 247 en
 * la esquina del mapa al revisar los dos puntos conocidos.
 */

import { state }         from '../core/state.js';
import { MAP_POINTS }    from '../data/map-points.js';
import { revealElement } from '../core/reveal.js';

let surfaceEl, pointsContainer, detailEl, countEl, evidenceEl;
let onCompleteCallback = null;
let interactedPoints = new Set();
let evidenceTriggered = false;
let requiredPointCount = 0;
let loadRafId = null;
let detailFocusRafId = null;

let revealTimers = [];

export function initMapa(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;

  surfaceEl       = asideEl.querySelector('.mapa-canvas__surface');
  pointsContainer = asideEl.querySelector('.mapa-points');
  detailEl        = asideEl.querySelector('#mapa-detail');
  countEl         = asideEl.querySelector('#mapa-verified');
  evidenceEl      = asideEl.querySelector('#evidence-247-mapa');
  requiredPointCount = pointsContainer.querySelectorAll('.mapa-point').length;

  // interactedPoints y evidenceTriggered no se reinician: si el usuario
  // ya exploró los dos puntos en una visita anterior a esta
  // rama, reabrirla debe mostrar ese progreso tal cual quedó, no reiniciarlo
  // (la experiencia recuerda dónde se quedó).
  const evidenceAlreadyFound = state.get('evidence').lucia247;
  evidenceTriggered ||= evidenceAlreadyFound;
  evidenceEl.hidden = !evidenceAlreadyFound;
  evidenceEl.setAttribute('aria-hidden', String(!evidenceAlreadyFound));
  evidenceEl.classList.toggle('is-revealed', evidenceAlreadyFound);
  updateCounter();

  revealPointsSequentially();

  bindPointInteractions();
  bindDetailClose();

  // La trama se activa cuando el mapa está listo.
  loadRafId = requestAnimationFrame(() => {
    surfaceEl.classList.add('is-loaded');
  });
}

export function destroyMapa(asideEl) {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  cancelAnimationFrame(loadRafId);
  loadRafId = null;
  cancelAnimationFrame(detailFocusRafId);
  detailFocusRafId = null;
  closeDetail({ restoreFocus: false });

  const photoEl = detailEl?.querySelector('.mapa-detail__photo');
  if (photoEl) {
    photoEl.onload = null;
    photoEl.onerror = null;
    if (typeof window.gsap !== 'undefined') gsap.killTweensOf(photoEl);
  }
}

/* ═══════════════════════════════════════════════════════
   REVELACIÓN SECUENCIAL DE PUNTOS
   Solo los dos puntos conocidos en esta rama: Ernesto y Lucía.
   Quispe y el punto sin nombre todavía no forman parte de este mapa visible.
═══════════════════════════════════════════════════════ */

function revealPointsSequentially() {
  const visiblePoints = pointsContainer.querySelectorAll('.mapa-point');

  visiblePoints.forEach((point, i) => {
    const delay = state.get('reducedMotion') ? 0 : i * 0.35;
    const timer = setTimeout(() => {
      point.classList.add('is-visible');
    }, delay * 1000);
    revealTimers.push(timer);
  });
}

/* ═══════════════════════════════════════════════════════
   INTERACCIÓN CON PUNTOS — abrir panel de detalle
═══════════════════════════════════════════════════════ */

function bindPointInteractions() {
  pointsContainer.querySelectorAll('.mapa-point').forEach(point => {
    if (point.dataset.mapaBound === 'true') return;
    point.dataset.mapaBound = 'true';
    point.setAttribute('aria-pressed', 'false');

    point.addEventListener('click', () => {
      const pointId = point.dataset.pointId;
      const data = MAP_POINTS.find(p => p.id === pointId);
      if (!data) return;

      // Estado activo visual + semántico (un solo punto seleccionado a la vez)
      pointsContainer.querySelectorAll('.mapa-point.is-active')
        .forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-pressed', 'false');
        });
      point.classList.add('is-active');
      point.setAttribute('aria-pressed', 'true');

      showDetail(data);

      if (!interactedPoints.has(pointId)) {
        interactedPoints.add(pointId);
        updateCounter();
      }

      // El branch se completa al revisar los puntos conocidos en este
      // momento. La familia Quispe todavía no ha sido identificada.
      if (interactedPoints.size >= requiredPointCount && !evidenceTriggered) {
        evidenceTriggered = true;
        revealMapEvidence();
        onCompleteCallback?.();
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════
   LA MARCA 247 EN LA ESQUINA DEL MAPA
   Aparece solo cuando los dos puntos conocidos fueron explorados.
   En este momento es una cifra sin función confirmada.
═══════════════════════════════════════════════════════ */

function revealMapEvidence() {
  if (!evidenceEl) return;

  evidenceEl.hidden = false;
  evidenceEl.removeAttribute('aria-hidden');

  requestAnimationFrame(() => {
    evidenceEl.classList.add('is-revealed');
  });

  state.recordEvidence('lucia247');
}

function showDetail(data) {
  detailEl.hidden = false;
  detailEl.classList.add('is-active');
  detailEl.classList.toggle('is-unnamed', !data.person);

  const photoEl = detailEl.querySelector('.mapa-detail__photo');
  const photoStatusEl = detailEl.querySelector('.mapa-detail__photo-status');
  const personEl = detailEl.querySelector('.mapa-detail__person');
  const occEl = detailEl.querySelector('.mapa-detail__occupation');
  const addrEl = detailEl.querySelector('.mapa-detail__address');
  const capEl = detailEl.querySelector('.mapa-detail__caption');

  if (data.photo) {
    let settled = false;
    const showLoadedPhoto = () => {
      if (settled) return;
      settled = true;
      photoEl.hidden = false;
      photoEl.classList.remove('asset-missing', 'is-revealed');
      if (photoStatusEl) photoStatusEl.hidden = true;
      revealElement(photoEl, { delay: 0.1 });
    };
    const showPhotoFallback = () => {
      if (settled) return;
      settled = true;
      photoEl.hidden = true;
      photoEl.classList.add('asset-missing');
      if (photoStatusEl) {
        photoStatusEl.hidden = false;
        photoStatusEl.textContent =
          'La imagen no aparece, pero el recuerdo sigue marcado en el mapa.';
      }
    };

    photoEl.onload = showLoadedPhoto;
    photoEl.onerror = showPhotoFallback;
    photoEl.alt = data.occupation
      ? `Fotografía de ${data.person}, ${data.occupation}`
      : `Fotografía de ${data.person}`;
    photoEl.hidden = false;
    if (photoStatusEl) photoStatusEl.hidden = true;
    photoEl.src = data.photo;

    if (photoEl.complete) {
      if (photoEl.naturalWidth > 0) showLoadedPhoto();
      else showPhotoFallback();
    }
  } else {
    photoEl.hidden = true;
    if (photoStatusEl) {
      photoStatusEl.hidden = false;
      photoStatusEl.textContent = 'Este punto quedó sin fotografía.';
    }
  }

  personEl.textContent = data.person || 'Sin identificar todavía';
  occEl.textContent    = data.occupation || '';
  addrEl.textContent   = data.address || '';
  capEl.textContent    = data.caption || '';
}

function bindDetailClose() {
  const closeBtn = detailEl.querySelector('.mapa-detail__close');
  if (!closeBtn || closeBtn.dataset.mapaBound === 'true') return;

  closeBtn.dataset.mapaBound = 'true';
  closeBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeDetail();
  });
}

function closeDetail({ restoreFocus = true } = {}) {
  if (!detailEl) return;

  let lastActive = null;
  pointsContainer?.querySelectorAll('.mapa-point.is-active')
    .forEach(point => {
      point.classList.remove('is-active');
      point.setAttribute('aria-pressed', 'false');
      lastActive = point;
    });

  detailEl.classList.remove('is-active');
  detailEl.hidden = true;
  cancelAnimationFrame(detailFocusRafId);
  detailFocusRafId = null;

  if (restoreFocus && lastActive) {
    detailFocusRafId = requestAnimationFrame(() => {
      if (detailEl?.hidden) lastActive.focus({ preventScroll: true });
      detailFocusRafId = null;
    });
  }
}

function updateCounter() {
  if (countEl) countEl.textContent = String(interactedPoints.size);
}
