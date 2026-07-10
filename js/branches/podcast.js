/**
 * BRANCHES/PODCAST.JS
 * La Memoria de una Ciudad — Rama 01: Don Ernesto Huanca
 *
 * Genera la onda como SVG, sincroniza la transcripción de dos encuentros
 * y revela la evidencia física (papel 1·9·6) en el momento clave.
 */

import { state } from '../core/state.js';
import { TRANSCRIPT, TOTAL_DURATION, formatTime } from '../data/transcript.js';

const AUDIO_SRC = 'assets/audio/entrevista-ernesto.mp3';
const TOTAL_DURATION_FALLBACK = 65;
const ENCOUNTER_LABELS = {
  1: 'Primer encuentro · El reconocimiento',
  2: 'Segunda visita · La caja',
};

let audioEl, playBtn, scrubber, fillEl, timeEl, transcriptEl, waveformEl;
let controlsEl, durationEl, evidenceEl, liveStatusEl;
let rafId = null;
let onCompleteCallback = null;
let keyMomentTriggered = false;
let activeTranscriptIndex = -1;
let desiredPlaybackTime = 0;

// Fase 6: los nodos del DOM de esta rama persisten entre entradas — el usuario
// puede cerrar y reabrir la rama varias veces en la misma sesión, y asideEl
// nunca se destruye, solo se colapsa. Sin esta bandera, bindControls() volvería
// a registrar los mismos listeners en los mismos elementos cada vez que se
// reingresa, duplicando cada disparo (doble, triple reproducción por clic, etc.).
let listenersBound = false;

export function initPodcast(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;
  keyMomentTriggered = false;

  audioEl      = asideEl.querySelector('#podcast-audio');
  playBtn      = asideEl.querySelector('#podcast-play');
  scrubber     = asideEl.querySelector('#podcast-scrubber');
  fillEl       = asideEl.querySelector('.podcast-controls__fill');
  timeEl       = asideEl.querySelector('#podcast-time');
  transcriptEl = asideEl.querySelector('#podcast-transcript');
  waveformEl   = asideEl.querySelector('#podcast-waveform');
  controlsEl   = asideEl.querySelector('.podcast-controls');
  durationEl   = asideEl.querySelector('.podcast-controls__duration');
  evidenceEl   = asideEl.querySelector('#evidence-196');
  liveStatusEl = asideEl.querySelector('#podcast-live-status');
  activeTranscriptIndex = -1;
  desiredPlaybackTime = 0;

  // Carga diferida del audio: solo ahora, al entrar a la rama
  audioEl.preload = 'auto';
  audioEl.src = AUDIO_SRC;
  audioEl.load();

  // El audio reinicia desde cero en cada entrada (arriba), así que la
  // evidencia física también debe volver a su estado oculto — si no,
  // quedaría visible desde el segundo 0 por haberse revelado en una
  // visita anterior, antes de que la grabación llegue de nuevo a ese punto.
  const evidenceAlreadyFound = state.get('evidence').ernesto196;
  evidenceEl.hidden = !evidenceAlreadyFound;
  evidenceEl.setAttribute('aria-hidden', String(!evidenceAlreadyFound));
  evidenceEl.classList.toggle('is-revealed', evidenceAlreadyFound);

  buildTranscript();
  buildWaveform();
  activeTranscriptIndex = 0;
  updateUI(0, TOTAL_DURATION_FALLBACK);
  activeTranscriptIndex = -1;
  if (evidenceAlreadyFound) {
    waveformEl.querySelector('.waveform-marker')?.classList.add('is-visible');
  }

  if (!listenersBound) {
    bindControls();
    listenersBound = true;
  }
}

export function destroyPodcast(asideEl) {
  audioEl?.pause();
  cancelAnimationFrame(rafId);
  rafId = null;
  if (playBtn) {
    playBtn.dataset.state = 'paused';
    if (!playBtn.disabled) playBtn.setAttribute('aria-label', 'Reproducir');
  }
}

/* ═══════════════════════════════════════════════════════
   TRANSCRIPCIÓN
═══════════════════════════════════════════════════════ */

function buildTranscript() {
  transcriptEl.innerHTML = '';
  let currentEncounter = null;

  TRANSCRIPT.forEach((line, i) => {
    if (line.encounter !== currentEncounter) {
      currentEncounter = line.encounter;
      const divider = document.createElement('p');
      divider.className = 'transcript-encounter archive-label';
      divider.textContent = ENCOUNTER_LABELS[currentEncounter] || `Encuentro ${currentEncounter}`;
      transcriptEl.appendChild(divider);
    }

    const lineEl = document.createElement('div');
    lineEl.className = 'transcript-line';
    lineEl.setAttribute('role', 'button');
    lineEl.setAttribute('tabindex', '0');
    lineEl.dataset.start = line.startTime;
    lineEl.dataset.end   = line.endTime;
    lineEl.dataset.index = String(i);
    lineEl.setAttribute(
      'aria-label',
      `Escuchar desde ${formatTime(line.startTime)}. Don Ernesto: ${line.text}`,
    );
    if (line.isKeyMoment) lineEl.dataset.keyMoment = 'true';

    const textEl = document.createElement('p');
    textEl.className = 'transcript-line__text';
    const speaker = document.createElement('span');
    speaker.className = 'sr-only';
    speaker.textContent = 'Don Ernesto: ';
    textEl.append(speaker, document.createTextNode(line.text));
    lineEl.appendChild(textEl);

    if (line.marginNote) {
      const note = document.createElement('aside');
      note.className = 'transcript-note';
      note.setAttribute('aria-label', 'Nota de Valeria');
      const noteText = document.createElement('p');
      noteText.className = 'transcript-note__text handwriting';
      noteText.textContent = line.marginNote.text;
      note.appendChild(noteText);
      lineEl.appendChild(note);
    }

    transcriptEl.appendChild(lineEl);
  });

  transcriptEl.querySelectorAll('.transcript-line').forEach(lineEl => {
    lineEl.addEventListener('click', () => seekToTranscriptLine(lineEl));
    lineEl.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      seekToTranscriptLine(lineEl);
    });
  });
}

async function seekToTranscriptLine(lineEl) {
  if (!audioEl || !lineEl) return;

  const transcriptStart = Number.parseFloat(lineEl.dataset.start || '0');
  const duration = await getPlayableDuration();
  const targetTime = Math.min(
    duration,
    Math.max(0, transcriptStart * (duration / TOTAL_DURATION)),
  );
  desiredPlaybackTime = targetTime;

  audioEl.pause();
  playBtn.dataset.state = 'paused';
  playBtn.setAttribute('aria-label', 'Reproducir');
  cancelAnimationFrame(rafId);
  rafId = null;

  await seekAudioTo(targetTime);
  updateUI(desiredPlaybackTime, duration);

  if (liveStatusEl) {
    liveStatusEl.textContent = `Audio movido a ${formatTime(transcriptStart)}.`;
  }

  if (!playBtn?.disabled) {
    playFromCurrentPosition(desiredPlaybackTime);
  }
}

function getPlayableDuration() {
  if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
    return Promise.resolve(audioEl.duration);
  }

  return new Promise(resolve => {
    const finish = () => {
      audioEl.removeEventListener('loadedmetadata', finish);
      audioEl.removeEventListener('canplay', finish);
      audioEl.removeEventListener('error', fail);
      resolve(
        Number.isFinite(audioEl.duration) && audioEl.duration > 0
          ? audioEl.duration
          : TOTAL_DURATION_FALLBACK,
      );
    };
    const fail = () => {
      audioEl.removeEventListener('loadedmetadata', finish);
      audioEl.removeEventListener('canplay', finish);
      audioEl.removeEventListener('error', fail);
      resolve(TOTAL_DURATION_FALLBACK);
    };

    audioEl.addEventListener('loadedmetadata', finish, { once: true });
    audioEl.addEventListener('canplay', finish, { once: true });
    audioEl.addEventListener('error', fail, { once: true });
    if (audioEl.networkState === HTMLMediaElement.NETWORK_EMPTY) {
      audioEl.load();
    }
  });
}

function seekAudioTo(targetTime) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      audioEl.removeEventListener('seeked', finish);
      audioEl.removeEventListener('timeupdate', verify);
      window.clearTimeout(timer);
      resolve();
    };
    const verify = () => {
      if (Math.abs(audioEl.currentTime - targetTime) < 0.45) finish();
    };
    const timer = window.setTimeout(() => {
      if (Math.abs(audioEl.currentTime - targetTime) > 0.75) {
        audioEl.currentTime = targetTime;
      }
      finish();
    }, 450);

    audioEl.addEventListener('seeked', finish, { once: true });
    audioEl.addEventListener('timeupdate', verify);

    try {
      audioEl.currentTime = targetTime;
    } catch {
      finish();
    }
  });
}

function playFromCurrentPosition(expectedStart = null) {
  cancelAnimationFrame(rafId);
  rafId = null;

  const startAt = Number.isFinite(expectedStart)
    ? expectedStart
    : desiredPlaybackTime;

  seekAudioTo(startAt)
    .then(() => audioEl.play())
    .then(() => {
      playBtn.dataset.state = 'playing';
      playBtn.setAttribute('aria-label', 'Pausar');
      startProgressLoop();
    })
    .catch(() => {
      playBtn?.focus();
    });
}

function getAudioDuration() {
  return Number.isFinite(audioEl.duration) && audioEl.duration > 0
    ? audioEl.duration
    : TOTAL_DURATION_FALLBACK;
}

function updateTranscriptHighlight(currentTime) {
  const lines = transcriptEl.querySelectorAll('.transcript-line');
  lines.forEach((lineEl, index) => {
    const start = parseFloat(lineEl.dataset.start);
    const end   = parseFloat(lineEl.dataset.end);
    const isActive = currentTime >= start && currentTime < end;
    const isPast   = currentTime >= end;

    lineEl.classList.toggle('is-active', isActive);
    lineEl.classList.toggle('is-past', isPast && !isActive);
    if (isActive) {
      lineEl.setAttribute('aria-current', 'true');
    } else {
      lineEl.removeAttribute('aria-current');
    }

    if (isActive && activeTranscriptIndex !== index) {
      activeTranscriptIndex = index;
      const line = TRANSCRIPT[index];
      if (liveStatusEl) liveStatusEl.textContent = `Don Ernesto: ${line.text}`;
      lineEl.scrollIntoView({
        block: 'nearest',
        behavior: state.get('reducedMotion') ? 'auto' : 'smooth',
      });
    }

    if (isActive && lineEl.dataset.keyMoment === 'true' && !keyMomentTriggered) {
      keyMomentTriggered = true;
      triggerKeyMoment();
    }
  });
}

/* ═══════════════════════════════════════════════════════
   EL MOMENTO CLAVE: revelar el papel 1·9·6
═══════════════════════════════════════════════════════ */

function triggerKeyMoment() {
  const evidenceAlreadyFound = state.get('evidence').ernesto196;
  keyMomentTriggered = true;

  evidenceEl.hidden = false;
  evidenceEl.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    evidenceEl.classList.add('is-revealed');
  });

  // Marcador en la waveform
  const marker = waveformEl.querySelector('.waveform-marker');
  marker?.classList.add('is-visible');

  // Sumar el fragmento al estado global — esto es lo que desbloquea
  // progresivamente el archivo cuando se complete también el 247
  state.recordEvidence('ernesto196');
  if (liveStatusEl) {
    liveStatusEl.textContent = 'Evidencia registrada: la segunda copia contiene el número 196.';
  }

  // El podcast se considera "completo" en cuanto aparece la evidencia:
  // narrativamente, ya hemos extraído lo que esta rama tenía que dar.
  if (!evidenceAlreadyFound) onCompleteCallback?.();
}

/* ═══════════════════════════════════════════════════════
   ONDA DE AUDIO (SVG generado)
   Una línea continua con irregularidad orgánica — no barras digitales.
═══════════════════════════════════════════════════════ */

function buildWaveform() {
  const width  = 600;
  const height = 64;
  const points = 120;

  // Generar una forma de onda pseudo-aleatoria pero estable (semilla fija)
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const pathPoints = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const amplitude = 8 + pseudoRandom() * 20;
    const wobble = Math.sin(i * 0.5) * 4;
    const y = height / 2 + (pseudoRandom() > 0.5 ? 1 : -1) * (amplitude + wobble);
    pathPoints.push([x, y]);
  }

  const pathD = pathPoints.map((p, i) =>
    i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`
  ).join(' ');

  // Posición del marcador del momento clave: ~32.8s sobre 65s totales
  const markerPercent = (32.8 / TOTAL_DURATION) * 100;

  waveformEl.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <path class="waveform-track" d="${pathD}" />
      <path class="waveform-progress" d="${pathD}" />
    </svg>
    <div class="waveform-marker" style="left:${markerPercent}%"></div>
  `;
}

function updateWaveformProgress(fraction) {
  const progressPath = waveformEl.querySelector('.waveform-progress');
  if (progressPath) {
    progressPath.style.clipPath = `inset(0 ${100 - fraction * 100}% 0 0)`;
  }
}

/* ═══════════════════════════════════════════════════════
   CONTROLES DE REPRODUCCIÓN
═══════════════════════════════════════════════════════ */

function bindControls() {
  playBtn.addEventListener('click', togglePlay);

  scrubber.addEventListener('input', () => {
    const duration = getAudioDuration();
    const time = (scrubber.value / 100) * duration;
    desiredPlaybackTime = time;
    seekAudioTo(time);
    updateUI(time, duration);
  });

  audioEl.addEventListener('loadedmetadata', () => {
    const duration = getAudioDuration();
    if (desiredPlaybackTime > 0) {
      seekAudioTo(desiredPlaybackTime);
    }
    updateUI(desiredPlaybackTime, duration);
    if (durationEl) durationEl.textContent = `/ ${formatTime(audioEl.duration)}`;
  });

  audioEl.addEventListener('ended', () => {
    desiredPlaybackTime = 0;
    playBtn.dataset.state = 'paused';
    playBtn.setAttribute('aria-label', 'Reproducir');
    updateUI(audioEl.duration, audioEl.duration);
  });

  audioEl.addEventListener('error', showAudioFallback);
}

function togglePlay() {
  if (audioEl.paused) {
    playFromCurrentPosition(desiredPlaybackTime);
  } else {
    audioEl.pause();
    playBtn.dataset.state = 'paused';
    playBtn.setAttribute('aria-label', 'Reproducir');
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function showAudioFallback() {
  playBtn.disabled = true;
  playBtn.setAttribute('aria-disabled', 'true');
  playBtn.setAttribute('aria-label', 'Recreación sonora pendiente');
  scrubber.disabled = true;
  scrubber.setAttribute('aria-disabled', 'true');
  waveformEl.classList.add('is-unavailable');
  transcriptEl.classList.add('is-static');

  const container = playBtn.closest('.podcast-player') || playBtn.parentElement;
  const existingNotice = container?.querySelector('.asset-notice');
  if (!container || existingNotice) return;

  const notice = document.createElement('div');
  notice.className = 'asset-notice';
  notice.setAttribute('role', 'status');
  notice.innerHTML = `
    <p><strong>Recreación sonora pendiente.</strong> La transcripción completa de los dos encuentros permanece disponible.</p>
    <button type="button" class="asset-notice__continue">
      Confirmar la evidencia descrita
    </button>
  `;
  notice.querySelector('button')?.addEventListener('click', continueFromTranscript);
  controlsEl?.insertAdjacentElement('afterend', notice);
}

function continueFromTranscript() {
  triggerKeyMoment();
  evidenceEl.scrollIntoView({
    block: 'center',
    behavior: state.get('reducedMotion') ? 'auto' : 'smooth',
  });
}

function startProgressLoop() {
  const tick = () => {
    if (audioEl.paused) return;
    const duration = getAudioDuration();
    desiredPlaybackTime = audioEl.currentTime;
    updateUI(audioEl.currentTime, duration);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function updateUI(currentTime, duration) {
  const fraction = duration ? currentTime / duration : 0;
  scrubber.value = fraction * 100;
  scrubber.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
  scrubber.setAttribute('aria-valuetext', `${Math.round(fraction * 100)}%`);
  fillEl.style.width = `${fraction * 100}%`;
  timeEl.textContent = formatTime(currentTime);
  timeEl.setAttribute('datetime', `PT${Math.floor(currentTime)}S`);

  updateWaveformProgress(fraction);
  const transcriptTime = duration
    ? currentTime * (TOTAL_DURATION / duration)
    : currentTime;
  updateTranscriptHighlight(Math.min(transcriptTime, TOTAL_DURATION));
}
