/**
 * MEMORY-ARCHIVE.JS
 * Cierre participativo del documental.
 *
 * La versión estática no simula un envío a un servidor: cada memoria se
 * conserva en el navegador, aparece como un punto del mapa local y puede
 * guardarse como una ficha PNG legible y compartible.
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'lmdc.memoryArchive.v2';
  const MAX_MEMORIES = 8;
  const IMAGE_LIMIT_BYTES = 12 * 1024 * 1024;

  let form;
  let openButton;
  let statusElement;
  let currentFile = null;
  let currentObjectUrl = null;
  let latestContribution = null;
  let memories = [];

  function init() {
    form = document.querySelector('[data-memory-form]');
    openButton = document.querySelector('[data-memory-open]');
    statusElement = document.querySelector('[data-memory-status]');

    if (!form || !openButton) return;

    memories = readMemories();
    latestContribution = memories.at(-1) || null;

    bindEvents();
    setTodayInPreview();
    updateCounter();
    updateLivePreview();
    renderMap();
  }

  function bindEvents() {
    openButton.addEventListener('click', toggleForm);

    form.addEventListener('input', event => {
      if (event.target?.name === 'memory') updateCounter();
      updateLivePreview();
    });

    form.addEventListener('change', event => {
      if (event.target?.name === 'attachment') {
        currentFile = event.target.files?.[0] || null;
        updateAttachmentPreview(currentFile);
      }
      updateLivePreview();
    });

    form.addEventListener('submit', saveMemoryToMap);

    form.querySelector('[data-download-memory-card]')?.addEventListener('click', async () => {
      if (!validateRequiredFields()) return;
      const contribution = await buildContribution({ persistAttachment: true });
      await downloadMemoryCard(contribution);
      announce('La ficha se guardó como imagen PNG.');
    });

    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        currentFile = null;
        revokePreviewUrl();
        updateAttachmentPreview(null);
        updateCounter();
        updateLivePreview();
        announce('El formulario quedó limpio.');
      }, 0);
    });

    document.querySelector('[data-memory-map-canvas]')?.addEventListener('click', event => {
      const pin = event.target.closest('[data-memory-pin]');
      if (pin) focusMemory(pin.dataset.memoryPin);
    });

    document.querySelector('[data-memory-list]')?.addEventListener('click', async event => {
      const button = event.target.closest('button[data-memory-action]');
      if (!button) return;

      const id = button.dataset.memoryId;
      const contribution = memories.find(item => item.id === id);
      if (!contribution) return;

      if (button.dataset.memoryAction === 'locate') {
        focusMemory(id, true);
      }

      if (button.dataset.memoryAction === 'download') {
        await downloadMemoryCard(contribution);
        announce(`Ficha de ${contribution.place} guardada como PNG.`);
      }

      if (button.dataset.memoryAction === 'delete') {
        const accepted = window.confirm(`¿Eliminar de este dispositivo la memoria de “${contribution.place}”?`);
        if (!accepted) return;
        memories = memories.filter(item => item.id !== id);
        writeMemories();
        latestContribution = memories.at(-1) || null;
        renderMap();
        announce('La memoria se eliminó de este dispositivo.');
      }
    });
  }

  function toggleForm() {
    const isOpening = form.hidden;
    form.hidden = !isOpening;
    openButton.setAttribute('aria-expanded', String(isOpening));
    openButton.textContent = isOpening ? 'Cerrar ficha' : 'Marcar un lugar';

    if (isOpening) {
      form.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
      form.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  async function saveMemoryToMap(event) {
    event.preventDefault();
    if (!validateRequiredFields()) return;

    const contribution = await buildContribution({ persistAttachment: true });
    memories = [...memories, contribution].slice(-MAX_MEMORIES);
    latestContribution = contribution;
    writeMemories();
    renderMap(contribution.id);

    announce('Tu recuerdo ahora ocupa un lugar en el mapa de este dispositivo.');

    document.querySelector('[data-memory-map-canvas]')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
  }

  function validateRequiredFields() {
    if (form.reportValidity()) return true;
    announce('Completa el lugar y escribe un recuerdo de al menos 20 caracteres.');
    return false;
  }

  async function buildContribution({ persistAttachment }) {
    const data = new FormData(form);
    const visibility = cleanText(data.get('visibility')) || 'named';
    const author = cleanText(data.get('author'));
    const attachment = await serializeAttachment(currentFile, persistAttachment);

    return {
      id: createId(),
      createdAt: new Date().toISOString(),
      place: cleanText(data.get('place')),
      memoryType: cleanText(data.get('memoryType')) || 'lugar',
      memory: cleanTextPreservingParagraphs(data.get('memory')),
      visibility,
      author: visibility === 'named' ? author : '',
      displayAuthor: getDisplayAuthor(visibility, author),
      attachment,
    };
  }

  async function serializeAttachment(file, includeImage) {
    if (!file) return null;

    const base = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file',
    };

    if (!includeImage || base.kind !== 'image' || file.size > IMAGE_LIMIT_BYTES) {
      return base;
    }

    try {
      return { ...base, dataUrl: await compressImageForStorage(file) };
    } catch {
      return base;
    }
  }

  function updateCounter() {
    const textarea = form.elements.namedItem('memory');
    const counter = form.querySelector('[data-memory-counter]');
    if (!textarea || !counter) return;
    counter.textContent = `${textarea.value.length} / 500`;
  }

  function updateLivePreview() {
    const data = new FormData(form);
    const place = cleanText(data.get('place')) || 'Un lugar de Lima';
    const type = cleanText(data.get('memoryType')) || 'lugar';
    const memory = cleanTextPreservingParagraphs(data.get('memory')) || 'Tu recuerdo aparecerá aquí mientras escribes.';
    const visibility = cleanText(data.get('visibility')) || 'named';
    const author = cleanText(data.get('author'));

    setText('[data-memory-preview-place]', place);
    setText('[data-memory-preview-type]', capitalize(type));
    setText('[data-memory-preview-text]', memory);
    setText('[data-memory-preview-author]', getDisplayAuthor(visibility, author));
  }

  function updateAttachmentPreview(file) {
    const media = form.querySelector('[data-memory-preview-media]');
    if (!media) return;

    revokePreviewUrl();
    media.replaceChildren();
    media.classList.remove('has-image', 'has-audio');

    if (!file) {
      const label = document.createElement('span');
      label.textContent = 'Sin imagen';
      media.appendChild(label);
      return;
    }

    if (file.type.startsWith('image/')) {
      currentObjectUrl = URL.createObjectURL(file);
      const image = document.createElement('img');
      image.src = currentObjectUrl;
      image.alt = 'Vista previa de la fotografía elegida para la ficha';
      media.classList.add('has-image');
      media.appendChild(image);
      return;
    }

    if (file.type.startsWith('audio/')) {
      media.classList.add('has-audio');
      const waveform = document.createElement('div');
      waveform.className = 'memory-card-preview__waveform';
      waveform.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 22; index += 1) {
        const bar = document.createElement('span');
        bar.style.setProperty('--bar', String(22 + ((index * 17) % 56)));
        waveform.appendChild(bar);
      }
      const label = document.createElement('span');
      label.textContent = file.name;
      media.append(waveform, label);
      return;
    }

    const label = document.createElement('span');
    label.textContent = file.name;
    media.appendChild(label);
  }

  function renderMap(newMemoryId = null) {
    const canvas = document.querySelector('[data-memory-map-canvas]');
    const list = document.querySelector('[data-memory-list]');
    const empty = document.querySelector('[data-memory-map-empty]');
    const count = document.querySelector('[data-memory-map-count]');
    if (!canvas || !list || !count) return;

    canvas.querySelectorAll('[data-memory-pin]').forEach(pin => pin.remove());
    list.replaceChildren();

    empty.hidden = memories.length > 0;
    count.textContent = memories.length === 0
      ? 'Ninguna memoria añadida todavía.'
      : memories.length === 1
        ? '1 memoria guardada en este navegador.'
        : `${memories.length} memorias guardadas en este navegador.`;

    memories.forEach((memory, index) => {
      const coords = getPinCoordinates(memory, index);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'memory-map__pin';
      pin.dataset.memoryPin = memory.id;
      pin.style.setProperty('--pin-x', `${coords.x}%`);
      pin.style.setProperty('--pin-y', `${coords.y}%`);
      pin.setAttribute('aria-label', `Ver la memoria de ${memory.place}`);
      pin.innerHTML = `<span aria-hidden="true"></span><small>${escapeHtml(memory.place)}</small>`;
      if (memory.id === newMemoryId) pin.classList.add('is-new');
      canvas.appendChild(pin);

      const card = document.createElement('article');
      card.className = 'memory-map__entry';
      card.dataset.memoryEntry = memory.id;
      card.innerHTML = `
        <div class="memory-map__entry-heading">
          <div>
            <p class="archive-label">${escapeHtml(capitalize(memory.memoryType))}</p>
            <h5>${escapeHtml(memory.place)}</h5>
          </div>
          <span class="memory-map__privacy">${escapeHtml(privacyLabel(memory.visibility))}</span>
        </div>
        <p>${escapeHtml(memory.memory)}</p>
        <footer>
          <span>${escapeHtml(memory.displayAuthor || getDisplayAuthor(memory.visibility, memory.author))}</span>
          <time datetime="${escapeHtml(memory.createdAt)}">${escapeHtml(formatDate(memory.createdAt))}</time>
        </footer>
        <div class="memory-map__entry-actions">
          <button type="button" data-memory-action="locate" data-memory-id="${escapeHtml(memory.id)}">Ver punto</button>
          <button type="button" data-memory-action="download" data-memory-id="${escapeHtml(memory.id)}">Guardar PNG</button>
          <button type="button" data-memory-action="delete" data-memory-id="${escapeHtml(memory.id)}">Eliminar</button>
        </div>
      `;
      list.appendChild(card);
    });

    if (newMemoryId) {
      window.requestAnimationFrame(() => focusMemory(newMemoryId));
    }
  }

  function focusMemory(id, scrollToEntry = false) {
    const pins = document.querySelectorAll('[data-memory-pin]');
    const entries = document.querySelectorAll('[data-memory-entry]');
    pins.forEach(pin => pin.classList.toggle('is-active', pin.dataset.memoryPin === id));
    entries.forEach(entry => entry.classList.toggle('is-active', entry.dataset.memoryEntry === id));

    const entry = document.querySelector(`[data-memory-entry="${cssEscape(id)}"]`);
    const pin = document.querySelector(`[data-memory-pin="${cssEscape(id)}"]`);

    if (scrollToEntry) {
      entry?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    } else {
      pin?.focus({ preventScroll: true });
    }
  }

  async function downloadMemoryCard(contribution) {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPaper(ctx, canvas.width, canvas.height);

    ctx.fillStyle = '#183f43';
    ctx.fillRect(0, 0, canvas.width, 24);

    ctx.fillStyle = '#26312f';
    ctx.font = '600 30px Arial, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('LA MEMORIA DE UNA CIUDAD', 110, 120);

    ctx.fillStyle = '#6d5a3e';
    ctx.font = '600 24px Arial, sans-serif';
    ctx.fillText(capitalize(contribution.memoryType).toUpperCase(), 110, 190);

    ctx.fillStyle = '#26231f';
    ctx.font = '700 70px Georgia, serif';
    const titleBottom = drawWrappedText(ctx, contribution.place, 110, 285, 1180, 84, 3);

    let contentY = Math.max(520, titleBottom + 70);
    if (contribution.attachment?.kind === 'image' && contribution.attachment.dataUrl) {
      try {
        const image = await loadImage(contribution.attachment.dataUrl);
        contentY = drawContainedImage(ctx, image, 110, contentY, 1180, 500) + 70;
      } catch {
        contentY += 20;
      }
    } else {
      drawArchivePlaceholder(ctx, 110, contentY, 1180, 250, contribution.attachment);
      contentY += 320;
    }

    ctx.fillStyle = '#33302b';
    ctx.font = '38px Georgia, serif';
    const memoryBottom = drawWrappedText(ctx, contribution.memory, 110, contentY, 1180, 60, 10);

    const footerY = Math.max(1540, memoryBottom + 100);
    ctx.strokeStyle = '#8c806e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, footerY);
    ctx.lineTo(1290, footerY);
    ctx.stroke();

    ctx.fillStyle = '#26312f';
    ctx.font = '600 28px Arial, sans-serif';
    ctx.fillText(contribution.displayAuthor || getDisplayAuthor(contribution.visibility, contribution.author), 110, footerY + 75);

    ctx.fillStyle = '#6d675f';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText(`${privacyLabel(contribution.visibility)} · ${formatDate(contribution.createdAt)}`, 110, footerY + 125);

    ctx.fillStyle = '#183f43';
    ctx.font = '600 22px Arial, sans-serif';
    ctx.fillText('FICHA DE MEMORIA · LIMA', 110, 1725);

    const blob = await canvasToBlob(canvas);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memoria-${slugify(contribution.place) || 'lima'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function drawPaper(ctx, width, height) {
    ctx.fillStyle = '#f1eadb';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(63, 74, 69, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 70; x < width; x += 94) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 65; y < height; y += 94) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let index = 0; index < 450; index += 1) {
      const x = (index * 73) % width;
      const y = (index * 149) % height;
      ctx.fillStyle = index % 3 === 0 ? 'rgba(92, 74, 51, 0.035)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y, 2, 2);
    }
  }

  function drawArchivePlaceholder(ctx, x, y, width, height, attachment) {
    ctx.fillStyle = '#e3dbc9';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#aaa08f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#6e685f';
    ctx.font = '26px Arial, sans-serif';
    const label = attachment?.kind === 'audio'
      ? `REGISTRO SONORO · ${attachment.name}`
      : 'SIN IMAGEN ADJUNTA';
    drawWrappedText(ctx, label, x + 45, y + 100, width - 90, 38, 3);
  }

  function drawContainedImage(ctx, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.fillStyle = '#ddd4c3';
    ctx.fillRect(x, y, width, height);
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.strokeStyle = '#8c806e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    return y + height;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';

    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      let last = visible[maxLines - 1] || '';
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
        last = last.slice(0, -1);
      }
      visible[maxLines - 1] = `${last.trim()}…`;
    }

    visible.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
    return y + Math.max(0, visible.length - 1) * lineHeight;
  }

  function getPinCoordinates(memory, index) {
    const hash = hashString(`${memory.place}-${memory.id}`);
    const x = 12 + (hash % 75);
    const y = 14 + ((Math.floor(hash / 97) + index * 13) % 68);
    return { x, y };
  }

  function readMemories() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-MAX_MEMORIES) : [];
    } catch {
      return [];
    }
  }

  function writeMemories() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories.slice(-MAX_MEMORIES)));
    } catch {
      announce('No se pudo guardar la ficha: el almacenamiento del navegador está lleno.');
    }
  }

  function announce(message) {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.focus({ preventScroll: true });
  }

  function setTodayInPreview() {
    const date = document.querySelector('[data-memory-preview-date]');
    if (date) {
      const now = new Date();
      date.dateTime = now.toISOString();
      date.textContent = formatDate(now.toISOString());
    }
  }

  function getDisplayAuthor(visibility, author) {
    if (visibility === 'anonymous') return 'Aporte anónimo';
    if (visibility === 'personal') return 'Ficha personal';
    return author || 'Nombre no indicado';
  }

  function privacyLabel(visibility) {
    if (visibility === 'anonymous') return 'Anónima';
    if (visibility === 'personal') return 'Solo personal';
    return 'Con nombre';
  }

  function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function cleanTextPreservingParagraphs(value) {
    return String(value || '')
      .trim()
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function capitalize(value) {
    const text = String(value || '');
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
  }

  function createId() {
    return `memory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(value));
    } catch {
      return '';
    }
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 56);
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  async function compressImageForStorage(file) {
    const source = URL.createObjectURL(file);
    try {
      const image = await loadImage(source);
      const maxSide = 960;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return await readFileAsDataURL(file);
      ctx.fillStyle = '#eee6d8';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.78);
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)), { once: true });
      reader.addEventListener('error', () => reject(reader.error), { once: true });
      reader.readAsDataURL(file);
    });
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image), { once: true });
      image.addEventListener('error', reject, { once: true });
      image.src = source;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.94));
  }

  function revokePreviewUrl() {
    if (!currentObjectUrl) return;
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
