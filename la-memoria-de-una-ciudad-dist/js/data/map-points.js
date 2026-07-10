/**
 * DATA/MAP-POINTS.JS
 * La Memoria de una Ciudad
 *
 * Los puntos documentados por Gabriel Medina en su mapa del Centro.
 * Coordenadas normalizadas (0–1) sobre el SVG base del mapa.
 * Consumido por mapa.js y map-col.js.
 */

export const MAP_POINTS = [
  {
    id:           'ernesto-huanca',
    svgCoords:    { x: 0.42, y: 0.31 },
    address:      'Centro Histórico de Lima',
    person:       'Don Ernesto Huanca',
    occupation:   null,
    caption:      'Reconocido en la primera fotografía. El primer rostro identificado.',
    photo:        'assets/images/contact-sheet/ernesto-anverso.jpg',
    revealOrder:  1,
    threatened:   true,
    linkedBranch: 'podcast',
  },
  {
    id:           'lucia-mural',
    svgCoords:    { x: 0.58, y: 0.44 },
    address:      'Centro Histórico de Lima',
    person:       'Lucía Fernández',
    occupation:   'Artista urbana',
    caption:      'El mural que pintó en un proyecto de arte comunitario.',
    photo:        'assets/images/contact-sheet/lucia-anverso.jpg',
    revealOrder:  2,
    threatened:   true,
    linkedBranch: 'mapa',
  },
  {
    id:           'quispe-vivienda',
    svgCoords:    { x: 0.51, y: 0.58 },
    address:      'Centro Histórico de Lima',
    person:       'Familia Quispe',
    occupation:   'Vivienda familiar',
    caption:      'La casa donde crecieron varias generaciones de la familia.',
    photo:        'assets/images/contact-sheet/quispe-anverso.jpg',
    revealOrder:  3,
    threatened:   true,
    linkedBranch: 'video',
  },
  {
    id:           'ultima-memoria',
    svgCoords:    { x: 0.29, y: 0.67 },
    address:      null,   // Deliberadamente vacío en la libreta
    person:       null,   // Sin nombre asignado
    occupation:   null,
    caption:      null,
    photo:        null,
    revealOrder:  6,
    threatened:   false,
    linkedBranch: null,
    isEndPoint:   true,   // El punto que activa el desenlace
  },
];

/** Mapa de id → punto para acceso O(1) */
export const POINTS_BY_ID = Object.fromEntries(
  MAP_POINTS.map(p => [p.id, p])
);
