/**
 * SPINE/SPINE.JS
 * La Memoria de una Ciudad
 *
 * SpineController: recorre SPINE_BEATS, crea un ScrollTrigger por beat,
 * actualiza el spine-indicator lateral, gestiona la animación de
 * desbloqueo del lock-gate, y notifica a fishbone.js cuando el usuario
 * activa un nodo de rama.
 */

import { state }              from '../core/state.js';
import { SPINE_BEATS }        from '../data/spine-beats.js';
import { revealText, observe } from '../core/reveal.js';
import { scrollTo }           from '../core/scroll.js';

let onBranchActivate = null; // callback inyectado por main.js / fishbone.js
let highestRevealedBeat = 0;

const ACT_BY_BEAT = {
  hallazgo: 'La ciudad inadvertida',
  pista: 'La ciudad inadvertida',
  rollo: 'Bajo la luz roja',
  instagram: 'Los nombres',
  ernesto: 'Los nombres',
  lucia: 'Los nombres',
  quispe: 'Los nombres',
  mecanismo: 'La combinación',
  codigo: 'La combinación',
  gabriel: 'El archivo de Gabriel',
  'mapa-col': 'La última memoria',
  brena: 'La última memoria',
  nina: 'La última memoria',
  nota: 'La última memoria',
  cierre: 'La ciudad recuerda',
};

export function initSpine({ onActivateBranch } = {}) {
  onBranchActivate = onActivateBranch;

  registerScrollTriggers();
  bindIndicatorNav();
  bindBranchTriggerButtons();
  bindLockGate();
  bindContactSheetFlip();
  bindInstagramThumbs();
  bindHomeLink();
  updateIndicatorAvailability(0);
  bindNarrativeGates();
  updateCurrentAct(SPINE_BEATS[0]);
}

function bindNarrativeGates() {
  const sync = () => {
    setGate(['#beat-mecanismo', '#beat-codigo'], state.get('archiveUnlocked'));
    setGate(['#beat-gabriel'], state.get('compartmentOpened'));
    setGate(['#beat-mapa-col'], state.get('lastPointUnlocked'));
    setGate(['#beat-brena'], state.get('lastMemoryUnlocked'));
    setGate(
      ['#beat-nina', '#beat-nota', '#beat-cierre'],
      state.get('climaxUnlocked'),
    );
    refreshScrollTriggers();
  };

  state.on(
    [
      'archiveUnlocked',
      'compartmentOpened',
      'lastPointUnlocked',
      'lastMemoryUnlocked',
      'climaxUnlocked',
    ],
    sync,
  );
  sync();
}

function setGate(selectors, isOpen) {
  selectors.forEach(selector => {
    const section = document.querySelector(selector);
    section?.classList.toggle('is-gate-open', Boolean(isOpen));
    section?.setAttribute('aria-hidden', String(!isOpen));
  });
}

/* ═══════════════════════════════════════════════════════
   1. SCROLLTRIGGER POR BEAT
   Activa el estado .is-active en el spine-indicator,
   y dispara el pin cinemático cuando corresponde.
═══════════════════════════════════════════════════════ */

function registerScrollTriggers() {
  if (typeof window.ScrollTrigger === 'undefined') {
    registerNativeObservers();
    return;
  }

  SPINE_BEATS.forEach(beat => {
    const section = document.querySelector(beat.domSelector);
    if (!section) return;

    ScrollTrigger.create({
      trigger:     section,
      start:       'top 60%',
      end:         'bottom 40%',
      onEnter:     () => activateBeat(beat),
      onEnterBack: () => activateBeat(beat),
      onLeave:     () => maybeDeactivate(beat),
      onLeaveBack: () => maybeDeactivate(beat),
    });

    if (beat.scrollPin && !state.get('reducedMotion')) {
      ScrollTrigger.create({
        trigger: section,
        start:   'top top',
        end:     `+=${beat.pinDuration || '100%'}`,
        pin:     true,
        pinSpacing: true,
      });
    }
  });

  // Progreso global del eje → fill del indicador lateral
  const spineEl = document.querySelector('#spine');
  ScrollTrigger.create({
    trigger: spineEl,
    start:   'top top',
    end:     'bottom bottom',
    onUpdate: (self) => {
      state.set('spineProgress', self.progress);
      const fill = document.querySelector('#spine-fill');
      if (fill) fill.style.height = `${self.progress * 100}%`;
      spineEl?.style.setProperty('--spine-progress', String(self.progress));
    },
  });
}

function registerNativeObservers() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const beat = SPINE_BEATS.find(item => item.domSelector === `#${entry.target.id}`);
      if (beat) activateBeat(beat);
    });
  }, { rootMargin: '-35% 0px -45%', threshold: 0 });

  SPINE_BEATS.forEach(beat => {
    const section = document.querySelector(beat.domSelector);
    if (section) observer.observe(section);
  });

  const updateProgress = () => {
    const spineEl = document.querySelector('#spine');
    if (!spineEl) return;
    const rect = spineEl.getBoundingClientRect();
    const distance = Math.max(1, spineEl.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / distance));
    state.set('spineProgress', progress);
    const fill = document.querySelector('#spine-fill');
    if (fill) fill.style.height = `${progress * 100}%`;
    spineEl.style.setProperty('--spine-progress', String(progress));
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

function activateBeat(beat) {
  const section = document.querySelector(beat.domSelector);
  const rect = section?.getBoundingClientRect();
  const isActuallyInReadingZone = rect &&
    rect.top < window.innerHeight * 0.8 &&
    rect.bottom > window.innerHeight * 0.15;
  if (!isActuallyInReadingZone) return;

  state.set('activeBeat', beat.id);
  updateCurrentAct(beat);
  const beatIndex = SPINE_BEATS.findIndex(item => item.id === beat.id);
  if (beatIndex >= 0) {
    highestRevealedBeat = Math.max(highestRevealedBeat, beatIndex);
    updateIndicatorAvailability(highestRevealedBeat);
  }

  const node = document.querySelector(
    `.spine-indicator__node[data-target="${beat.domSelector.replace('#', '')}"]`
  );

  // Limpiar el estado activo anterior, tanto visual como para lectores de pantalla
  document.querySelectorAll('.spine-indicator__node.is-active')
    .forEach(n => {
      n.classList.remove('is-active');
      n.querySelector('.spine-indicator__dot')?.removeAttribute('aria-current');
    });

  node?.classList.add('is-active');
  node?.querySelector('.spine-indicator__dot')?.setAttribute('aria-current', 'step');

  if (beat.codeFragment && state.get('completedBranches').has(beat.branch)) {
    markIndicatorComplete(beat.domSelector.replace('#', ''));
  }
}

function updateCurrentAct(beat) {
  const actName = ACT_BY_BEAT[beat?.id] || 'La ciudad inadvertida';
  const actElement = document.querySelector('#current-act');
  if (actElement && actElement.textContent !== actName) {
    actElement.textContent = actName;
  }
  document.body.dataset.currentAct = beat?.id || 'hallazgo';
}

function updateIndicatorAvailability(highestIndex) {
  document.querySelectorAll('.spine-indicator__node').forEach(node => {
    const dot = node.querySelector('.spine-indicator__dot');
    if (!dot) return;

    const targetId = node.dataset.target;
    const index = SPINE_BEATS.findIndex(beat => beat.domSelector === `#${targetId}`);
    if (!dot.dataset.revealedLabel) {
      dot.dataset.revealedLabel = dot.getAttribute('aria-label') || 'Momento del relato';
    }

    const isFuture = index > highestIndex;
    dot.disabled = isFuture;
    dot.setAttribute('aria-disabled', String(isFuture));
    dot.setAttribute(
      'aria-label',
      isFuture ? 'Momento del recorrido aún no revelado' : dot.dataset.revealedLabel,
    );
    node.classList.toggle('is-future', isFuture);
  });
}

function bindHomeLink() {
  const homeLink = document.querySelector('.story-header__title[href="#beat-hallazgo"]');
  const firstBeat = SPINE_BEATS[0];
  if (!homeLink || !firstBeat) return;

  homeLink.addEventListener('click', () => {
    state.set('activeBeat', firstBeat.id);
    updateCurrentAct(firstBeat);

    document.querySelectorAll('.spine-indicator__node.is-active')
      .forEach(node => {
        node.classList.remove('is-active');
        node.querySelector('.spine-indicator__dot')?.removeAttribute('aria-current');
      });

    const firstNode = document.querySelector(
      `.spine-indicator__node[data-target="${firstBeat.domSelector.replace('#', '')}"]`,
    );
    firstNode?.classList.add('is-active');
    firstNode?.querySelector('.spine-indicator__dot')?.setAttribute('aria-current', 'step');
  });
}

function maybeDeactivate(beat) {
  // El nodo se mantiene "completo" visualmente si la rama fue completada;
  // solo se retira el estado "activo" puro.
}

function markIndicatorComplete(target) {
  const node = document.querySelector(`.spine-indicator__node[data-target="${target}"]`);
  node?.classList.add('is-complete');
}


/* ═══════════════════════════════════════════════════════
   2. NAVEGACIÓN DESDE EL INDICADOR LATERAL
═══════════════════════════════════════════════════════ */

function bindIndicatorNav() {
  document.querySelectorAll('.spine-indicator__node').forEach(node => {
    const targetId = node.dataset.target;
    const dot = node.querySelector('.spine-indicator__dot');

    dot?.addEventListener('click', () => {
      if (node.dataset.locked === 'true') return; // No navega a nodos bloqueados
      const target = document.getElementById(targetId);
      if (target) scrollTo(target, { offset: -40 });
    });
  });
}


/* ═══════════════════════════════════════════════════════
   3. BOTONES DE ENTRADA A RAMA (en el eje)
   Notifica a fishbone.js vía el callback inyectado.
═══════════════════════════════════════════════════════ */

function bindBranchTriggerButtons() {
  document.querySelectorAll('.branch-node__enter').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const branchId = btn.dataset.branch;
      onBranchActivate?.(branchId);
    });
  });
}


/* ═══════════════════════════════════════════════════════
   4. LOCK-GATE: el desbloqueo del compartimento
   Escucha state.archiveUnlocked y anima los diales de preview
   + retira data-locked + habilita el botón.
═══════════════════════════════════════════════════════ */

function bindLockGate() {
  const sync = (unlocked) => {
    const beatSection   = document.querySelector('#beat-codigo');
    const branchNode     = beatSection?.querySelector('.branch-node--lockable');
    const enterBtn       = beatSection?.querySelector('.branch-node__enter--locked');
    const lockMsg        = document.querySelector('#archivo-lock-msg p');
    const previewDials   = beatSection?.querySelectorAll('.lock-preview__dial');
    const indicatorNode  = document.querySelector('.spine-indicator__node--lock');

    // Combinación completa: 1-9-6-2-4-7
    const COMBINATION = ['1', '9', '6', '2', '4', '7'];
    const reduced = state.get('reducedMotion');

    if (unlocked && previewDials?.length) {
      if (reduced) {
        // Sin stagger ni overshoot: los seis dígitos aparecen a la vez.
        previewDials.forEach((dial, i) => {
          dial.textContent = COMBINATION[i];
        });
      } else if (typeof window.gsap !== 'undefined') {
        gsap.to(previewDials, {
          duration: 0.5,
          stagger:  0.08,
          ease:     'power2.out',
          onStart: () => {
            previewDials.forEach((dial, i) => {
              dial.textContent = COMBINATION[i];
            });
          },
        });
      }
    }

    if (lockMsg) {
      lockMsg.textContent = unlocked
        ? 'El código está completo.'
        : 'Faltan testimonios por reconstruir.';
    }
    if (enterBtn) {
      enterBtn.disabled = false;
      enterBtn.setAttribute('aria-disabled', String(!unlocked));
      enterBtn.setAttribute(
        'aria-label',
        unlocked
          ? 'Abrir el compartimento de la cámara'
          : 'Compartimento bloqueado: faltan testimonios por reconstruir',
      );
    }

    beatSection?.setAttribute('data-locked', String(!unlocked));
    branchNode?.setAttribute('data-locked', String(!unlocked));
    indicatorNode?.setAttribute('data-locked', String(!unlocked));
  };

  state.on('archiveUnlocked', sync);
  sync(state.get('archiveUnlocked'));
}


/* ═══════════════════════════════════════════════════════
   5. CONTACT SHEET: volteo anverso/reverso
═══════════════════════════════════════════════════════ */

function bindContactSheetFlip() {
  document.querySelectorAll('.contact-frame__flip').forEach(btn => {
    btn.addEventListener('click', () => {
      const frame = btn.closest('.contact-frame');
      const isFlipped = frame.classList.toggle('is-flipped');
      btn.setAttribute('aria-pressed', String(isFlipped));

      const back = frame.querySelector('.contact-frame__face--back');
      back?.setAttribute('aria-hidden', String(!isFlipped));

      btn.textContent = isFlipped ? 'Anverso' : 'Reverso';
    });
  });
}


/* ═══════════════════════════════════════════════════════
   6. INSTAGRAM THUMBS: inyectar imágenes reales en los placeholders
═══════════════════════════════════════════════════════ */

function bindInstagramThumbs() {
  const PHOTO_MAP = {
    ernesto: 'assets/images/contact-sheet/ernesto-anverso.jpg',
    lucia:   'assets/images/contact-sheet/lucia-anverso.jpg',
    quispe:  'assets/images/contact-sheet/quispe-anverso.jpg',
  };

  document.querySelectorAll('.instagram-thumb').forEach(thumb => {
    const key = thumb.dataset.photo;
    const src = PHOTO_MAP[key];
    if (!src) return;
    thumb.style.backgroundImage = `url('${src}')`;
    thumb.style.backgroundSize  = 'cover';
    thumb.style.backgroundPosition = 'center';
  });
}

/**
 * Restaura el foco y el scroll al cerrar una rama.
 * Invocado por fishbone.js tras el colapso del panel.
 */
export function refreshScrollTriggers() {
  if (typeof window.ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}
