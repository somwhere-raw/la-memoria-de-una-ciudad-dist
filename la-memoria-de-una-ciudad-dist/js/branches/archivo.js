/**
 * BRANCHES/ARCHIVO.JS
 * La Memoria de una Ciudad — El compartimento
 *
 * El código ya fue reconstruido antes de entrar. Los diales ofrecen una
 * manipulación física y accesible, pero no funcionan como acertijo. Cerrar la
 * rama cancela la animación sin completar la evidencia en segundo plano.
 */

import { state } from '../core/state.js';

const COMBINATION = Object.freeze([1, 9, 6, 2, 4, 7]);

let dials = [];
let dialValues = [0, 0, 0, 0, 0, 0];
let hatchEl;
let mechanismBodyEl;
let mechanismEl;
let statusEl;
let phase1El;
let phase2El;
let contentsEl;
let onCompleteCallback = null;
let sequenceState = 'idle';
let activeTimeline = null;

export function initArchivo(asideEl, { onComplete } = {}) {
  onCompleteCallback = onComplete;

  dials = Array.from(asideEl.querySelectorAll('.camera-dial'));
  hatchEl = asideEl.querySelector('#camera-hatch');
  mechanismBodyEl = asideEl.querySelector('.camera-mechanism__body');
  mechanismEl = asideEl.querySelector('.dial-mechanism');
  statusEl = asideEl.querySelector('#dial-status');
  phase1El = asideEl.querySelector('#archivo-phase-1');
  phase2El = asideEl.querySelector('#archivo-phase-2');
  contentsEl = phase2El.querySelector('.compartimento-open');

  bindInteractions();

  if (state.get('compartmentOpened')) {
    showOpenedState();
    return;
  }

  showDialState();

  if (state.get('combinationEntered')) {
    dialValues = [...COMBINATION];
    syncAllDials();
    startOpeningSequence();
  } else {
    syncAllDials();
  }
}

export function destroyArchivo() {
  activeTimeline?.kill();
  activeTimeline = null;

  if (typeof window.gsap !== 'undefined') {
    dials.forEach(dial => gsap.killTweensOf(dial));
    gsap.killTweensOf([phase1El, phase2El, hatchEl, mechanismBodyEl, contentsEl]);
  }

  mechanismBodyEl?.classList.remove('has-clicked');
  mechanismBodyEl?.style.removeProperty('--flash-opacity');
  mechanismEl?.removeAttribute('aria-busy');

  if (sequenceState === 'opening' && !state.get('compartmentOpened')) {
    sequenceState = 'idle';
  }
}

function bindInteractions() {
  dials.forEach((dial, index) => {
    if (dial.dataset.archivoBound === 'true') return;
    dial.dataset.archivoBound = 'true';

    let dragStartY = 0;
    let dragStartValue = 0;
    let isDragging = false;

    dial.addEventListener('pointerdown', event => {
      if (sequenceState !== 'idle') return;
      isDragging = true;
      dragStartY = event.clientY;
      dragStartValue = dialValues[index];
      dial.setPointerCapture?.(event.pointerId);
    });

    dial.addEventListener('pointermove', event => {
      if (!isDragging || sequenceState !== 'idle') return;
      const steps = Math.round((dragStartY - event.clientY) / 20);
      setDialValue(index, dragStartValue + steps);
    });

    const finishDrag = event => {
      isDragging = false;
      if (event?.pointerId != null && dial.hasPointerCapture?.(event.pointerId)) {
        dial.releasePointerCapture(event.pointerId);
      }
    };

    dial.addEventListener('pointerup', finishDrag);
    dial.addEventListener('pointercancel', finishDrag);

    dial.addEventListener('wheel', event => {
      if (sequenceState !== 'idle') return;
      event.preventDefault();
      setDialValue(index, dialValues[index] + (event.deltaY > 0 ? -1 : 1));
    }, { passive: false });

    dial.addEventListener('keydown', event => {
      if (sequenceState !== 'idle') return;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setDialValue(index, dialValues[index] + 1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setDialValue(index, dialValues[index] - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setDialValue(index, 0);
      }
    });
  });

}

function setDialValue(index, rawValue, { verify = true } = {}) {
  if (sequenceState !== 'idle') return;

  dialValues[index] = ((rawValue % 10) + 10) % 10;
  syncDial(index);

  if (statusEl) {
    statusEl.textContent =
      `Dial ${index + 1}: ${dialValues[index]}. Continúa con la combinación reconstruida.`;
  }

  if (verify) checkCombination();
}

function syncDial(index) {
  const dial = dials[index];
  if (!dial) return;

  const value = dialValues[index];
  dial.textContent = String(value);
  dial.setAttribute('aria-valuenow', String(value));
  dial.setAttribute(
    'aria-valuetext',
    `${value}. El valor reconstruido para esta posición es ${COMBINATION[index]}.`,
  );
  dial.classList.toggle('is-correct', value === COMBINATION[index]);
}

function syncAllDials() {
  dials.forEach((_, index) => syncDial(index));
}

function checkCombination() {
  const isComplete = dialValues.every((value, index) => value === COMBINATION[index]);
  if (!isComplete || sequenceState !== 'idle') return;

  state.set('combinationEntered', true);
  startOpeningSequence();
}

function startOpeningSequence() {
  if (sequenceState !== 'idle' || state.get('compartmentOpened')) return;

  sequenceState = 'opening';
  setInteractionEnabled(false);
  mechanismEl?.setAttribute('aria-busy', 'true');

  if (statusEl) {
    statusEl.textContent = 'Combinación correcta. El mecanismo se libera.';
    statusEl.classList.add('is-correct');
  }

  const reduced = state.get('reducedMotion');
  if (reduced || typeof window.gsap === 'undefined') {
    hatchEl.setAttribute('data-state', 'open');
    transitionToContents();
    return;
  }

  mechanismBodyEl.classList.add('has-clicked');
  activeTimeline = gsap.timeline({
    onComplete: () => {
      activeTimeline = null;
    },
  });

  activeTimeline.to(mechanismBodyEl, {
    duration: 0.25,
    ease: 'power1.inOut',
    onUpdate() {
      const progress = this.progress();
      const opacity = progress < 0.35
        ? progress / 0.35
        : 1 - ((progress - 0.35) / 0.65);
      mechanismBodyEl.style.setProperty(
        '--flash-opacity',
        String(Math.max(0, opacity)),
      );
    },
    onComplete: () => {
      mechanismBodyEl.classList.remove('has-clicked');
      mechanismBodyEl.style.removeProperty('--flash-opacity');
    },
  });

  activeTimeline.to(hatchEl, {
    duration: 0.65,
    ease: 'power2.inOut',
    onStart: () => hatchEl.setAttribute('data-state', 'open'),
  });

  activeTimeline.add(transitionToContents, '+=0.15');
}

function transitionToContents() {
  const reduced = state.get('reducedMotion');

  if (reduced || typeof window.gsap === 'undefined') {
    phase1El.hidden = true;
    phase2El.hidden = false;
    phase2El.style.opacity = '1';
    revealContents();
    return;
  }

  gsap.to(phase1El, {
    opacity: 0,
    y: -8,
    duration: 0.3,
    ease: 'power2.inOut',
    onComplete: () => {
      phase1El.hidden = true;
      phase2El.hidden = false;

      gsap.fromTo(
        phase2El,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          onComplete: revealContents,
        },
      );
    },
  });
}

function revealContents() {
  const evidenceAlreadyCompleted = state.get('compartmentOpened');

  contentsEl?.classList.add('is-revealed');
  phase2El?.focus({ preventScroll: false });
  mechanismEl?.removeAttribute('aria-busy');
  sequenceState = 'open';

  state.set('compartmentOpened', true);
  if (!evidenceAlreadyCompleted) onCompleteCallback?.();
}

function showDialState() {
  sequenceState = 'idle';
  phase1El.hidden = false;
  phase1El.style.removeProperty('opacity');
  phase1El.style.removeProperty('transform');
  phase2El.hidden = true;
  phase2El.style.removeProperty('opacity');
  phase2El.style.removeProperty('transform');
  contentsEl?.classList.remove('is-revealed');
  hatchEl.setAttribute('data-state', 'closed');
  mechanismEl?.removeAttribute('aria-busy');
  statusEl?.classList.remove('is-correct');
  if (statusEl) statusEl.textContent = 'Gira los diales para ingresar la combinación.';
  setInteractionEnabled(true);
}

function showOpenedState() {
  dialValues = [...COMBINATION];
  syncAllDials();
  sequenceState = 'open';
  phase1El.hidden = true;
  phase2El.hidden = false;
  phase2El.style.opacity = '1';
  phase2El.style.removeProperty('transform');
  contentsEl?.classList.add('is-revealed');
  hatchEl.setAttribute('data-state', 'open');
  mechanismEl?.removeAttribute('aria-busy');
  setInteractionEnabled(false);
}

function setInteractionEnabled(enabled) {
  dials.forEach(dial => {
    dial.setAttribute('aria-disabled', String(!enabled));
    dial.tabIndex = enabled ? 0 : -1;
  });

}
