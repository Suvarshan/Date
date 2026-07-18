/* ══════════════════════════════════════════
   State & helpers
═════════════════════════════════════════════════ */

const responseData = {
  name: '',
  birthday: '',
  colour: '',
  place: '',
  food: '',
  accepted: null,
  createdAt: ''
};

function goto(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('s' + n);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showFeedback(elId, msg, color) {
  const el = document.getElementById(elId);
  if (el) {
    el.textContent = msg;
    el.style.color = color || '#6b7280';
  }
}

const localStorageKey = 'DateProposalResponses';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DateProposalDB', 1);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('responses')) {
        db.createObjectStore('responses', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveResponseLocalStorage(data) {
  const saved = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
  saved.push(data);
  localStorage.setItem(localStorageKey, JSON.stringify(saved));
}

function saveResponse(data) {
  if (!window.indexedDB) {
    saveResponseLocalStorage(data);
    return Promise.resolve(null);
  }

  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('responses', 'readwrite');
      const store = transaction.objectStore('responses');
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }).catch(error => {
    console.warn('IndexedDB save failed, falling back to localStorage:', error);
    saveResponseLocalStorage(data);
    return null;
  });
}

function getSavedResponsesLocalStorage() {
  return JSON.parse(localStorage.getItem(localStorageKey) || '[]');
}

async function getSavedResponses() {
  if (!window.indexedDB) {
    return getSavedResponsesLocalStorage();
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('responses', 'readonly');
      const store = transaction.objectStore('responses');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Could not load saved responses from IndexedDB, using localStorage instead:', error);
    return getSavedResponsesLocalStorage();
  }
}

function handleName() {
  const nameInput = document.getElementById('name-input');
  const value = nameInput.value.trim();
  if (!value) {
    showFeedback('name-feedback', 'Please enter your name 😊', '#e9618a');
    return;
  }
  responseData.name = value;
  showFeedback('name-feedback', 'Nice to meet you, ' + value + '!', '#22c55e');
  setTimeout(() => goto(2), 700);
}

function handleBirthday() {
  const birthdayInput = document.getElementById('birthday-input');
  const value = birthdayInput.value.trim();
  if (!value) {
    showFeedback('birthday-feedback', 'Please share your birth date 😊', '#e9618a');
    return;
  }
  responseData.birthday = value;
  showFeedback('birthday-feedback', 'Perfect, thank you!', '#22c55e');
  setTimeout(() => goto(3), 700);
}

function buildOptions(containerId, items) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    btn.onclick = () => item.handler(btn);
    wrap.appendChild(btn);
  });
}

function chooseColour(btn, colour) {
  responseData.colour = colour;
  document.querySelectorAll('#color-options button').forEach(b => b.classList.remove('correct'));
  btn.classList.add('correct');
  showFeedback('color-feedback', `Great choice — ${colour} is lovely!`, '#22c55e');
  setTimeout(() => goto(4), 700);
}

function choosePlace(btn, place) {
  responseData.place = place;
  document.querySelectorAll('#place-options button').forEach(b => b.classList.remove('correct'));
  btn.classList.add('correct');
  showFeedback('place-feedback', `That sounds wonderful — ${place}!`, '#22c55e');
  setTimeout(() => goto(5), 700);
}

function chooseFood(btn, food) {
  responseData.food = food;
  document.querySelectorAll('#food-options button').forEach(b => b.classList.remove('correct'));
  btn.classList.add('correct');
  showFeedback('food-feedback', `Yum! ${food} is a great choice.`, '#22c55e');
  setTimeout(() => {
    updateSummary();
    goto(6);
  }, 700);
}

function initColourOptions() {
  const colours = [
    { icon: '❤️', label: 'Red' },
    { icon: '💙', label: 'Blue' },
    { icon: '💚', label: 'Green' },
    { icon: '💜', label: 'Violet' },
    { icon: '🧡', label: 'Orange' },
    { icon: '🤍', label: 'White' },
    { icon: '🖤', label: 'Black' },
  ];
  buildOptions('color-options', colours.map(c => ({
    icon: c.icon,
    label: c.label,
    handler: (btn) => chooseColour(btn, c.label),
  })));
}

function initPlaceOptions() {
  const places = [
    { icon: '🏖️', label: 'Beach' },
    { icon: '🌲', label: 'Mountains' },
    { icon: '🌆', label: 'City' },
    { icon: '☕', label: 'Cafe' },
    { icon: '🎡', label: 'Amusement park' },
    { icon: '🌌', label: 'Starry night picnic' },
  ];
  buildOptions('place-options', places.map(p => ({
    icon: p.icon,
    label: p.label,
    handler: (btn) => choosePlace(btn, p.label),
  })));
}

function initFoodOptions() {
  const foods = [
    { icon: '🍕', label: 'Pizza' },
    { icon: '🍛', label: 'Biryani' },
    { icon: '🍝', label: 'Pasta' },
    { icon: '🍰', label: 'Dessert treats' },
    { icon: '🍦', label: 'Ice Cream' },
    { icon: '🍜', label: 'Comfort noodles' },
  ];
  buildOptions('food-options', foods.map(f => ({
    icon: f.icon,
    label: f.label,
    handler: (btn) => chooseFood(btn, f.label),
  })));
}

function setDateInputMin() {
  const dateInput = document.getElementById('date-input');
  if (!dateInput) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

function updateSummary() {
  const summaryText = document.getElementById('summary-text');
  summaryText.textContent = `Hi ${responseData.name}! You were born on ${responseData.birthday}, you love ${responseData.colour}, would love to visit ${responseData.place}, and want to enjoy ${responseData.food} together. Would you like to go on a date?`;
}

function handleDateChange() {
  const dateInput = document.getElementById('date-input');
  const confirmBtn = document.getElementById('confirm-btn');
  if (!dateInput || !confirmBtn) return;
  responseData.date = dateInput.value;
  if (responseData.date) {
    confirmBtn.disabled = false;
    showFeedback('date-feedback', 'Great! Picked a date from today onward.', '#22c55e');
  } else {
    confirmBtn.disabled = true;
    showFeedback('date-feedback', '', '');
  }
}

async function handleProposal(accepted) {
  const dateInput = document.getElementById('date-input');
  if (accepted && dateInput) {
    responseData.date = dateInput.value;
  }

  if (accepted && !responseData.date) {
    showFeedback('date-feedback', 'Please choose a date from today onward before confirming.', '#e9618a');
    return;
  }

  responseData.accepted = accepted;
  responseData.createdAt = new Date().toISOString();
  const statusEl = document.getElementById('save-status');
  try {
    await saveResponse({
      name: responseData.name,
      birthday: responseData.birthday,
      colour: responseData.colour,
      place: responseData.place,
      food: responseData.food,
      date: responseData.date,
      accepted,
      createdAt: responseData.createdAt,
    });
    statusEl.textContent = '✅ Saved locally in the browser database.';
  } catch (error) {
    statusEl.textContent = '⚠️ Could not save locally. Please refresh and try again.';
    console.error(error);
  }

  try {
    await sendResponseToServer({
      name: responseData.name,
      birthday: responseData.birthday,
      colour: responseData.colour,
      place: responseData.place,
      food: responseData.food,
      date: responseData.date,
      accepted,
      createdAt: responseData.createdAt,
    });
    statusEl.textContent = '✅ Saved locally and sent to the server.';
  } catch (error) {
    statusEl.textContent = '⚠️ Saved locally, but could not send to server.';
    console.error('Server save error:', error);
  }

  if (accepted) {
    showConfetti();
    goto(7);
  } else {
    goto(8);
  }
}

function sendResponseToServer(data) {
  return fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || 'Server error');
      });
    }
    return response.json();
  });
}

window.getSavedResponses = getSavedResponses;

function showConfetti() {
  const colors = ['#e9618a', '#facc15', '#7c3aed', '#22c55e', '#38bdf8', '#fb7185'];
  for (let i = 0; i < 30; i += 1) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-bit';
    confetti.style.background = colors[i % colors.length];
    confetti.style.left = `${Math.random() * 90 + 5}%`;
    confetti.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    confetti.style.opacity = '0.95';
    document.body.appendChild(confetti);
    confetti.addEventListener('animationend', () => confetti.remove());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initColourOptions();
  initPlaceOptions();
  initFoodOptions();
  setDateInputMin();
  const dateInput = document.getElementById('date-input');
  if (dateInput) {
    dateInput.addEventListener('change', handleDateChange);
  }
  document.getElementById('name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleName();
  });
  document.getElementById('birthday-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleBirthday();
  });
});
