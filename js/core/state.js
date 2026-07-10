/**
 * Estado global de la experiencia.
 *
 * Las revelaciones se registran como evidencias narrativas. Los desbloqueos
 * se calculan desde esas evidencias: ningún módulo puede forzarlos escribiendo
 * directamente un booleano derivado.
 */

const EVIDENCE_KEYS = Object.freeze([
  'ernesto196',
  'lucia247',
  'quispe247Confirmed',
]);

export class StateManager {
  #data = {
    spineProgress: 0,
    activeBranch: null,
    activeBeat: null,
    visitedBranches: new Set(),
    completedBranches: new Set(),
    evidence: {
      ernesto196: false,
      lucia247: false,
      quispe247Confirmed: false,
    },
    combinationEntered: false,
    compartmentOpened: false,
    secondRollReviewed: false,
    reducedMotion: false,
  };

  #listeners = new Map();

  get(key) {
    if (key === 'archiveUnlocked') {
      return EVIDENCE_KEYS.every(evidenceKey => this.#data.evidence[evidenceKey]);
    }

    if (key === 'lastPointUnlocked') {
      return this.#data.completedBranches.has('libreta');
    }

    if (key === 'lastMemoryUnlocked') {
      return this.#data.completedBranches.has('map-col');
    }

    if (key === 'climaxUnlocked') {
      return this.#data.secondRollReviewed;
    }

    return this.#data[key];
  }

  set(key, value) {
    if (key === 'archiveUnlocked' || key === 'lastPointUnlocked' ||
        key === 'lastMemoryUnlocked' || key === 'climaxUnlocked') {
      console.warn(`"${key}" es un estado derivado y no puede escribirse.`);
      return;
    }

    const previousDerived = this.#derivedSnapshot();
    const prev = this.#data[key];

    if (sameValue(prev, value)) return;

    this.#data[key] = value;
    this.#emit(key, value, prev);
    this.#emitDerivedChanges(previousDerived);
  }

  recordEvidence(key) {
    if (!EVIDENCE_KEYS.includes(key)) {
      console.warn(`Evidencia desconocida: "${key}".`);
      return;
    }

    if (this.#data.evidence[key]) return;
    this.set('evidence', { ...this.#data.evidence, [key]: true });
  }

  markVisited(branchId) {
    const branches = new Set(this.#data.visitedBranches);
    branches.add(branchId);
    this.set('visitedBranches', branches);
  }

  markCompleted(branchId) {
    const branches = new Set(this.#data.completedBranches);
    branches.add(branchId);
    this.set('completedBranches', branches);
  }

  on(keys, fn) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(key => {
      if (!this.#listeners.has(key)) this.#listeners.set(key, new Set());
      this.#listeners.get(key).add(fn);
    });
    return () => this.off(keys, fn);
  }

  off(keys, fn) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(key => this.#listeners.get(key)?.delete(fn));
  }

  #emit(key, value, prev) {
    this.#listeners.get(key)?.forEach(fn => {
      try {
        fn(value, prev);
      } catch (error) {
        console.error(`State listener error [${key}]:`, error);
      }
    });
  }

  #derivedSnapshot() {
    return {
      archiveUnlocked: this.get('archiveUnlocked'),
      lastPointUnlocked: this.get('lastPointUnlocked'),
      lastMemoryUnlocked: this.get('lastMemoryUnlocked'),
      climaxUnlocked: this.get('climaxUnlocked'),
    };
  }

  #emitDerivedChanges(previous) {
    Object.keys(previous).forEach(key => {
      const value = this.get(key);
      if (value !== previous[key]) this.#emit(key, value, previous[key]);
    });
  }

  snapshot() {
    return {
      ...this.#data,
      visitedBranches: new Set(this.#data.visitedBranches),
      completedBranches: new Set(this.#data.completedBranches),
      evidence: { ...this.#data.evidence },
      archiveUnlocked: this.get('archiveUnlocked'),
      lastPointUnlocked: this.get('lastPointUnlocked'),
      lastMemoryUnlocked: this.get('lastMemoryUnlocked'),
      climaxUnlocked: this.get('climaxUnlocked'),
    };
  }
}

function sameValue(a, b) {
  if (a === b) return true;
  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every(value => b.has(value));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }
  return false;
}

export const state = new StateManager();

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  state.set('reducedMotion', Boolean(mediaQuery?.matches));
  mediaQuery?.addEventListener?.('change', event => {
    state.set('reducedMotion', event.matches);
  });

  if (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1') {
    window.__LMDC_STATE__ = state;
  }
}
