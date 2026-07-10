/**
 * DATA/SPINE-BEATS.JS
 * La Memoria de una Ciudad
 *
 * Array de configuración de los 15 momentos del eje principal.
 * spine.js lo consume para crear ScrollTrigger instances
 * y gestionar el avance narrativo.
 *
 * Tipos:
 *   hero          — la primera pantalla
 *   image-sequence — contact sheet con fotografías
 *   prose         — texto narrativo puro
 *   branch-node   — activador de rama transmedia
 *   lock-gate     — nodo condicional (requiere archiveUnlocked)
 *   climax        — la foto de la niña
 *   quote         — la nota de Gabriel
 *   resolution    — el cierre
 */

export const SPINE_BEATS = [
  {
    id:           'hallazgo',
    type:         'hero',
    domSelector:  '#beat-hallazgo',
    branch:       null,
    lockCondition: null,
    scrollPin:    true,
    pinDuration:  '100%',
    revealType:   'image',
    revealDelay:  0.3,
  },
  {
    id:           'pista',
    type:         'prose',
    domSelector:  '#beat-pista',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
  },
  {
    id:           'rollo',
    type:         'image-sequence',
    domSelector:  '#beat-rollo',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'contact-sheet',
    revealDelay:  0.1,
  },
  {
    id:           'instagram',
    type:         'prose',
    domSelector:  '#beat-instagram',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
  },
  {
    id:           'ernesto',
    type:         'branch-node',
    domSelector:  '#beat-ernesto',
    branch:       'podcast',
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
    // Fragmento de código que se recoge al COMPLETAR esta rama
    codeFragment: 196,
  },
  {
    id:           'lucia',
    type:         'branch-node',
    domSelector:  '#beat-lucia',
    branch:       'mapa',
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
    codeFragment: 247,
  },
  {
    id:           'quispe',
    type:         'branch-node',
    domSelector:  '#beat-quispe',
    branch:       'video',
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
    // Confirmación cruzada del mismo fragmento que entrega Lucía,
    // no un tercer dígito independiente.
    codeFragment: 247,
  },
  {
    id:           'mecanismo',
    type:         'prose',
    domSelector:  '#beat-mecanismo',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0.2,
  },
  {
    id:           'codigo',
    type:         'lock-gate',
    domSelector:  '#beat-codigo',
    branch:       'archivo',
    // La condición se evalúa en tiempo real contra state
    lockCondition: (state) => state.get('archiveUnlocked'),
    scrollPin:    false,
    revealType:   'none',
    revealDelay:  0,
  },
  {
    id:           'gabriel',
    type:         'branch-node',
    domSelector:  '#beat-gabriel',
    branch:       'libreta',
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
  },
  {
    id:           'mapa-col',
    type:         'branch-node',
    domSelector:  '#beat-mapa-col',
    branch:       'map-col',
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
  },
  {
    id:           'brena',
    type:         'prose',
    domSelector:  '#beat-brena',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0.2,
  },
  {
    id:           'nina',
    type:         'climax',
    domSelector:  '#beat-nina',
    branch:       null,
    lockCondition: null,
    scrollPin:    true,
    pinDuration:  '80%',
    revealType:   'climax',
    revealDelay:  0.6,
  },
  {
    id:           'nota',
    type:         'quote',
    domSelector:  '#beat-nota',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0.4,
  },
  {
    id:           'cierre',
    type:         'resolution',
    domSelector:  '#beat-cierre',
    branch:       null,
    lockCondition: null,
    scrollPin:    false,
    revealType:   'text',
    revealDelay:  0,
  },
];

/** Mapa de id → beat para acceso O(1) desde spine.js */
export const BEATS_BY_ID = Object.fromEntries(
  SPINE_BEATS.map(beat => [beat.id, beat])
);
