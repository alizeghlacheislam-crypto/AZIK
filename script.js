/* ============================================
   AZIK — Interactions
   - Liquid magnetic cursor (Blob)
   - Electric sparks Canvas (mouse-driven + confetti burst)
   - Hero typing animation (AR/EN/FR)
   - Testimonials reveal + edge glow (CSS)
   - Thank You Popup + Confetti on WhatsApp click
   - Theme (dark/light) + Lang (AR/EN/FR) toggles
   ============================================ */

(function () {
  'use strict';

  const isTouch =
    window.matchMedia('(max-width: 768px)').matches ||
    'ontouchstart' in window;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* Hero video gate — يحمّل الفيديو فقط على Desktop بدون save-data
     على الموبايل/save-data/connection بطيء: يبقى الـ poster فقط */
  (function gateHeroVideo() {
    const v = document.querySelector('video.hero-video-bg');
    if (!v) return;
    const saveData = navigator.connection && navigator.connection.saveData;
    const slowConn = navigator.connection &&
      /^(slow-2g|2g|3g)$/.test(navigator.connection.effectiveType || '');
    const skip = isTouch || saveData || slowConn || prefersReducedMotion;
    if (skip) return; // poster image only

    const src = v.dataset.src;
    if (!src) return;
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    v.appendChild(source);
    v.setAttribute('preload', 'metadata');
    v.load();
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay(); else v.addEventListener('loadeddata', tryPlay, { once: true });
  })();

  const html = document.documentElement;

  /* ============================================
     SUPABASE CLIENT
     ⚠️ استبدل الـ URL والـ ANON KEY بقيمك من Supabase
     ============================================ */
  const SUPABASE_URL = 'https://xnmditfbwkpmigepueuh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWRpdGZid2twbWlnZXB1ZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTkxODMsImV4cCI6MjA5NTg3NTE4M30.Jf6vYirLOD22p5VPzIM3-7Ic8h3pV8U8LY-0W2M3ZPU';

  let sb = null;
  const supabaseConfigured =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';

  if (!window.supabase) {
    console.error('[AZIK] Supabase library NOT loaded from CDN. Check internet/ad-blocker.');
  } else if (!supabaseConfigured) {
    console.warn('[AZIK] Supabase URL/KEY not configured.');
  } else {
    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.error('[AZIK] Supabase init failed:', e);
    }
  }

  async function trackEvent(type, meta = {}) {
    if (!sb) return;
    try {
      await sb.from('events').insert({
        event_type: type,
        package: meta.package || null,
        language: currentLang,
        user_agent: navigator.userAgent.slice(0, 280),
        path: location.pathname
      });
    } catch (e) { /* silent */ }
  }

  /* ============================================
     THEME TOGGLE
     ============================================ */
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#F8FAFC' : '#090A0F');
    }
    try { localStorage.setItem('azik-theme', theme); } catch (e) {}
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
  function isLightTheme() {
    return html.getAttribute('data-theme') === 'light';
  }

  /* ============================================
     TYPING ANIMATION (Hero)
     ============================================ */
  const TYPING_PHRASES = {
    ar: ['تصاميم رقمية تترك أثراً ✨'],
    en: ['Digital designs that leave a mark ✨'],
    fr: ['Du design digital qui marque ✨']
  };

  class Typer {
    constructor(el) {
      this.el = el;
      this.setPhrases(TYPING_PHRASES.ar);
      this.idx = 0;
      this.charIdx = 0;
      this.deleting = false;
      this.running = false;
      this.timeout = null;
    }
    setPhrases(arr) {
      this.phrases = arr.slice();
      this.idx = 0;
      this.charIdx = 0;
      this.deleting = false;
      if (this.el) this.el.textContent = '';
    }
    setLang(lang) {
      const arr = TYPING_PHRASES[lang] || TYPING_PHRASES.ar;
      this.setPhrases(arr);
      if (!this.running) this.start();
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.tick();
    }
    tick() {
      if (!this.el) return;
      const phrase = this.phrases[this.idx];
      const codepoints = Array.from(phrase);
      const len = codepoints.length;

      if (this.deleting) {
        this.charIdx = Math.max(0, this.charIdx - 1);
        this.el.textContent = codepoints.slice(0, this.charIdx).join('');
        if (this.charIdx === 0) {
          this.deleting = false;
          this.idx = (this.idx + 1) % this.phrases.length;
          this.timeout = setTimeout(() => this.tick(), 400);
          return;
        }
        this.timeout = setTimeout(() => this.tick(), 28);
      } else {
        this.charIdx = Math.min(len, this.charIdx + 1);
        this.el.textContent = codepoints.slice(0, this.charIdx).join('');
        if (this.charIdx === len) {
          // Single phrase → stop after typing (no delete loop)
          if (this.phrases.length <= 1) {
            this.running = false;
            return;
          }
          this.deleting = true;
          this.timeout = setTimeout(() => this.tick(), 1700);
          return;
        }
        this.timeout = setTimeout(() => this.tick(), 55 + Math.random() * 35);
      }
    }
  }

  const typingEl = document.getElementById('typingText');
  const typer = typingEl ? new Typer(typingEl) : null;

  /* ============================================
     LANGUAGE SWITCHER (AR / EN / FR)
     ============================================ */
  const CURSOR_LABEL = {
    ar: 'عرض ↗',
    en: 'View ↗',
    fr: 'Voir ↗'
  };

  const WA_PHONE = '213791704281';
  const COPIED_LABEL = { ar: 'تم النسخ ✓', en: 'Copied ✓', fr: 'Copié ✓' };
  let currentLang = 'ar';
  const WA_MSG = {
    identity: {
      ar: 'السلام عليكم، أريد طلب باقة الشعار والهوية البصرية',
      en: 'Hello, I would like to order the Logo & Brand Identity package',
      fr: 'Bonjour, je voudrais commander le forfait Logo et Identité'
    },
    landing: {
      ar: 'السلام عليكم، أريد طلب باقة صفحات الهبوط',
      en: 'Hello, I would like to order the Landing Page package',
      fr: 'Bonjour, je voudrais commander le forfait Landing Page'
    },
    dashboard: {
      ar: 'السلام عليكم، أريد طلب باقة لوحة التحكم',
      en: 'Hello, I would like to order the Dashboard package',
      fr: 'Bonjour, je voudrais commander le forfait Dashboard'
    }
  };

  function setLang(lang) {
    if (!['ar', 'en', 'fr'].includes(lang)) lang = 'ar';
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-ar]').forEach((el) => {
      const val = el.dataset[lang];
      if (val !== undefined) el.textContent = val;
    });

    // تحديث aria-label للعناصر التي تحمل data-aria-*
    const ariaKey = 'aria' + lang.charAt(0).toUpperCase() + lang.slice(1);
    document.querySelectorAll('[data-aria-ar]').forEach((el) => {
      const v = el.dataset[ariaKey];
      if (v) el.setAttribute('aria-label', v);
    });

    if (typer) typer.setLang(lang);

    // (custom cursor removed — no label to update)

    document.querySelectorAll('a[data-wa]').forEach((a) => {
      const key = a.dataset.wa;
      const msg = WA_MSG[key] && WA_MSG[key][lang];
      if (msg) {
        a.href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
      }
    });

    refreshFormPlaceholders(lang);

    try { localStorage.setItem('azik-lang', lang); } catch (e) {}
  }

  document.querySelectorAll('.lang-btn').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });

  /* ============================================
     MOUSE TRACKING — للشرارات فقط (لا custom cursor)
     ============================================ */
  const state = {
    mx: window.innerWidth / 2,
    my: window.innerHeight / 2,
    // x/y تساوي mx/my مباشرة (لا lerp بدون blob)
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    moved: false,
    sparkIntensity: 1
  };

  document.addEventListener(
    'mousemove',
    (e) => {
      state.mx = e.clientX;
      state.my = e.clientY;
      state.x = e.clientX;
      state.y = e.clientY;
      state.moved = true;
    },
    { passive: true }
  );

  /* ============================================
     ELECTRIC SPARKS + CONFETTI (Canvas)
     ============================================ */
  const canvas = document.getElementById('sparks-canvas');
  const ctx = canvas && canvas.getContext('2d', { alpha: true });
  const SPARK_MAX = 200;
  const TOTAL_MAX = 450; // higher cap during confetti
  // Brand Orange spark palette — يطابق تدرّج حرف A في الشعار
  const SPARK_COLORS = ['#FF4D1C', '#FF6B00', '#FFA31A', '#FFCB6B'];
  const CONFETTI_COLORS = ['#FB923C', '#6366F1', '#FBBF24', '#818CF8', '#22D366', '#EF4444', '#A855F7', '#10B981'];

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let viewW = 0, viewH = 0;
  const sparks = [];

  function resizeCanvas() {
    if (!canvas) return;
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      if (sparks.length >= SPARK_MAX) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3.5;
      const color = SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0];
      sparks.push({
        type: 'spark',
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.035 + Math.random() * 0.04,
        size: 0.8 + Math.random() * 1.6,
        color,
        tail: [{ x, y }]
      });
    }
  }

  /* شرارات نيون صغيرة جداً للنقرات اللحظية (مثل أزرار النسخ) */
  function burstSparks(x, y, baseColor) {
    if (!ctx) return;
    const COUNT = 22; // burst أكثر تأثيراً
    const palette = baseColor
      ? [baseColor, '#FFFFFF', baseColor, '#FBBF24', baseColor]
      : ['#FB923C', '#6366F1', '#FBBF24'];
    for (let i = 0; i < COUNT; i++) {
      if (sparks.length >= TOTAL_MAX) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 3.5 + Math.random() * 6;
      const color = palette[(Math.random() * palette.length) | 0];
      sparks.push({
        type: 'spark',
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.08 + Math.random() * 0.05, // تختفي خلال ~700ms
        size: 0.7 + Math.random() * 1.3,    // صغيرة لكن مرئية
        color,
        tail: [{ x, y }]
      });
    }
  }

  function burstConfetti(x, y) {
    const COUNT = 110;
    for (let i = 0; i < COUNT; i++) {
      if (sparks.length >= TOTAL_MAX) break;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const spd = 6 + Math.random() * 10;
      const color = CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0];
      sparks.push({
        type: 'confetti',
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.006 + Math.random() * 0.006,
        size: 3 + Math.random() * 4,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        shape: Math.random() < 0.5 ? 'rect' : 'circle'
      });
    }
  }

  function updateParticle(p) {
    if (p.type === 'confetti') {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.vx *= 0.99;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;
      return;
    }
    // spark
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.vy += 0.06;
    p.life -= p.decay;
    const last = p.tail[p.tail.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy > 10) {
      p.tail.push({
        x: p.x + (Math.random() - 0.5) * 3,
        y: p.y + (Math.random() - 0.5) * 3
      });
      if (p.tail.length > 5) p.tail.shift();
    }
  }

  function drawParticle(p, alphaScale, blurScale) {
    if (p.type === 'confetti') {
      const a = Math.max(0, Math.min(1, p.life));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    // spark
    const a = p.life * alphaScale;
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size * p.life;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14 * blurScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < p.tail.length; i++) {
      const pt = p.tail[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.4, p.size * p.life * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }

  /* ============================================
     UNIFIED rAF LOOP — blob + sparks
     ============================================ */
  let prevMX = state.mx, prevMY = state.my;

  function frame() {
    requestAnimationFrame(frame);

    if (ctx && state.moved) {
      const mdx = state.mx - prevMX;
      const mdy = state.my - prevMY;
      const dist = Math.hypot(mdx, mdy);
      if (dist > 1.5) {
        const base = Math.min(4, 1 + dist * 0.14) | 0;
        const count = Math.max(1, (base * state.sparkIntensity) | 0);
        spawnSparks(state.x, state.y, count);
      }
      prevMX = state.mx;
      prevMY = state.my;
      state.moved = false;
    }

    if (!ctx) return;
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.globalCompositeOperation = 'lighter';
    const light = isLightTheme();
    const alphaScale = light ? 0.55 : 1;
    const blurScale = light ? 0.7 : 1;

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      updateParticle(p);
      if (
        p.life <= 0 ||
        p.x < -40 || p.x > viewW + 40 ||
        p.y > viewH + 40
      ) {
        sparks.splice(i, 1);
        continue;
      }
      // confetti uses source-over for solid color visibility
      if (p.type === 'confetti') {
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'lighter';
      }
      drawParticle(p, alphaScale, blurScale);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /* ============================================
     THANK YOU POPUP + WHATSAPP REDIRECT
     ============================================ */
  const popupOverlay = document.getElementById('popupOverlay');

  function showPopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.add('active');
  }
  function hidePopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.remove('active');
  }

  document.querySelectorAll('a[data-wa]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const href = btn.href;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Analytics: track WhatsApp click
      trackEvent('whatsapp_click', { package: btn.dataset.wa });

      // Confetti burst from button position
      if (!prefersReducedMotion && ctx) {
        burstConfetti(cx, cy);
      }

      showPopup();

      setTimeout(() => {
        window.open(href, '_blank', 'noopener,noreferrer');
        setTimeout(hidePopup, 350);
      }, 2000);
    });
  });

  /* ============================================
     CONTACT FORM SUBMISSION (Supabase: leads table)
     ============================================ */
  const FORM_MSG = {
    success: {
      ar: '✓ شكراً! استلمنا طلبك وسنرد عليك خلال 24 ساعة.',
      en: '✓ Thanks! We received your request and will reply within 24 hours.',
      fr: '✓ Merci ! Demande reçue, réponse sous 24 heures.'
    },
    loading: {
      ar: 'جارٍ الإرسال...',
      en: 'Sending...',
      fr: 'Envoi en cours...'
    },
    error: {
      ar: 'حدث خطأ. حاول مرة أخرى أو راسلنا عبر واتساب.',
      en: 'Something went wrong. Try again or message us on WhatsApp.',
      fr: 'Une erreur est survenue. Réessayez ou contactez-nous via WhatsApp.'
    },
    notConfigured: {
      ar: 'النموذج يحتاج إعداد Supabase. استخدم واتساب مؤقتاً.',
      en: 'Form requires Supabase setup. Use WhatsApp meanwhile.',
      fr: 'Le formulaire requiert la configuration Supabase. Utilisez WhatsApp en attendant.'
    }
  };

  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!formStatus) return;

      if (!sb) {
        formStatus.className = 'form-status error';
        formStatus.textContent = FORM_MSG.notConfigured[currentLang];
        return;
      }

      const fd = new FormData(contactForm);

      // honeypot: إذا اتعمّر هذا الحقل المخفي = بوت. نوقفو بصمت ونوهمو بالنجاح.
      if ((fd.get('website') || '').toString().trim() !== '') {
        formStatus.className = 'form-status success';
        formStatus.textContent = FORM_MSG.success[currentLang];
        contactForm.reset();
        return;
      }

      const payload = {
        name: (fd.get('name') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        company: (fd.get('company') || '').toString().trim() || null,
        project_type: (fd.get('project_type') || '').toString(),
        budget: (fd.get('budget') || '').toString() || null,
        timeline: (fd.get('timeline') || '').toString() || null,
        message: (fd.get('message') || '').toString().trim(),
        language: currentLang
      };

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
      if (!payload.name || !payload.email || !payload.message || !emailOk) {
        formStatus.className = 'form-status error';
        formStatus.textContent = FORM_MSG.error[currentLang];
        return;
      }

      contactForm.classList.add('submitting');
      formStatus.className = 'form-status loading';
      formStatus.textContent = FORM_MSG.loading[currentLang];

      try {
        const { error } = await sb
          .from('leads')
          .insert(payload);

        if (error) {
          console.error('[AZIK] Supabase error full:', JSON.stringify(error, null, 2));
          throw error;
        }

        trackEvent('form_submit', { package: payload.project_type });

        formStatus.className = 'form-status success';
        formStatus.textContent = FORM_MSG.success[currentLang];
        contactForm.reset();

        if (!prefersReducedMotion && ctx) {
          const r = contactForm.getBoundingClientRect();
          burstConfetti(r.left + r.width / 2, r.top + 80);
        }
      } catch (err) {
        console.error('[AZIK] Form submit failed:', err);
        formStatus.className = 'form-status error';
        formStatus.textContent =
          (err && err.message ? err.message + ' — ' : '') +
          FORM_MSG.error[currentLang];
      } finally {
        contactForm.classList.remove('submitting');
      }
    });

    // Update placeholders when lang changes (wired through setLang below)
  }

  // Helper to refresh form placeholders for current language
  function refreshFormPlaceholders(lang) {
    document.querySelectorAll('[data-placeholder-ar]').forEach((el) => {
      const v = el.dataset['placeholder' + lang.charAt(0).toUpperCase() + lang.slice(1)];
      if (v !== undefined) el.placeholder = v;
    });
  }

  /* Testimonials loader removed — section deleted until real testimonials exist */
  async function loadCMS() { /* placeholder for future CMS hooks */ }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ============================================
     COPYABLE PHONE NUMBER (footer)
     ============================================ */
  /* صوت click خفيف عبر Web Audio API (بدون ملفات صوتية) */
  let _audioCtx = null;
  function playCopyClick() {
    try {
      if (!_audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        _audioCtx = new Ctx();
      }
      if (_audioCtx.state === 'suspended') _audioCtx.resume();

      const now = _audioCtx.currentTime;
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();

      // نبضة عالية قصيرة "tick"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

      // مظروف صوت قصير جداً (60ms)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) { /* silent */ }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // fallback
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  document.querySelectorAll('.phone-copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const value = btn.dataset.phone || btn.dataset.email || '';
      copyToClipboard(value).then(() => {
        btn.classList.add('copied');

        const isEmail = btn.classList.contains('email-copy');
        const baseColor = isEmail ? '#6366F1' : '#22D366'; // بنفسجي للإيميل / أخضر للواتساب

        // ✨ شرارات نيون من نقطة النقر
        if (!prefersReducedMotion) {
          let cx = e.clientX, cy = e.clientY;
          // fallback لو الضغط من الكيبورد (clientX = 0)
          if (!cx || !cy) {
            const r = btn.getBoundingClientRect();
            cx = r.left + r.width / 2;
            cy = r.top + r.height / 2;
          }
          burstSparks(cx, cy, baseColor);
        }

        // 🔊 صوت click خفيف (نبضة 60ms)
        playCopyClick();

        // 📳 اهتزاز خفيف جداً (15ms) — Android + iOS supported devices
        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch (err) {}
        }

        setTimeout(() => btn.classList.remove('copied'), 900);
      }).catch(() => {
        // silent fail — value is still visible to user
      });
    });
  });

  // Allow Esc to dismiss popup early
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popupOverlay && popupOverlay.classList.contains('active')) {
      hidePopup();
    }
  });

  /* ============================================
     LEGENDARY SPOTLIGHT — Service + Bento + Testimonials + Pricing
     يتبع الماوس بدقة على كل الكروت
     ============================================ */
  const SPOTLIGHT_SELECTOR =
    '[data-spotlight], .bento-item, .testimonial-card, .price-card';
  document.querySelectorAll(SPOTLIGHT_SELECTOR).forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  /* ============================================
     SUBTLE MAGNETIC BUTTON PULL
     ============================================ */
  if (!isTouch && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ============================================
     MOBILE MENU
     ============================================ */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ============================================
     SCROLL REVEAL — class-based + stagger ذكي
     يفعّل .reveal.visible عند دخول الـ viewport
     ============================================ */
  (function scrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Fallback: لو IntersectionObserver غير مدعوم أو reduced-motion → عرض فوري
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        // Stagger: تأخير حسب موقع العنصر بين أشقّائه المباشرين الذين عليهم .reveal
        let delay = 0;
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll(':scope > .reveal'));
          const index = siblings.indexOf(el);
          if (index > 0) delay = Math.min(index * 90, 360);
        }
        setTimeout(() => el.classList.add('visible'), delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    els.forEach((el) => io.observe(el));
  })();

  /* ============================================
     APPLY SAVED LANGUAGE + START TYPER
     ============================================ */
  (function initLang() {
    let saved = null;
    try { saved = localStorage.getItem('azik-lang'); } catch (e) {}
    const lang = saved || html.getAttribute('lang') || 'ar';
    setLang(lang);
    if (typer) typer.start();
  })();

  /* ============================================
     INFINITE MARQUEE — تسارع خفيف عند الـ scroll
     ============================================ */
  (function marqueeAccelerator() {
    const track = document.getElementById('marqueeTrack');
    if (!track) return;

    const DEFAULT_DURATION = 35; // ثانية (السرعة العادية)
    const MIN_DURATION = 14;     // ثانية (أقصى تسارع)
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let resetTimer = null;
    let currentDuration = DEFAULT_DURATION;

    function setDuration(d) {
      if (Math.abs(d - currentDuration) < 0.2) return;
      currentDuration = d;
      track.style.setProperty('--marquee-duration', d.toFixed(1) + 's');
    }

    function onScroll() {
      const now = performance.now();
      const scrollDelta = window.scrollY - lastScroll;
      const timeDelta = now - lastTime;

      if (timeDelta > 0) {
        const velocity = Math.abs(scrollDelta / timeDelta * 1000); // px/sec
        // كلما زادت السرعة، نقصت المدة (تسارع الـ marquee)
        const target = Math.max(MIN_DURATION,
                                DEFAULT_DURATION - velocity * 0.025);
        setDuration(target);

        // ارجاع للسرعة الطبيعية بعد توقّف الـ scroll
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => setDuration(DEFAULT_DURATION), 500);
      }

      lastScroll = window.scrollY;
      lastTime = now;
    }

    if (!prefersReducedMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  })();

  // Load CMS data after init (non-blocking)
  loadCMS();

  /* ============================================
     KICKOFF
     ============================================ */
  if (canvas && ctx && !isTouch && !prefersReducedMotion) {
    resizeCanvas();
    window.addEventListener('resize', () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resizeCanvas();
    });
  }
  // بدء حلقة الـ frame (شرارات فقط بدون cursor)
  if (canvas && ctx && !isTouch && !prefersReducedMotion) {
    requestAnimationFrame(frame);
  }

  /* ============================================
     READING PROGRESS BAR — شريط تقدّم القراءة
     ============================================ */
  (function readingProgress() {
    const bar = document.querySelector('#readProgress span');
    if (!bar) return;
    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = p + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ============================================
     BACK TO TOP — زر العودة للأعلى
     ============================================ */
  (function backToTop() {
    const btn = document.getElementById('toTop');
    if (!btn) return;
    let ticking = false;
    function update() {
      btn.classList.toggle('show', window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
    update();
  })();

  /* ============================================
     BEFORE / AFTER — مقارن سحب تفاعلي
     ============================================ */
  (function beforeAfter() {
    const wrap = document.getElementById('baCompare');
    if (!wrap) return;
    const before = document.getElementById('baBefore');
    const handle = document.getElementById('baHandle');
    if (!before || !handle) return;
    let dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      // CSS variable يتحكم في clip-path للطبقة "قبل" — الصورتان تبقيان بنفس الحجم تماماً
      wrap.style.setProperty('--ba-pct', pct + '%');
      handle.style.left = pct + '%';
      wrap.setAttribute('aria-valuenow', Math.round(pct));
    }
    let pendingPct = null, raf = null;
    function schedule(pct) {
      pendingPct = pct;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (pendingPct != null) setPos(pendingPct);
      });
    }
    function fromEvent(e) {
      const r = wrap.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      schedule((x / r.width) * 100);
    }

    wrap.addEventListener('pointerdown', (e) => {
      dragging = true;
      try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
      fromEvent(e);
    });
    wrap.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
    wrap.addEventListener('pointerup', () => { dragging = false; });
    wrap.addEventListener('pointercancel', () => { dragging = false; });

    wrap.addEventListener('keydown', (e) => {
      const cur = parseFloat(wrap.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') { setPos(cur - 4); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setPos(cur + 4); e.preventDefault(); }
      else if (e.key === 'Home') { setPos(0); e.preventDefault(); }
      else if (e.key === 'End') { setPos(100); e.preventDefault(); }
    });

    // لمسة جذب أولية لتوضيح أنها تفاعلية
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
          if (!ent.isIntersecting) return;
          io.disconnect();
          const seq = [50, 64, 36, 50];
          let i = 0;
          const iv = setInterval(() => {
            i++;
            if (i >= seq.length) { clearInterval(iv); return; }
            const from = seq[i - 1], to = seq[i], t0 = performance.now();
            (function anim(now) {
              const k = Math.min(1, (now - t0) / 340);
              setPos(from + (to - from) * (1 - Math.pow(1 - k, 3)));
              if (k < 1) requestAnimationFrame(anim);
            })(t0);
          }, 380);
        });
      }, { threshold: 0.5 });
      io.observe(wrap);
    }
  })();

  /* ============================================
     LIVE DEMO MODAL — يفتح التطبيق داخل iframe في الصفحة
     ============================================ */
  (function demoModal() {
    const modal = document.getElementById('demoModal');
    const frame = document.getElementById('demoFrame');
    const titleEl = document.getElementById('demoTitle');
    const openBtn = document.getElementById('demoOpen');
    if (!modal || !frame) return;

    let lastFocus = null;

    function openDemo(url, title) {
      lastFocus = document.activeElement;
      titleEl.textContent = title || 'تجربة حية';
      if (openBtn) openBtn.href = url;
      if (frame.getAttribute('src') !== url) frame.setAttribute('src', url);
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeDemo() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll('.js-demo').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openDemo(el.dataset.demo || el.getAttribute('href'), el.dataset.demoTitle);
      });
    });

    modal.querySelectorAll('[data-demo-close]').forEach((b) => {
      b.addEventListener('click', closeDemo);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeDemo();
    });
  })();
})();
