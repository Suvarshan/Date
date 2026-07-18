const { useState, useEffect, useRef } = React;

// ── Quiz steps definition ─────────────────────────────────────────
const STEPS = {
  INTRO: 0,
  NAME: 1,
  BIRTHDAY: 2,
  COLOUR: 3,
  PLACE: 4,
  FOOD: 5,
  MOVIE: 6,
  SONG: 7,
  MEMORY: 8,
  PROPOSAL: 9,
  IMAGES: 10,
  SUCCESS: 11,
  DECLINED: 12,
};

const TOTAL_QUESTIONS = 7;

function getProgress(step) {
  if (step <= 1) return 0;
  if (step >= 9) return 100;
  return Math.round(((step - 1) / TOTAL_QUESTIONS) * 100);
}

function getQuestionNum(step) {
  if (step >= 2 && step <= 8) return step - 1;
  return null;
}

// ── Confetti ──────────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#e9618a', '#facc15', '#7c3aed', '#22c55e', '#38bdf8', '#fb7185', '#f97316'];
  for (let i = 0; i < 60; i++) {
    const bit = document.createElement('div');
    bit.className = 'confetti-bit';
    const isRect = Math.random() > 0.5;
    bit.style.cssText = `
      background:${colors[i % colors.length]};
      left:${Math.random() * 95 + 2}%;
      top:-10px;
      width:${isRect ? '10px' : '8px'};
      height:${isRect ? '6px' : '8px'};
      border-radius:${isRect ? '2px' : '50%'};
      animation-duration:${2.2 + Math.random() * 1.8}s;
      animation-delay:${Math.random() * 0.5}s;
    `;
    document.body.appendChild(bit);
    bit.addEventListener('animationend', () => bit.remove());
  }
}

// ── Floating hearts ───────────────────────────────────────────────
function spawnHeart() {
  const hearts = ['💖', '💗', '💝', '✨', '🌸', '💫'];
  const el = document.createElement('div');
  el.className = 'float-heart';
  el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
  el.style.left = `${Math.random() * 90 + 5}%`;
  el.style.animationDuration = `${2.8 + Math.random() * 1.5}s`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── ProgressBar ───────────────────────────────────────────────────
function ProgressBar({ step }) {
  const qNum = getQuestionNum(step);
  const pct = getProgress(step);
  if (!qNum) return null;
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">Q{qNum}/{TOTAL_QUESTIONS}</span>
    </div>
  );
}

// ── StepBadge ─────────────────────────────────────────────────────
function StepBadge({ step }) {
  const qNum = getQuestionNum(step);
  if (!qNum) return null;
  return <span className="step-badge">Question {qNum} of {TOTAL_QUESTIONS}</span>;
}

// ── Card wrapper ──────────────────────────────────────────────────
function Card({ children, glow }) {
  return (
    <div className={`card${glow ? ' card-glow' : ''}`}>
      {children}
    </div>
  );
}

// ── OptionGrid ────────────────────────────────────────────────────
function OptionGrid({ options, selected, onSelect }) {
  return (
    <div className="options">
      {options.map(opt => (
        <button
          key={opt.label}
          className={`opt-btn ${selected === opt.label ? 'selected' : ''}`}
          onClick={() => onSelect(opt.label)}
        >
          <span className="icon">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── TextInput step ────────────────────────────────────────────────
function TextStep({ step, heading, sub, placeholder, inputType = 'text', value, onChange, onSubmit, feedback, feedbackOk }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, [step]);
  return (
    <Card>
      <StepBadge step={step} />
      <ProgressBar step={step} />
      <h2 className="heading">{heading}</h2>
      <p className="sub">{sub}</p>
      <div className="text-input-wrap">
        <input
          ref={ref}
          className="text-input"
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
        />
      </div>
      {feedback && <div className={`feedback ${feedbackOk ? 'ok' : 'err'}`}>{feedback}</div>}
      <button className="submit-btn" onClick={onSubmit}>Continue →</button>
    </Card>
  );
}

// ── DatePicker step ────────────────────────────────────────────────
function DatePickerStep({ step, heading, sub, value, onChange, onSubmit, feedback, feedbackOk }) {
  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const parseValue = (dateValue) => {
    const [year = '', month = '', day = ''] = (dateValue || '').split('-');
    return { year, month, day };
  };

  const [parts, setParts] = useState(() => parseValue(value));

  useEffect(() => {
    setParts(parseValue(value));
  }, [value, step]);

  const handleDateChange = (key, nextValue) => {
    const nextParts = { ...parts, [key]: nextValue };
    setParts(nextParts);

    if (nextParts.year && nextParts.month && nextParts.day) {
      onChange(`${nextParts.year}-${nextParts.month}-${nextParts.day}`);
      return;
    }

    onChange('');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <Card>
      <StepBadge step={step} />
      <ProgressBar step={step} />
      <h2 className="heading">{heading}</h2>
      <p className="sub">{sub}</p>
      <div className="date-picker-wrap">
        <select
          className="date-select"
          value={parts.month}
          onChange={e => handleDateChange('month', e.target.value)}
        >
          <option value="">Month</option>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select
          className="date-select"
          value={parts.day}
          onChange={e => handleDateChange('day', e.target.value)}
        >
          <option value="">Day</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="date-select"
          value={parts.year}
          onChange={e => handleDateChange('year', e.target.value)}
        >
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {feedback && <div className={`feedback ${feedbackOk ? 'ok' : 'err'}`}>{feedback}</div>}
      <button className="submit-btn" onClick={onSubmit}>Continue →</button>
    </Card>
  );
}

// ── Draggable image board ────────────────────────────────────────
function DraggableImageBoard({ images }) {
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const [positions, setPositions] = useState([]);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  useEffect(() => {
    // Spread images in a simple staggered layout when the board opens.
    const next = images.map((_, index) => ({
      x: 14 + (index % 3) * 105,
      y: 14 + Math.floor(index / 3) * 92,
    }));
    setPositions(next);
  }, [images]);

  const handlePointerDown = (event, index) => {
    const board = boardRef.current;
    if (!board || !positions[index]) return;

    const boardRect = board.getBoundingClientRect();
    const cardRect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - boardRect.left;
    const pointerY = event.clientY - boardRect.top;

    dragRef.current = {
      index,
      offsetX: pointerX - positions[index].x,
      offsetY: pointerY - positions[index].y,
      maxX: Math.max(0, boardRect.width - cardRect.width),
      maxY: Math.max(0, boardRect.height - cardRect.height),
      pointerId: event.pointerId,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag || !board) return;

    const boardRect = board.getBoundingClientRect();
    const pointerX = event.clientX - boardRect.left;
    const pointerY = event.clientY - boardRect.top;

    const nextX = clamp(pointerX - drag.offsetX, 0, drag.maxX);
    const nextY = clamp(pointerY - drag.offsetY, 0, drag.maxY);

    setPositions((prev) => prev.map((pos, i) => (i === drag.index ? { x: nextX, y: nextY } : pos)));
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    dragRef.current = null;
  };

  const boardHeight = Math.max(280, Math.ceil(images.length / 3) * 110 + 90);

  return (
    <div className="drag-board-wrap">
      <p className="drag-board-hint">Drag photos around: move up, down, left, and right ✨</p>
      <div ref={boardRef} className="drag-board" style={{ height: `${boardHeight}px` }}>
        {images.map((src, index) => {
          const pos = positions[index] || { x: 0, y: 0 };
          return (
            <button
              key={index}
              type="button"
              className="drag-image-card"
              style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img src={src} alt={`Special moment ${index + 1}`} className="reveal-img" loading="lazy" draggable="false" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
function App() {
  const [step, setStep] = useState(STEPS.INTRO);
  const [data, setData] = useState({
    name: '', birthday: '', colour: '', place: '', food: '',
    movie: '', song: '', memory: '', date: '', accepted: null,
  });
  const [feedback, setFeedback] = useState({ msg: '', ok: false });
  const [matchedImages, setMatchedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const fb = (msg, ok = false) => setFeedback({ msg, ok });
  const clearFb = () => setFeedback({ msg: '', ok: false });
  const goto = (s) => { clearFb(); setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ── Check DOB against admin DB ─────────────────────────────────
  const checkDOB = async (birthday) => {
    try {
      const res = await fetch(window.withApiBase('/api/check-dob'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: birthday }),
      });

      const raw = await res.text();
      let result = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = {};
      }

      if (!res.ok) {
        return {
          matched: false,
          images: [],
          error: result.error || `DOB check failed (${res.status})`
        };
      }

      const images = Array.isArray(result.images) ? result.images : [];
      const normalizedImages = images
        .map((img) => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object') return img.src || img.dataUrl || '';
          return '';
        })
        .filter(Boolean);

      return {
        matched: result.matched === true,
        label: result.label || '',
        images: normalizedImages,
      };
    } catch (error) {
      return { matched: false, images: [], error: error.message || 'Network error while checking DOB' };
    }
  };

  // ── Submit final response ──────────────────────────────────────
  const submitResponse = async (accepted) => {
    setSubmitting(true);
    const payload = { ...data, accepted, createdAt: new Date().toISOString() };
    try {
      await fetch(window.withApiBase('/api/responses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  // ── Step handlers ─────────────────────────────────────────────
  const handleName = () => {
    if (!data.name.trim()) return fb('Please enter your name 💭');
    fb(`Lovely to meet you, ${data.name}! 💫`, true);
    setTimeout(() => goto(STEPS.BIRTHDAY), 700);
  };

  const handleBirthday = async () => {
    if (!data.birthday || !data.birthday.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fb('Please select your complete date of birth 📅');
    }
    goto(STEPS.COLOUR);
  };

  const handleOption = (field, value, nextStep) => {
    set(field, value);
    fb(`✨ ${value} – great pick!`, true);
    setTimeout(() => goto(nextStep), 700);
  };

  const handleMemory = () => {
    if (!data.memory.trim()) return fb('Share a special memory with us 💭');
    goto(STEPS.PROPOSAL);
  };

  const handleSong = () => {
    if (!data.song.trim()) return fb('Tell us your favourite song 🎵');
    goto(STEPS.MEMORY);
  };

  const handleMovie = () => {
    if (!data.movie.trim()) return fb('Tell us your favourite movie 🎬');
    goto(STEPS.SONG);
  };

  const handleAccept = async () => {
    if (!data.date) return fb('Please pick a date first 📅');
    await submitResponse(true);

    // Now check if DOB matches any admin special date
    const result = await checkDOB(data.birthday);

    if (result.images && result.images.length > 0) {
      setMatchedImages(result.images);
      launchConfetti();
      goto(STEPS.IMAGES);
    } else if (result.error) {
      fb('Saved successfully, but surprise images are unavailable right now. Please try again later.', false);
      launchConfetti();
      goto(STEPS.SUCCESS);
    } else {
      launchConfetti();
      goto(STEPS.SUCCESS);
    }
  };

  const handleDecline = async () => {
    await submitResponse(false);
    goto(STEPS.DECLINED);
  };

  // ── Render screens ─────────────────────────────────────────────
  if (step === STEPS.INTRO) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <span className="header-brand">💌 A Special Message</span>
          <a href="/admin/" className="admin-pill">Admin</a>
        </header>
        <main className="app-main">
          <Card>
            <div className="intro-hero">
              <span className="big-emoji" style={{ animationDelay: '0s' }}>💌</span>
            </div>
            <h1 className="heading text-center">A Message Just For You</h1>
            <p className="sub text-center">
              Answer a few fun questions and unlock a special surprise waiting at the end 🌹
            </p>
            <div className="intro-hints">
              <span>🎨 Colours</span><span>🗺️ Places</span><span>🍽️ Food</span>
              <span>🎬 Movies</span><span>🎵 Songs</span><span>💌 Memories</span>
            </div>
            <button className="cta-yes" onClick={() => goto(STEPS.NAME)}>
              Open the message ✨
            </button>
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.NAME) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <TextStep
            step={step}
            heading="What's your name? 👋"
            sub="I want to address you personally throughout this little adventure."
            placeholder="Enter your name"
            value={data.name}
            onChange={v => set('name', v)}
            onSubmit={handleName}
            feedback={feedback.msg}
            feedbackOk={feedback.ok}
          />
        </main>
      </div>
    );
  }

  if (step === STEPS.BIRTHDAY) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <DatePickerStep
            step={step}
            heading="When is your birthday? 🎂"
            sub="Select your date of birth. This helps me make the moment extra special."
            value={data.birthday}
            onChange={v => set('birthday', v)}
            onSubmit={handleBirthday}
            feedback={feedback.msg}
            feedbackOk={feedback.ok}
          />
        </main>
      </div>
    );
  }

  if (step === STEPS.COLOUR) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card>
            <StepBadge step={step} /><ProgressBar step={step} />
            <h2 className="heading">What's your favourite colour? 🎨</h2>
            <p className="sub">The colour that makes your heart sing.</p>
            <OptionGrid
              selected={data.colour}
              onSelect={v => handleOption('colour', v, STEPS.PLACE)}
              options={[
                { icon: '❤️', label: 'Red' }, { icon: '💙', label: 'Blue' },
                { icon: '💚', label: 'Green' }, { icon: '💜', label: 'Violet' },
                { icon: '🧡', label: 'Orange' }, { icon: '🩷', label: 'Pink' },
                { icon: '🤍', label: 'White' }, { icon: '🖤', label: 'Black' },
              ]}
            />
            {feedback.msg && <div className={`feedback ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>}
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.PLACE) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card>
            <StepBadge step={step} /><ProgressBar step={step} />
            <h2 className="heading">Where would you love to go? 🗺️</h2>
            <p className="sub">If we could go anywhere together, where would it be?</p>
            <OptionGrid
              selected={data.place}
              onSelect={v => handleOption('place', v, STEPS.FOOD)}
              options={[
                { icon: '🏖️', label: 'Beach' }, { icon: '🏔️', label: 'Mountains' },
                { icon: '🌆', label: 'City lights' }, { icon: '☕', label: 'Cosy café' },
                { icon: '🎡', label: 'Amusement park' }, { icon: '🌌', label: 'Starry picnic' },
              ]}
            />
            {feedback.msg && <div className={`feedback ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>}
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.FOOD) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card>
            <StepBadge step={step} /><ProgressBar step={step} />
            <h2 className="heading">What's your perfect date meal? 🍽️</h2>
            <p className="sub">Good food makes every moment better — pick your favourite.</p>
            <OptionGrid
              selected={data.food}
              onSelect={v => handleOption('food', v, STEPS.MOVIE)}
              options={[
                { icon: '🍕', label: 'Pizza' }, { icon: '🍛', label: 'Biryani' },
                { icon: '🍝', label: 'Pasta' }, { icon: '🍱', label: 'Sushi' },
                { icon: '🍔', label: 'Burgers' }, { icon: '🍰', label: 'Desserts' },
              ]}
            />
            {feedback.msg && <div className={`feedback ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>}
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.MOVIE) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <TextStep
            step={step}
            heading="What's your all-time favourite movie? 🎬"
            sub="The one you could watch on repeat forever. Maybe we'll watch it together someday!"
            placeholder="e.g. The Notebook, Interstellar..."
            value={data.movie}
            onChange={v => set('movie', v)}
            onSubmit={handleMovie}
            feedback={feedback.msg}
            feedbackOk={feedback.ok}
          />
        </main>
      </div>
    );
  }

  if (step === STEPS.SONG) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <TextStep
            step={step}
            heading="Name a song that gives you all the feels 🎵"
            sub="The song that makes you close your eyes and just feel everything."
            placeholder="e.g. Perfect by Ed Sheeran..."
            value={data.song}
            onChange={v => set('song', v)}
            onSubmit={handleSong}
            feedback={feedback.msg}
            feedbackOk={feedback.ok}
          />
        </main>
      </div>
    );
  }

  if (step === STEPS.MEMORY) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <TextStep
            step={step}
            heading="Share your happiest memory 🌟"
            sub="Just a few words about a moment that made you smile — big or small."
            placeholder="e.g. That evening we watched the sunset..."
            value={data.memory}
            onChange={v => set('memory', v)}
            onSubmit={handleMemory}
            feedback={feedback.msg}
            feedbackOk={feedback.ok}
          />
        </main>
      </div>
    );
  }

  if (step === STEPS.PROPOSAL) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card glow>
            <div className="hero-emoji">💍</div>
            <h2 className="heading text-center">Will you go on a date with me?</h2>
            <div className="summary-card">
              <p>
                Hi <strong>{data.name}</strong>! You love <strong>{data.colour}</strong>, dream of visiting
                <strong> {data.place}</strong>, enjoy <strong>{data.food}</strong>, and your go-to movie is
                <strong> {data.movie}</strong>. You even have a favourite song —{' '}
                <em>{data.song}</em>. I'd love to share a moment as special as your happiest memory.
              </p>
              <p className="summary-question">Would you like to make a new memory together?</p>
            </div>
            <label className="date-label">Pick a date 📅</label>
            <input
              className="text-input date-picker"
              type="date"
              value={data.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { set('date', e.target.value); clearFb(); }}
            />
            {feedback.msg && <div className={`feedback ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>}
            <button className="cta-yes" disabled={submitting} onClick={handleAccept}>
              {submitting ? 'Saving…' : "Yes! I'd love to 💕"}
            </button>
            <button className="cta-no" disabled={submitting} onClick={handleDecline}>
              Maybe another time…
            </button>
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.IMAGES) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card glow>
            <div className="hero-emoji">🎁</div>
            <h2 className="celebration-text">Your Special Surprise!</h2>
            <p className="celebration-sub">
              Because today is extra special, here's a little gift just for you, {data.name} 💖
            </p>
            <DraggableImageBoard images={matchedImages} />
            <button className="cta-yes" style={{ marginTop: '1.5rem' }} onClick={() => goto(STEPS.SUCCESS)}>
              Continue 💌
            </button>
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.SUCCESS) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card glow>
            <div className="hero-emoji">🎉</div>
            <h2 className="celebration-text">It's a Date, {data.name}!</h2>
            <p className="celebration-sub">
              {data.date
                ? `Can't wait to see you on ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 🌹`
                : "This is going to be so special! 🌹"}
            </p>
            <div className="success-details">
              <div className="detail-pill">🎨 {data.colour}</div>
              <div className="detail-pill">🗺️ {data.place}</div>
              <div className="detail-pill">🍽️ {data.food}</div>
              <div className="detail-pill">🎬 {data.movie}</div>
              <div className="detail-pill">🎵 {data.song}</div>
            </div>
            <div className="status-msg">✅ See you soon!</div>
          </Card>
        </main>
      </div>
    );
  }

  if (step === STEPS.DECLINED) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Card>
            <div className="hero-emoji">🌧️</div>
            <h2 className="heading text-center">That's okay, {data.name}.</h2>
            <p className="sad-msg">
              No pressure at all. Whenever you're ready, the invitation will be waiting
              — just like the stars, always there even when you can't see them. 🌙
            </p>
            <button className="cta-yes btn-soft" onClick={() => { setData({ name:'', birthday:'', colour:'', place:'', food:'', movie:'', song:'', memory:'', date:'', accepted: null }); goto(STEPS.INTRO); }}>
              Start again
            </button>
          </Card>
        </main>
      </div>
    );
  }

  return null;
}

function AppHeader() {
  return (
    <header className="app-header">
      <span className="header-brand">💌 A Special Message</span>
      <a href="/admin/" className="admin-pill">Admin</a>
    </header>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
