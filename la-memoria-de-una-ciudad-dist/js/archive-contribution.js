/**
 * ARCHIVE-CONTRIBUTION.JS
 * Aporte final del archivo vivo.
 *
 * GitHub Pages es estático: no recibe archivos ni escribe en un servidor.
 * Por eso este módulo hace lo honesto para la versión publicada:
 * guarda un borrador local, permite previsualizar un archivo y exporta el
 * aporte como JSON para una futura bandeja real de recepción.
 */

const STORAGE_KEY = 'lmdc.archiveContributions.v1';
const EMBED_LIMIT_BYTES = 2 * 1024 * 1024;

let currentFile = null;
let currentPreviewUrl = null;
let latestContribution = null;

export function initArchiveContribution() {
  const openBtn = document.querySelector('.resolution-cta__btn[aria-label*="Agregar"]');
  const form = document.querySelector('[data-contribution-form]');
  if (!openBtn || !form) return;

  const fileInput = form.querySelector('input[type="file"]');
  const exportBtn = form.querySelector('[data-export-contribution]');
  const statusEl = form.querySelector('[data-contribution-status]');

  restoreLatestContribution(form, exportBtn, statusEl);

  openBtn.addEventListener('click', () => {
    const isOpening = form.hidden;
    form.hidden = !isOpening;
    openBtn.setAttribute('aria-expanded', String(isOpening));
    openBtn.textContent = isOpening ? 'Cerrar aporte' : 'Agregar al archivo';

    if (isOpening) {
      form.querySelector('input, textarea, button')?.focus();
    }
  });

  fileInput?.addEventListener('change', () => {
    currentFile = fileInput.files?.[0] ?? null;
    updateFilePreview(form, currentFile);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const contribution = await buildContribution(form, currentFile);
    latestContribution = contribution;
    saveContribution(contribution);

    if (exportBtn) exportBtn.disabled = false;
    if (statusEl) {
      statusEl.textContent = contribution.attachment?.embedded
        ? 'Borrador guardado. El archivo seleccionado quedó incluido en la descarga.'
        : 'Borrador guardado. Si el archivo era pesado, la descarga conserva sus datos y no copia el archivo completo.';
      statusEl.focus?.();
    }
  });

  exportBtn?.addEventListener('click', () => {
    if (!latestContribution) return;
    downloadContribution(latestContribution);
  });
}

function restoreLatestContribution(form, exportBtn, statusEl) {
  const contributions = readContributions();
  latestContribution = contributions.at(-1) ?? null;

  if (!latestContribution) return;

  if (exportBtn) exportBtn.disabled = false;
  if (statusEl) {
    statusEl.textContent = 'Hay un borrador guardado en este navegador.';
  }

  const author = form.elements.namedItem('author');
  const place = form.elements.namedItem('place');
  const memory = form.elements.namedItem('memory');

  if (author && 'value' in author) author.value = latestContribution.author ?? '';
  if (place && 'value' in place) place.value = latestContribution.place ?? '';
  if (memory && 'value' in memory) memory.value = latestContribution.memory ?? '';
}

async function buildContribution(form, file) {
  const data = new FormData(form);
  const attachment = await serializeAttachment(file);

  return {
    project: 'La Memoria de una Ciudad',
    createdAt: new Date().toISOString(),
    author: cleanText(data.get('author')),
    place: cleanText(data.get('place')),
    memory: cleanText(data.get('memory')),
    attachment,
    note: 'Borrador generado desde la versión estática del documental web.',
  };
}

async function serializeAttachment(file) {
  if (!file) return null;

  const base = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    embedded: false,
  };

  if (file.size > EMBED_LIMIT_BYTES) {
    return base;
  }

  return {
    ...base,
    embedded: true,
    dataUrl: await readFileAsDataURL(file),
  };
}

function updateFilePreview(form, file) {
  const preview = form.querySelector('[data-file-preview]');
  const media = form.querySelector('[data-file-preview-media]');
  const caption = form.querySelector('[data-file-preview-caption]');
  if (!preview || !media || !caption) return;

  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  media.textContent = '';

  if (!file) {
    preview.hidden = true;
    caption.textContent = '';
    return;
  }

  const size = formatBytes(file.size);
  caption.textContent = `${file.name} · ${file.type || 'archivo'} · ${size}`;
  preview.hidden = false;

  if (file.type.startsWith('image/')) {
    currentPreviewUrl = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = currentPreviewUrl;
    image.alt = 'Previsualización del archivo seleccionado';
    media.appendChild(image);
    return;
  }

  const placeholder = document.createElement('p');
  placeholder.textContent = 'Archivo seleccionado para el borrador.';
  media.appendChild(placeholder);
}

function saveContribution(contribution) {
  const contributions = readContributions();
  contributions.push(contribution);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contributions.slice(-10)));
}

function readContributions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function downloadContribution(contribution) {
  const blob = new Blob([JSON.stringify(contribution, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date(contribution.createdAt).toISOString().slice(0, 10);

  link.href = url;
  link.download = `aporte-la-memoria-de-una-ciudad-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function cleanText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
