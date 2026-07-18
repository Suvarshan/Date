/* ── Auth ─────────────────────────────────────── */
function getToken() { return localStorage.getItem('adminToken'); }
function requireAuth() {
  if (!getToken()) { window.location.href = '/admin/login.html'; return false; }
  return true;
}
function doLogout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login.html';
}

async function apiFetch(url, opts = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) { doLogout(); throw new Error('Unauthorized'); }
  return res;
}

/* ── Tab switching ───────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'responses') loadResponses();
  if (tab === 'dates') loadSpecialDates();
}

/* ── Responses ───────────────────────────────── */
async function loadResponses() {
  if (!requireAuth()) return;
  const list = document.getElementById('response-list');
  list.innerHTML = '<div class="loading-state">Loading…</div>';
  try {
    const res = await apiFetch('/admin/responses');
    const data = await res.json();
    renderResponses(data);
  } catch (e) {
    list.innerHTML = `<div class="loading-state" style="color:#fb7185">Failed to load: ${e.message}</div>`;
  }
}

function renderResponses(items) {
  const list = document.getElementById('response-list');
  document.getElementById('stat-total').textContent = items.length;
  document.getElementById('stat-accepted').textContent = items.filter(i => i.accepted).length;
  document.getElementById('stat-declined').textContent = items.filter(i => !i.accepted).length;
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>No responses yet. Once someone completes the quiz, they'll show up here.</p></div>`;
    return;
  }
  list.innerHTML = items.map(item => `
    <article class="response-card">
      <div class="response-card-header">
        <div>
          <div class="response-name">${esc(item.name)}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-top:2px">${new Date(item.createdAt).toLocaleString()}</div>
        </div>
        <span class="response-badge ${item.accepted ? 'yes' : 'no'}">${item.accepted ? '✓ Accepted' : '✕ Declined'}</span>
      </div>
      <div class="response-grid">
        <div class="response-field"><strong>${esc(item.birthday)}</strong>Birthday</div>
        <div class="response-field"><strong>${esc(item.colour)}</strong>Colour</div>
        <div class="response-field"><strong>${esc(item.place)}</strong>Place</div>
        <div class="response-field"><strong>${esc(item.food)}</strong>Food</div>
        ${item.movie ? `<div class="response-field"><strong>${esc(item.movie)}</strong>Movie</div>` : ''}
        ${item.song ? `<div class="response-field"><strong>${esc(item.song)}</strong>Song</div>` : ''}
        ${item.memory ? `<div class="response-field" style="grid-column:1/-1"><strong>${esc(item.memory)}</strong>Memory</div>` : ''}
        ${item.date ? `<div class="response-field"><strong>${item.date}</strong>Proposed date</div>` : ''}
      </div>
    </article>
  `).join('');
}

/* ── Special Dates ───────────────────────────── */
async function loadSpecialDates() {
  if (!requireAuth()) return;
  const list = document.getElementById('dates-list');
  list.innerHTML = '<div class="loading-state">Loading…</div>';
  try {
    const res = await apiFetch('/admin/special-dates');
    const data = await res.json();
    renderDates(data);
  } catch (e) {
    list.innerHTML = `<div class="loading-state" style="color:#fb7185">Failed: ${e.message}</div>`;
  }
}

function renderDates(dates) {
  const list = document.getElementById('dates-list');
  if (!dates.length) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">🎂</span><p>No special dates yet. Add a date of birth above and attach images that will be revealed to that person.</p></div>';
    return;
  }
  list.innerHTML = dates.map(d => `
    <div class="date-card" id="date-card-${d.id}">
      <div class="date-card-header">
        <div>
          <div class="date-dob">🎂 ${esc(d.dob)}</div>
          ${d.label ? `<div class="date-label-text">${esc(d.label)}</div>` : ''}
        </div>
        <div class="date-card-actions">
          <button class="btn-upload" onclick="openUploadModal(${d.id}, '${esc(d.dob)}')">📷 Add Images</button>
          <button class="btn-delete-date" onclick="deleteDate(${d.id})">🗑 Delete</button>
        </div>
      </div>
      <div class="images-grid" id="images-${d.id}">
        ${renderImageThumbs(d.images, d.id)}
      </div>
    </div>
  `).join('');
}

function renderImageThumbs(images, dateId) {
  if (!images || !images.length) return '<span class="no-images">No images yet — click "Add Images" to upload.</span>';
  return images.map(img => `
    <div class="image-thumb" id="imgthumb-${img.id}">
      <img src="${esc(img.src || img.dataUrl || '')}" alt="${esc(img.originalName || img.filename || 'Special image')}" />
      <button class="delete-img-btn" onclick="deleteImage(${img.id}, ${dateId})" title="Remove">✕</button>
    </div>
  `).join('');
}

async function addSpecialDate() {
  const dob = document.getElementById('new-dob').value.trim();
  const label = document.getElementById('new-label').value.trim();
  const msgEl = document.getElementById('add-date-msg');
  if (!dob) return showMsg(msgEl, 'Please enter a date of birth.', 'err');
  try {
    const res = await apiFetch('/admin/special-dates', {
      method: 'POST',
      body: JSON.stringify({ dob, label }),
    });
    const data = await res.json();
    if (!res.ok) return showMsg(msgEl, data.error || 'Error', 'err');
    showMsg(msgEl, '✅ Date added!', 'ok');
    document.getElementById('new-dob').value = '';
    document.getElementById('new-label').value = '';
    loadSpecialDates();
  } catch (e) {
    showMsg(msgEl, e.message, 'err');
  }
}

async function deleteDate(id) {
  if (!confirm('Delete this date and all its images?')) return;
  try {
    await apiFetch(`/admin/special-dates/${id}`, { method: 'DELETE' });
    loadSpecialDates();
  } catch (e) { alert('Error: ' + e.message); }
}

async function deleteImage(imageId, dateId) {
  if (!confirm('Remove this image?')) return;
  try {
    await apiFetch(`/admin/special-dates/${dateId}/images/${imageId}`, { method: 'DELETE' });
    const thumb = document.getElementById(`imgthumb-${imageId}`);
    if (thumb) thumb.remove();
    const grid = document.getElementById(`images-${dateId}`);
    if (grid && !grid.querySelector('.image-thumb')) {
      grid.innerHTML = '<span class="no-images">No images yet — click "Add Images" to upload.</span>';
    }
  } catch (e) { alert('Error: ' + e.message); }
}

/* ── Upload modal ────────────────────────────── */
let currentUploadDateId = null;

function openUploadModal(dateId, dob) {
  currentUploadDateId = dateId;
  document.getElementById('modal-dob-label').textContent = dob;
  document.getElementById('upload-progress').innerHTML = '';
  document.getElementById('upload-msg').textContent = '';
  document.getElementById('upload-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('upload-modal').style.display = 'none';
  currentUploadDateId = null;
  loadSpecialDates();
}

async function handleFiles(files) {
  if (!files.length || !currentUploadDateId) return;
  const progress = document.getElementById('upload-progress');
  const msgEl = document.getElementById('upload-msg');
  progress.innerHTML = '';
  msgEl.textContent = '';

  for (const file of Array.from(files)) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.textContent = `⏳ Uploading ${file.name}…`;
    progress.appendChild(item);

    try {
      const base64 = await fileToBase64(file);
      const res = await apiFetch(`/admin/special-dates/${currentUploadDateId}/images`, {
        method: 'POST',
        body: JSON.stringify({ imageData: base64, originalName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      item.className = 'upload-item done';
      item.textContent = `✅ ${file.name} uploaded`;
    } catch (e) {
      item.className = 'upload-item err';
      item.textContent = `❌ ${file.name}: ${e.message}`;
    }
  }
  document.getElementById('file-input').value = '';
  showMsg(msgEl, 'All done! Close the modal to see updated images.', 'ok');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/* ── Helpers ─────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showMsg(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-msg ' + type;
}

/* ── Init ─────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.endsWith('admin.html')) return;
  if (!requireAuth()) return;
  loadResponses();
});
