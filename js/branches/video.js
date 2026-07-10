/**
 * BRANCHES/VIDEO.JS
 * La Memoria de una Ciudad — Familia Quispe
 *
 * Carga el registro audiovisual únicamente al abrir la rama. La evidencia se
 * completa cuando el usuario examina la hoja, nunca por alcanzar un segundo
 * arbitrario del video. La descripción textual mantiene el recorrido disponible
 * cuando faltan el video o los subtítulos.
 */

import { state } from '../core/state.js';

const VIDEO_SRC = 'assets/video/quispe-sobre.mp4';
const CAPTIONS_SRC = 'assets/video/quispe-sobre.vtt';

let videoEl;
let captionsEl;
let statusEl;
let reviewBtn;
let evidenceEl;
let onCompleteCallback = null;
let revealRafId = null;
let resourceIssues = new Set();

export function initVideo(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;

  videoEl = asideEl.querySelector('#quispe-video');
  captionsEl = asideEl.querySelector('#quispe-captions');
  statusEl = asideEl.querySelector('#video-resource-status');
  reviewBtn = asideEl.querySelector('#video-evidence-review');
  evidenceEl = asideEl.querySelector('#evidence-247-confirm');

  bindInteractions();
  syncEvidence();
  loadResources();
}

export function destroyVideo() {
  cancelAnimationFrame(revealRafId);
  revealRafId = null;

  if (videoEl) {
    videoEl.pause();
    if (Number.isFinite(videoEl.duration)) videoEl.currentTime = 0;
  }
}

function bindInteractions() {
  if (reviewBtn?.dataset.videoBound !== 'true') {
    reviewBtn.dataset.videoBound = 'true';
    reviewBtn.addEventListener('click', revealEvidence);
  }

  if (videoEl?.dataset.videoBound !== 'true') {
    videoEl.dataset.videoBound = 'true';
    videoEl.addEventListener('loadedmetadata', handleVideoReady);
    videoEl.addEventListener('error', handleVideoError);
  }

  if (captionsEl?.dataset.videoBound !== 'true') {
    captionsEl.dataset.videoBound = 'true';
    captionsEl.addEventListener('load', handleCaptionsReady);
    captionsEl.addEventListener('error', handleCaptionsError);
  }
}

function loadResources() {
  resourceIssues = new Set();
  renderResourceStatus();

  videoEl.hidden = false;
  videoEl.removeAttribute('aria-hidden');
  videoEl.preload = 'metadata';

  if (videoEl.getAttribute('src') !== VIDEO_SRC) videoEl.src = VIDEO_SRC;
  if (captionsEl.getAttribute('src') !== CAPTIONS_SRC) captionsEl.src = CAPTIONS_SRC;

  videoEl.load();
}

function handleVideoReady() {
  resourceIssues.delete('video');
  videoEl.hidden = false;
  videoEl.removeAttribute('aria-hidden');
  renderResourceStatus();
}

function handleVideoError() {
  resourceIssues.add('video');
  videoEl.hidden = true;
  videoEl.setAttribute('aria-hidden', 'true');
  renderResourceStatus();
}

function handleCaptionsReady() {
  resourceIssues.delete('captions');
  renderResourceStatus();
}

function handleCaptionsError() {
  resourceIssues.add('captions');
  renderResourceStatus();
}

function renderResourceStatus() {
  if (!statusEl) return;

  if (resourceIssues.has('video')) {
    statusEl.textContent =
      'El video no aparece. El sobre y la hoja todavía pueden revisarse.';
    statusEl.hidden = false;
    return;
  }

  if (resourceIssues.has('captions')) {
    statusEl.textContent =
      'Los subtítulos no aparecen. La escena también queda descrita junto al documento.';
    statusEl.hidden = false;
    return;
  }

  statusEl.textContent = '';
  statusEl.hidden = true;
}

function syncEvidence() {
  const evidenceAlreadyFound = state.get('evidence').quispe247Confirmed;

  evidenceEl.hidden = !evidenceAlreadyFound;
  evidenceEl.setAttribute('aria-hidden', String(!evidenceAlreadyFound));
  evidenceEl.classList.toggle('is-revealed', evidenceAlreadyFound);
  reviewBtn.setAttribute('aria-expanded', String(evidenceAlreadyFound));
  reviewBtn.textContent = evidenceAlreadyFound
    ? 'Volver a examinar la hoja'
    : 'Examinar la hoja';
}

function revealEvidence() {
  const evidenceAlreadyFound = state.get('evidence').quispe247Confirmed;

  evidenceEl.hidden = false;
  evidenceEl.setAttribute('aria-hidden', 'false');
  reviewBtn.setAttribute('aria-expanded', 'true');
  reviewBtn.textContent = 'Volver a examinar la hoja';

  cancelAnimationFrame(revealRafId);
  revealRafId = requestAnimationFrame(() => {
    evidenceEl.classList.add('is-revealed');
    evidenceEl.focus({ preventScroll: false });
    revealRafId = null;
  });

  state.recordEvidence('quispe247Confirmed');
  if (!evidenceAlreadyFound) onCompleteCallback?.();
}
