/**
 * DATA/TRANSCRIPT.JS
 * La Memoria de una Ciudad
 *
 * Transcripción sincronizada de la conversación con Don Ernesto Huanca,
 * registrada durante la investigación. podcast.js activa
 * cada línea según el tiempo de reproducción del audio.
 *
 * Propiedades:
 *   startTime    — segundos desde el inicio del audio
 *   endTime      — fin de la línea
 *   speaker      — identidad del hablante
 *   text         — texto de la transcripción
 *   encounter    — encuentro al que pertenece el fragmento
 *   marginNote   — nota de escucha de Valeria (null si no aplica)
 *   isKeyMoment  — true en el momento en que aparece la copia con el 196
 */

export const TRANSCRIPT = [
  {
    startTime:       0,
    endTime:         6.2,
    encounter:       1,
    speaker:         'ernesto',
    text:            'Sí, soy yo. Hace años de esto. Ni sabía que existía esta foto.',
    marginNote:      null,
    isKeyMoment:     false,
  },
  {
    startTime:       6.2,
    endTime:         15.5,
    encounter:       1,
    speaker:         'ernesto',
    text:            'No recuerdo haberle entregado ninguna cámara a nadie. Pero sí conocí a alguien que andaba por aquí con un equipo antiguo.',
    marginNote:      null,
    isKeyMoment:     false,
  },
  {
    startTime:       15.5,
    endTime:         24.0,
    encounter:       1,
    speaker:         'ernesto',
    text:            'Gabriel Medina. No buscaba edificios famosos. Le interesaba lo que estaba a punto de desaparecer.',
    marginNote: {
      text: 'Por primera vez, la cámara tiene un nombre detrás.',
    },
    isKeyMoment:     false,
  },
  {
    startTime:       24.0,
    endTime:         32.8,
    encounter:       2,
    speaker:         'ernesto',
    text:            'A veces volvía meses después. Decía que una imagen sin la historia de quien aparece en ella estaba incompleta.',
    marginNote:      null,
    isKeyMoment:     false,
  },
  {
    startTime:       32.8,
    endTime:         45.6,
    encounter:       2,
    speaker:         'ernesto',
    text:            'Busqué entre mis cosas y encontré esta copia. Es la misma fotografía, pero mire el reverso: tiene un número que en la suya no aparece.',
    marginNote: {
      text: 'Una segunda copia de la misma imagen, con una anotación distinta.',
    },
    isKeyMoment:     true,
  },
  {
    startTime:       45.6,
    endTime:         55.0,
    encounter:       2,
    speaker:         'ernesto',
    text:            'No sé qué significa. La guardé con otros papeles de esa época, sin pensar que alguien volvería a preguntar por ella.',
    marginNote:      null,
    isKeyMoment:     false,
  },
  {
    startTime:       55.0,
    endTime:         65.0,
    encounter:       2,
    speaker:         'ernesto',
    text:            'Gabriel conoció a mucha gente por estas calles. Si quiere entender lo que estaba haciendo, tendría que escuchar también a los demás.',
    marginNote:      null,
    isKeyMoment:     false,
  },
];

/** Duración total de la grabación en segundos */
export const TOTAL_DURATION = 65.0;

/** Formato de tiempo MM:SS para el display del reproductor */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
