/* ============================================================
   A Letter in Code — For Sudabeh & Somaya
   Celebration engine + interactions
   ============================================================ */

'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX_COLORS = ['#f4a7b9', '#c9a7f0', '#8ec5ff', '#e8c86a', '#7ee0d8', '#ffdcc7', '#ffffff', '#b07ae0'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

/* ============================================================
   FX ENGINE — fireworks, sparks, confetti, sparkles, stars
   ============================================================ */
const FX = (() => {
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let shootingStars = [];
  let raf = null;
  let running = false;

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function loop() {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x += s.vx; s.y += s.vy; s.life -= 1;
      const a = Math.max(s.life / s.maxLife, 0);
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
      grad.addColorStop(0, `rgba(255,255,255,${a})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
      ctx.stroke();
      if (s.life <= 0 || s.x > W + 60 || s.y > H + 60) shootingStars.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.gravity;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy;
      p.life -= 1;
      if (p.rot !== undefined) p.rot += p.spin;

      const t = Math.max(p.life / p.maxLife, 0);
      const alpha = t > 0.7 ? 1 : t / 0.7;

      if (p.type === 'confetti') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1;
      } else if (p.type === 'star') {
        drawStar(p.x, p.y, p.size * (0.5 + t * 0.5), p.color, alpha * p.twinkle);
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 * t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * t, 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      if (p.life <= 0 || p.y > H + 40) particles.splice(i, 1);
    }

    ctx.globalCompositeOperation = 'source-over';

    if (particles.length || shootingStars.length) {
      raf = requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  function drawStar(x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.min(alpha, 1);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.38;
      const px = x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function start() {
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }

  function add(list) {
    particles.push(...list);
    if (particles.length > 2400) particles = particles.slice(-2400);
    start();
  }

  /* --- a firework: sparks radiating outward --- */
  function firework(x, y, opts = {}) {
    const color = opts.color || pick(FX_COLORS);
    const count = opts.count || 46;
    const power = opts.power || rand(2.6, 4.4);
    const list = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + rand(-0.12, 0.12);
      const sp = power * rand(0.45, 1.1);
      list.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        gravity: 0.035, drag: 0.975,
        size: rand(1.4, 3),
        color: Math.random() < 0.28 ? '#ffffff' : (Math.random() < 0.5 ? color : pick(FX_COLORS)),
        life: rand(48, 86) | 0, maxLife: 86,
      });
      list[list.length - 1].maxLife = list[list.length - 1].life;
    }
    // glitter tail
    for (let i = 0; i < 14; i++) {
      list.push({
        type: 'star',
        x: x + rand(-24, 24), y: y + rand(-24, 24),
        vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5),
        gravity: 0.008, drag: 0.985,
        size: rand(3, 6),
        color: '#f6e3b4',
        twinkle: 1,
        life: rand(30, 60) | 0, maxLife: 60,
      });
      list[list.length - 1].maxLife = list[list.length - 1].life;
    }
    add(list);
  }

  /* --- confetti shower from top --- */
  function confetti(count = 90) {
    const W = window.innerWidth;
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        type: 'confetti',
        x: rand(0, W), y: rand(-60, -10),
        vx: rand(-1, 1), vy: rand(1.4, 3.6),
        gravity: 0.02, drag: 0.995,
        size: rand(6, 12),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.12, 0.12),
        color: pick(FX_COLORS),
        life: 260, maxLife: 260,
      });
    }
    add(list);
  }

  /* --- sparkles around a DOM element --- */
  function sparkleAround(el, count = 26) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const list = [];
    for (let i = 0; i < count; i++) {
      const ang = rand(0, Math.PI * 2);
      const dist = rand(r.width * 0.35, r.width * 0.8);
      list.push({
        type: Math.random() < 0.5 ? 'star' : 'spark',
        x: cx + Math.cos(ang) * dist,
        y: cy + Math.sin(ang) * dist * 0.6,
        vx: Math.cos(ang) * rand(0.2, 0.9),
        vy: Math.sin(ang) * rand(0.2, 0.9) - 0.4,
        gravity: 0.012, drag: 0.985,
        size: rand(3, 7),
        color: pick(['#f6e3b4', '#ffd6e4', '#c9e4ff', '#e5d0ff', '#ffffff']),
        twinkle: 1,
        life: rand(40, 80) | 0, maxLife: 80,
      });
      list[list.length - 1].maxLife = list[list.length - 1].life;
    }
    add(list);
  }

  /* --- burst at element center --- */
  function burstAt(el, opts = {}) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    firework(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  /* --- shooting star --- */
  function shootingStar() {
    const W = window.innerWidth;
    shootingStars.push({
      x: rand(-40, W * 0.6),
      y: rand(-20, window.innerHeight * 0.35),
      vx: rand(7, 12),
      vy: rand(3.5, 6),
      life: 90, maxLife: 90,
    });
    start();
  }

  /* --- big finale --- */
  function finale() {
    const W = window.innerWidth, H = window.innerHeight;
    confetti(150);
    const shots = [
      [0.22, 0.3], [0.5, 0.22], [0.78, 0.32],
      [0.35, 0.45], [0.65, 0.45], [0.5, 0.38],
      [0.15, 0.55], [0.85, 0.55],
    ];
    shots.forEach(([fx, fy], i) => {
      setTimeout(() => firework(W * fx, H * fy, { count: 56, power: rand(3, 5) }), i * 340);
    });
    for (let i = 0; i < 5; i++) setTimeout(shootingStar, 600 + i * 700);
    setTimeout(() => confetti(90), 1400);
  }

  /* --- ambient glitter drift (very light) --- */
  function glitterDrift(count = 8) {
    const W = window.innerWidth;
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        type: 'star',
        x: rand(0, W), y: rand(window.innerHeight * 0.2, window.innerHeight),
        vx: rand(-0.15, 0.15), vy: rand(-0.35, -0.1),
        gravity: 0, drag: 1,
        size: rand(2.5, 5),
        color: pick(['#f6e3b4', '#ffd6e4', '#c9e4ff']),
        twinkle: 1,
        life: rand(70, 130) | 0, maxLife: 130,
      });
      list[list.length - 1].maxLife = list[list.length - 1].life;
    }
    add(list);
  }

  return { firework, confetti, sparkleAround, burstAt, shootingStar, finale, glitterDrift, start };
})();

/* ============================================================
   INTRO — floating particles + reveal
   ============================================================ */
(() => {
  const canvas = document.getElementById('intro-canvas');
  const ctx = canvas.getContext('2d');
  let motes = [];
  let animId = null;

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn() {
    const W = window.innerWidth, H = window.innerHeight;
    motes = [];
    const n = Math.min(90, Math.round(W / 14));
    for (let i = 0; i < n; i++) {
      motes.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(0.7, 2.6),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.4, -0.08),
        hue: pick(['#f4a7b9', '#c9a7f0', '#8ec5ff', '#e8c86a', '#ffffff']),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.6, 1.8),
      });
    }
  }
  spawn();

  function draw() {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const t = performance.now() / 1000;
    for (const m of motes) {
      m.x += m.vx + Math.sin(t * m.speed + m.phase) * 0.16;
      m.y += m.vy;
      if (m.y < -8) { m.y = H + 8; m.x = rand(0, W); }
      if (m.x < -8) m.x = W + 8;
      if (m.x > W + 8) m.x = -8;
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * m.speed + m.phase));
      ctx.globalAlpha = twinkle * 0.85;
      ctx.fillStyle = m.hue;
      ctx.shadowColor = m.hue;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  }
  if (!REDUCED) draw();

  // occasional intro shooting star
  let introStarTimer = null;
  if (!REDUCED) {
    introStarTimer = setInterval(() => {
      const introEl = document.getElementById('intro');
      if (!introEl || introEl.classList.contains('leaving')) return;
      ctx.globalCompositeOperation = 'lighter';
      const y = rand(30, window.innerHeight * 0.4);
      const x = rand(0, window.innerWidth * 0.5);
      for (let i = 0; i < 14; i++) {
        motes.push({
          x: x - i * 7, y: y - i * 3.2,
          r: 1.6 - i * 0.09, vx: 0, vy: 0,
          hue: '#ffffff', phase: 0, speed: 1,
        });
      }
      setTimeout(() => { motes = motes.slice(0, 120); }, 900);
    }, 4200);
  }

  // ---- open the letter ----
  const btn = document.getElementById('open-letter');
  const intro = document.getElementById('intro');
  const site = document.getElementById('site');
  const hint = document.getElementById('intro-hint');
  let opened = false;

  function open() {
    if (opened) return;
    opened = true;
    if (introStarTimer) clearInterval(introStarTimer);
    hint.textContent = 'Welcome 💐';

    // celebration explosion at the button
    const r = btn.getBoundingClientRect();
    FX.firework(r.left + r.width / 2, r.top + r.height / 2, { count: 60, power: 4 });
    setTimeout(() => FX.confetti(70), 180);
    setTimeout(() => FX.firework(window.innerWidth * 0.3, window.innerHeight * 0.35, { count: 34 }), 420);
    setTimeout(() => FX.firework(window.innerWidth * 0.7, window.innerHeight * 0.4, { count: 34 }), 640);

    setTimeout(() => {
      intro.classList.add('leaving');
      site.classList.remove('hidden');
      site.setAttribute('aria-hidden', 'false');
      site.classList.add('entering');
      cancelAnimationFrame(animId);
      setTimeout(() => {
        intro.remove();
        site.classList.remove('entering');
        initSite();
      }, 1200);
    }, 750);
  }

  btn.addEventListener('click', open);
})();

/* ============================================================
   MAIN SITE
   ============================================================ */
function initSite() {

  /* ---------- falling petals ---------- */
  if (!REDUCED) {
    const petals = document.getElementById('petals');
    const glyphs = ['✿', '❀', '✦', '❁', '·'];
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('span');
      el.className = 'petal';
      el.textContent = pick(glyphs);
      el.style.left = rand(0, 100) + 'vw';
      el.style.fontSize = rand(9, 18) + 'px';
      el.style.color = pick(['#f4a7b9', '#c9a7f0', '#8ec5ff', '#e8c86a', '#ffc9d9']);
      el.style.animationDuration = rand(11, 22) + 's';
      el.style.animationDelay = -rand(0, 18) + 's';
      petals.appendChild(el);
    }
  }

  /* ---------- scroll reveal + section triggers ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        revealObserver.unobserve(e.target);
        onRevealed(e.target);
      }
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

  let revealIndex = 0;
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    revealIndex++;
    if (revealIndex % 3 === 0) el.style.setProperty('--reveal-delay', '0.12s');
    if (revealIndex % 3 === 1) el.style.setProperty('--reveal-delay', '0.24s');
    revealObserver.observe(el);
  });

  const triggered = new Set();
  function onRevealed(el) {
    if (REDUCED) return;
    // sparkles around hero names when they appear
    if (el.classList.contains('hero-names')) {
      setTimeout(() => {
        FX.sparkleAround(document.getElementById('hero-sudabeh'), 30);
        setTimeout(() => FX.sparkleAround(document.getElementById('hero-somaya'), 30), 450);
      }, 500);
    }
    if (el.classList.contains('section-title') && !triggered.has(el)) {
      triggered.add(el);
      FX.glitterDrift(6);
    }
  }

  /* ---------- hero name hover sparkles ---------- */
  ['hero-sudabeh', 'hero-somaya'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('mouseenter', () => { if (!REDUCED) FX.sparkleAround(el, 14); });
    el.addEventListener('click', () => { if (!REDUCED) FX.burstAt(el, { count: 26, power: 2.4 }); });
  });

  /* ---------- card sparkle dots ---------- */
  document.querySelectorAll('.card-sparkles').forEach((box) => {
    for (let i = 0; i < 7; i++) {
      const d = document.createElement('span');
      d.className = 'spark-dot';
      d.style.left = rand(6, 94) + '%';
      d.style.top = rand(6, 94) + '%';
      d.style.animationDelay = -rand(0, 2.6) + 's';
      box.appendChild(d);
    }
  });

  /* ---------- memory wall ---------- */
  const MEMORIES = [
    {
      title: 'My First Steps',
      icon: '🌱',
      tease: 'When everything began, and nothing made sense yet.',
      kicker: 'Memory I',
      img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=70',
      text: 'I remember the first days — unsure, quiet, afraid to ask. You didn\'t rush me. You let me learn at my own speed and treated every small step like it mattered, because it did. <em>Every confident step I take now started with your patience.</em>',
    },
    {
      title: 'Lessons I Will Remember',
      icon: '📖',
      tease: 'Not just from the book — from the way you taught it.',
      kicker: 'Memory II',
      img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=70',
      text: 'Years from now I might forget a formula or a date, but I will never forget how a lesson felt when you made it come alive — the stories, the examples, the moments when a hard idea suddenly clicked. <em>You taught me how to learn, and that is the lesson that stays.</em>',
    },
    {
      title: 'Small Moments, Big Impact',
      icon: '✨',
      tease: 'A smile, a nod, a "try again" — and everything changed.',
      kicker: 'Memory III',
      img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=70',
      text: 'It was never one grand gesture. It was the small things: noticing when I was stuck, saying "good try" before the correction, staying two extra minutes to explain. Those tiny moments added up to something huge — <em>the feeling that someone believed in me.</em>',
    },
    {
      title: 'Words That Stayed',
      icon: '💬',
      tease: 'Things you said once that I still hear today.',
      kicker: 'Memory IV',
      img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=70',
      text: '"You can do this." "Take your time." "Mistakes are how we learn." You probably said these words a hundred times without thinking. But I kept them. On hard days, they come back — <em>in your voice, reminding me not to give up.</em>',
    },
    {
      title: 'Learning Together',
      icon: '🤝',
      tease: 'The classroom felt like a team, not a test.',
      kicker: 'Memory V',
      img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=70',
      text: 'You never stood above us — you stood beside us. When something was hard, it became "let\'s figure this out together." That changed everything. Learning stopped being something I faced alone and became <em>something we did as a class, as a team.</em>',
    },
    {
      title: 'Moments of Inspiration',
      icon: '🌟',
      tease: 'The days your lessons felt like light.',
      kicker: 'Memory VI',
      img: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=70',
      text: 'There were days when your energy filled the whole room — when a lesson became a story, a question became an adventure, and even the tired students sat up straighter. <em>That\'s what inspiration looks like: a teacher who still loves what she teaches.</em>',
    },
    {
      title: 'Beyond the Classroom',
      icon: '🕊',
      tease: 'You taught kindness that no textbook contains.',
      kicker: 'Memory VII',
      img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=70&sat=-15&hue=280',
      text: 'You asked how we were, not just how our grades were. You taught respect by being respectful, patience by being patient, kindness without announcing it. <em>Some of the most important things you taught us were never on the board.</em>',
    },
    {
      title: 'Thank You',
      icon: '💐',
      tease: 'The words we should have said more often.',
      kicker: 'Memory VIII',
      img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=70',
      text: 'So this is the card that holds all the others: thank you. For the time, the effort, the repeated explanations, the belief. <em>Thank you for being the kind of teachers students remember forever.</em> This whole little website exists just to say that.',
    },
  ];

  const grid = document.getElementById('memory-grid');
  MEMORIES.forEach((m, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `memory-card mem-g${(i % 8) + 1}`;
    card.setAttribute('data-reveal', '');
    card.setAttribute('aria-label', `Open memory: ${m.title}`);
    card.innerHTML = `
      <div class="memory-visual">
        <img src="${m.img}" alt="" loading="lazy" onerror="this.remove()" />
        <span class="memory-icon">${m.icon}</span>
      </div>
      <div class="memory-body">
        <h3 class="memory-title">${m.title}</h3>
        <p class="memory-tease">${m.tease}</p>
        <span class="memory-open">Open ↗</span>
      </div>`;
    card.addEventListener('click', () => openModal(m, card));
    grid.appendChild(card);
    revealObserver.observe(card);
  });

  /* ---------- modal ---------- */
  const backdrop = document.getElementById('modal-backdrop');
  const modalImage = document.getElementById('modal-image');
  const modalKicker = document.getElementById('modal-kicker');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalClose = document.getElementById('modal-close');
  let lastFocused = null;

  function openModal(m, card) {
    lastFocused = card;
    modalImage.style.backgroundImage = `linear-gradient(rgba(255,227,236,.25), rgba(236,225,255,.25)), url("${m.img}")`;
    modalKicker.textContent = m.kicker;
    modalTitle.textContent = m.title;
    modalText.innerHTML = m.text;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
    if (!REDUCED) {
      FX.sparkleAround(document.querySelector('.modal'), 18);
      setTimeout(() => FX.firework(window.innerWidth / 2, window.innerHeight * 0.3, { count: 24, power: 2 }), 250);
    }
  }

  function closeModal() {
    backdrop.classList.add('closing');
    setTimeout(() => {
      backdrop.hidden = true;
      backdrop.classList.remove('closing');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }, 280);
  }

  modalClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !backdrop.hidden) closeModal(); });

  /* ---------- two lights ---------- */
  const lights = [
    { btn: document.getElementById('light-sudabeh'), msg: document.getElementById('msg-sudabeh') },
    { btn: document.getElementById('light-somaya'), msg: document.getElementById('msg-somaya') },
  ];
  const link = document.querySelector('.lights-link');
  let litCount = 0;
  const litSet = new Set();

  lights.forEach(({ btn, msg }) => {
    function activate() {
      btn.classList.add('bright');
      msg.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      if (!REDUCED) FX.sparkleAround(btn, 24);
      if (!litSet.has(btn)) {
        litSet.add(btn);
        litCount++;
        if (litCount === 2) {
          link.classList.add('linked');
          if (!REDUCED) {
            setTimeout(() => FX.firework(window.innerWidth / 2, window.innerHeight * 0.42, { count: 40, power: 3 }), 900);
            setTimeout(() => FX.glitterDrift(10), 1300);
          }
        }
      }
    }
    btn.addEventListener('mouseenter', () => btn.classList.add('bright'));
    btn.addEventListener('mouseleave', () => { if (msg.hidden) btn.classList.remove('bright'); });
    btn.addEventListener('focus', () => btn.classList.add('bright'));
    btn.addEventListener('click', activate);
  });

  /* ---------- secret ---------- */
  const secretBtn = document.getElementById('reveal-secret');
  const secretMsg = document.getElementById('secret-message');
  let secretRevealed = false;
  secretBtn.addEventListener('click', () => {
    secretMsg.hidden = false;
    secretBtn.disabled = true;
    secretBtn.querySelector('span:nth-child(2)').textContent = 'The Secret Is Out 💛';
    if (!REDUCED && !secretRevealed) {
      secretRevealed = true;
      FX.burstAt(secretBtn, { count: 34, power: 2.8 });
      FX.sparkleAround(secretMsg, 26);
      setTimeout(() => FX.confetti(45), 350);
      setTimeout(() => FX.shootingStar(), 700);
    }
  });

  /* ---------- timeline dots: small spark on reveal ---------- */
  document.querySelectorAll('.tl-item').forEach((item) => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        if (!REDUCED) {
          const dot = item.querySelector('.tl-dot');
          setTimeout(() => FX.sparkleAround(dot, 10), 300);
        }
      }
    }, { threshold: 0.4 });
    obs.observe(item);
  });

  /* ---------- finale ---------- */
  const finale = document.getElementById('finale');
  let finaleFired = false;
  const finaleObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !finaleFired) {
      finaleFired = true;
      if (!REDUCED) {
        setTimeout(() => FX.finale(), 400);
        setTimeout(() => FX.finale(), 3600);
      }
    }
  }, { threshold: 0.3 });
  finaleObs.observe(finale);

  document.getElementById('celebrate-again').addEventListener('click', () => {
    if (!REDUCED) FX.finale();
  });

  /* ---------- gentle ambient: occasional shooting star / glitter ---------- */
  if (!REDUCED) {
    setInterval(() => {
      if (Math.random() < 0.5) FX.shootingStar();
      else FX.glitterDrift(5);
    }, 7000);
  }

  /* ---------- light parallax on ambient glows ---------- */
  if (!REDUCED && window.matchMedia('(min-width: 768px)').matches) {
    const ambients = document.querySelectorAll('.ambient');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        ambients.forEach((el, i) => {
          el.style.transform = `translateY(${y * (0.03 + i * 0.02)}px)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }
}
