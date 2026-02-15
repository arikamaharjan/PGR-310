// ============================================================================
// Heavy Animation Portfolio — script.js  (v2 – MAXIMUM ANIMATION)
// All animation driven by custom math (C/WASM + JS fallbacks). Zero 3rd-party.
// ============================================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

// ============================================================================
// XML DATA LOADER
// ============================================================================
const loadProfileFromXml = async () => {
    const parseXmlText = (xmlText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
        return doc;
    };

    const getText = (doc, selector) => doc.querySelector(selector)?.textContent?.trim() || '';
    const setTextById = (id, value) => { if (!value) return; const el = byId(id); if (el) el.textContent = value; };

    const setTextOrHideRowById = (id, value) => {
        const el = byId(id);
        if (!el) return;
        const row = el.closest('.info-item');
        if (!value) { if (row) row.style.display = 'none'; return; }
        if (row) row.style.display = '';
        el.textContent = value;
    };

    const setImgSrcById = (id, value) => {
        if (!value) return;
        const el = byId(id);
        if (!el || el.tagName !== 'IMG') return;
        const nextSrc = String(value).trim();
        if (!nextSrc || el.dataset.finalSrc === nextSrc) return;
        const hadReal = el.dataset.finalSrc && el.dataset.finalSrc !== '';
        const preload = new Promise((res, rej) => {
            const pre = new Image();
            pre.decoding = 'async';
            pre.onload = res;
            pre.onerror = () => rej(new Error('img fail'));
            pre.src = nextSrc;
        });
        const fadeOut = hadReal ? animateOpacityOut(el, 140) : Promise.resolve();
        Promise.allSettled([preload, fadeOut]).then(async (r) => {
            if (r[0].status !== 'fulfilled') { el.classList.add('img-ready'); return; }
            el.src = nextSrc;
            el.dataset.finalSrc = nextSrc;
            await animateOpacityIn(el, 240);
        });
    };

    const renderServicesFromXml = (doc) => {
        const grid = byId('servicesGrid');
        if (!grid) return;
        const nodes = Array.from(doc.querySelectorAll('profile > services > service'));
        if (!nodes.length) return;
        grid.innerHTML = '';
        nodes.forEach((s) => {
            const icon = s.querySelector('icon')?.textContent?.trim() || '✨';
            const title = s.querySelector('title')?.textContent?.trim() || '';
            const desc = s.querySelector('description')?.textContent?.trim() || '';
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `<div class="service-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>`;
            grid.appendChild(card);
        });
        initServiceCardTilt();
    };

    const renderProjectsFromXml = (doc) => {
        const grid = byId('portfolioGrid');
        if (!grid) return;
        const nodes = Array.from(doc.querySelectorAll('profile > projects > project'));
        if (!nodes.length) return;
        grid.innerHTML = '';
        nodes.forEach((p) => {
            const title = p.querySelector('title')?.textContent?.trim() || '';
            const cat = p.querySelector('category')?.textContent?.trim() || '';
            const img = p.querySelector('image')?.textContent?.trim() || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&h=400&fit=crop';
            const link = p.querySelector('link')?.textContent?.trim() || '';
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            if (link) {
                item.innerHTML = `<a class="portfolio-link" href="${link}" target="_blank" rel="noopener noreferrer"><img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div></a>`;
            } else {
                item.innerHTML = `<img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div>`;
            }
            grid.appendChild(item);
        });
        initSectionReveal();
    };

    const fetchFirst = async (paths) => {
        for (const p of paths) {
            try {
                const r = await fetch(p, { cache: 'no-store' });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return await r.text();
            } catch { /* next */ }
        }
        throw new Error('XML load failed');
    };

    try {
        const xmlText = await fetchFirst(['../data/profile.xml', '../data/profile.example.xml']);
        const doc = parseXmlText(xmlText);
        setTextById('heroSubtitle', getText(doc, 'profile > hero > subtitle'));
        setTextById('heroName', getText(doc, 'profile > hero > name'));
        setTextById('heroTagline', getText(doc, 'profile > hero > tagline'));
        setTextById('heroDescription', getText(doc, 'profile > hero > description'));
        setTextById('heroCta', getText(doc, 'profile > hero > cta'));
        setImgSrcById('heroImg', getText(doc, 'profile > hero > image'));
        setImgSrcById('aboutImg', getText(doc, 'profile > about > image'));
        setTextById('aboutName', getText(doc, 'profile > about > name'));
        setTextById('aboutAge', getText(doc, 'profile > about > age'));
        setTextOrHideRowById('aboutEmail', getText(doc, 'profile > about > email'));
        setTextOrHideRowById('aboutPhone', getText(doc, 'profile > about > phone'));
        setTextById('aboutAddress', getText(doc, 'profile > about > address'));
        setTextById('aboutFreelance', getText(doc, 'profile > about > freelance'));
        setTextById('aboutDescription', getText(doc, 'profile > about > description'));
        setTextById('footerName', getText(doc, 'profile > footer > name') || getText(doc, 'profile > about > name') || getText(doc, 'profile > hero > name'));
        renderServicesFromXml(doc);
        renderProjectsFromXml(doc);
        window.dispatchEvent(new Event('profile-loaded'));
    } catch (err) {
        console.warn('Profile XML not loaded:', err);
    }
};

// ============================================================================
// WASM BINDINGS
// ============================================================================
const waitForWasm = () => new Promise((resolve) => {
    // Resolve immediately if both the runtime-ready flag and cwrap are present.
    if (window.__vector2dWasmReady && window.Module?.cwrap) return resolve();

    // If cwrap is already present (but the inline flag wasn't set), treat as ready.
    if (window.Module?.cwrap) {
        window.__vector2dWasmReady = true;
        return resolve();
    }

    // Otherwise wait for the explicit event, but also poll for `Module.cwrap`
    // to guard against the event being dispatched before this listener is added.
    let settled = false;
    const settle = () => { if (settled) return; settled = true; clearInterval(poll); window.removeEventListener('vector2d-wasm-ready', onEvent); resolve(); };
    const onEvent = () => settle();
    window.addEventListener('vector2d-wasm-ready', onEvent, { once: true });

    const poll = setInterval(() => {
        if (window.Module?.cwrap) settle();
    }, 50);

    // Safety: after a reasonable timeout resolve anyway to avoid permanent hang
    // during development; errors can still be surfaced elsewhere.
    setTimeout(() => settle(), 5000);
});

const initAnimApi = () => {
    if (!window.Module?.cwrap) return null;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (!has('anim_ease_in_out_cubic')) return null;
    try {
        const w = window.Module.cwrap;
        return {
            easeInOutCubic: w('anim_ease_in_out_cubic', 'number', ['number']),
            easeOutElastic: has('anim_ease_out_elastic') ? w('anim_ease_out_elastic', 'number', ['number']) : null,
            easeOutBounce: has('anim_ease_out_bounce') ? w('anim_ease_out_bounce', 'number', ['number']) : null,
            easeOutBack: has('anim_ease_out_back') ? w('anim_ease_out_back', 'number', ['number']) : null,
            easeInOutQuart: has('anim_ease_in_out_quart') ? w('anim_ease_in_out_quart', 'number', ['number']) : null,
            lerp: has('anim_lerp') ? w('anim_lerp', 'number', ['number', 'number', 'number']) : null,
        };
    } catch { return null; }
};

const initWasmApi = () => {
    if (!window.Module?.cwrap) return null;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (!has('portfoliofx_init')) return null;
    try {
        const w = window.Module.cwrap;
        return {
            fx: {
                init: w('portfoliofx_init', null, ['number', 'number', 'number', 'number']),
                resize: w('portfoliofx_resize', null, ['number', 'number', 'number']),
                setPointer: w('portfoliofx_set_pointer', null, ['number', 'number']),
                setIsTouch: w('portfoliofx_set_is_touch', null, ['number']),
                step: w('portfoliofx_step', null, ['number']),
                getMx: w('portfoliofx_get_spotlight_mx', 'number', []),
                getMy: w('portfoliofx_get_spotlight_my', 'number', []),
                getParticleCount: w('portfoliofx_get_particle_count', 'number', []),
                getParticleStride: w('portfoliofx_get_particles_stride_floats', 'number', []),
                getParticlesPtr: w('portfoliofx_get_particles_ptr', 'number', []),
            },
        };
    } catch { return null; }
};

const initUnifiedApi = () => {
    if (!window.Module?.cwrap) return null;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (!has('unified_sim_init')) return null;
    try {
        const w = window.Module.cwrap;
        return {
            init: w('unified_sim_init', null, ['number', 'number', 'number']),
            step: w('unified_sim_step', null, ['number', 'number', 'number', 'number', 'number', 'number']),
            getCursorCount: w('unified_sim_get_cursor_count', 'number', []),
            getCursorStride: w('unified_sim_get_cursor_stride', 'number', []),
            getCursorPtr: w('unified_sim_get_cursor_ptr', 'number', []),
            getShapeCount: w('unified_sim_get_shape_count', 'number', []),
            getShapeStride: w('unified_sim_get_shape_stride', 'number', []),
            getShapePtr: w('unified_sim_get_shape_ptr', 'number', []),
            getSpringCount: w('unified_sim_get_spring_count', 'number', []),
            getSpringStride: w('unified_sim_get_spring_stride', 'number', []),
            getSpringPtr: w('unified_sim_get_spring_ptr', 'number', []),
            triggerSpring: w('unified_sim_trigger_spring', null, ['number', 'number', 'number']),
        };
    } catch { return null; }
};

const initStressApi = () => {
    if (!window.Module?.cwrap) return null;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (!has('domanim_init')) return null;
    try {
        const w = window.Module.cwrap;
        return {
            init: w('domanim_init', null, ['number', 'number']),
            step: w('domanim_step', null, ['number', 'number', 'number', 'number', 'number']),
            getCount: w('domanim_get_count', 'number', []),
            getStride: w('domanim_get_stride_floats', 'number', []),
            getPtr: w('domanim_get_ptr', 'number', []),
        };
    } catch { return null; }
};

// ============================================================================
// JS EASING FALLBACKS
// ============================================================================
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeInOutCubicJS = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutElasticJS = (t) => { t = clamp01(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
const easeOutBounceJS = (t) => { t = clamp01(t); const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) { t -= 1.5 / d; return n * t * t + .75; } if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + .9375; } t -= 2.625 / d; return n * t * t + .984375; };
const easeOutBackJS = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOutQuartJS = (t) => { t = clamp01(t); return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };
const lerpJS = (a, b, t) => a + (b - a) * clamp01(t);

let _easing = null;
const getEasing = () => {
    if (_easing) return _easing;
    const a = initAnimApi();
    _easing = {
        easeInOutCubic: a?.easeInOutCubic || easeInOutCubicJS,
        easeOutElastic: a?.easeOutElastic || easeOutElasticJS,
        easeOutBounce: a?.easeOutBounce || easeOutBounceJS,
        easeOutBack: a?.easeOutBack || easeOutBackJS,
        easeInOutQuart: a?.easeInOutQuart || easeInOutQuartJS,
        lerp: a?.lerp || lerpJS,
        clamp01
    };
    return _easing;
};

waitForWasm().then(() => { _easing = null; getEasing(); }).catch(() => { });

// ============================================================================
// OPACITY ANIMATION HELPERS
// ============================================================================
const animateOpacityTo = async (el, from, to, ms = 220) => {
    if (!el) return;
    const ease = getEasing().easeInOutCubic;
    el.style.transition = 'none';
    el.style.opacity = String(from);
    const t0 = performance.now();
    await new Promise(res => {
        const tick = (ts) => {
            const p = clamp01((ts - t0) / ms);
            el.style.opacity = String(from + (to - from) * ease(p));
            p < 1 ? requestAnimationFrame(tick) : res();
        };
        requestAnimationFrame(tick);
    });
};
const animateOpacityIn = async (el, ms = 220) => {
    if (!el) return;
    el.classList.remove('img-ready');
    await animateOpacityTo(el, 0, 1, ms);
    el.style.transition = ''; el.style.opacity = '';
    el.classList.add('img-ready');
};
const animateOpacityOut = async (el, ms = 160) => {
    if (!el) return;
    const cur = parseFloat(getComputedStyle(el).opacity || '1');
    await animateOpacityTo(el, isFinite(cur) ? cur : 1, 0, ms);
};

// ============================================================================
// 1. LOADING SCREEN
// ============================================================================
const initLoadingScreen = () => {
    const screen = byId('loadingScreen');
    if (!screen) return;
    const hide = () => {
        screen.classList.add('hidden');
        setTimeout(() => { screen.style.display = 'none'; }, 900);
    };
    // Wait for either window load or 2.5s max
    if (document.readyState === 'complete') setTimeout(hide, 800);
    else {
        window.addEventListener('load', () => setTimeout(hide, 600));
        setTimeout(hide, 2500);
    }
};

// ============================================================================
// 2. CURSOR PARTICLE TRAIL
// ============================================================================
const initCursorTrail = () => {
    // Only used as a hook for the canvas-to-WASM-rendering bridge
    const canvas = byId('cursorTrail');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    const resize = () => {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Register canvas for the unified loop
    window.__cursorCanvasCtx = ctx;
    window.__cursorCanvasRes = { w, h };
};

// ============================================================================
// 3. SCROLL PROGRESS BAR
// ============================================================================
const initScrollProgress = () => {
    const bar = byId('scrollProgress');
    if (!bar) return;
    const update = () => {
        const y = window.scrollY || 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        bar.style.width = `${Math.max(0, Math.min(100, (y / max) * 100))}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// 4. NAVBAR SCROLL MORPH
// ============================================================================
const initNavbarMorph = () => {
    const navbar = byId('navbar');
    if (!navbar) return;
    let scrolled = false;
    const update = () => {
        const now = (window.scrollY || 0) > 50;
        if (now !== scrolled) { scrolled = now; navbar.classList.toggle('scrolled', scrolled); }
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// 5. SECTION REVEAL ON SCROLL
// ============================================================================
const initSectionReveal = () => {
    const sels = [
        '.section-header', '.hero-content', '.hero-image',
        '.about-image', '.about-info',
        '.service-card', '.portfolio-item',
        '.contact-content', '.info-item',
        '.download-cv', '.social-links',
    ];
    const targets = $$(sels.join(','));
    targets.forEach(el => {
        if (el.classList.contains('anim-reveal')) return;
        el.classList.add('anim-reveal');
    });
    $$('.about-image').forEach(el => el.classList.add('from-left'));
    $$('.about-info').forEach(el => el.classList.add('from-right'));

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) e.target.classList.add('revealed');
        }
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    $$('.anim-reveal').forEach(el => io.observe(el));
};

// ============================================================================
// 6. HERO CHARACTER SPLIT ANIMATION
// ============================================================================
const initHeroCharSplit = () => {
    const nameEl = byId('heroName');
    if (!nameEl || nameEl.dataset.charSplit) return;
    nameEl.dataset.charSplit = '1';
    const text = nameEl.textContent.trim();
    if (!text) return;
    nameEl.innerHTML = '';
    // Color palette to cycle through for each non-space character
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    let ci = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            const sp = document.createElement('span');
            sp.className = 'anim-char-space';
            nameEl.appendChild(sp);
        } else {
            const span = document.createElement('span');
            span.className = 'anim-char';
            span.textContent = text[i];
            span.style.transitionDelay = `${ci * 60}ms`;
            // apply repeating color pattern (1,2,3,4,1,...)
            span.style.color = colors[ci % colors.length];
            nameEl.appendChild(span);
            ci++;
        }
    }
    setTimeout(() => nameEl.querySelectorAll('.anim-char').forEach(c => c.classList.add('visible')), 400);
};


// ============================================================================
// 7. TEXT SCRAMBLE EFFECT (section titles)
// ============================================================================
const initTextScramble = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    const els = $$('[data-scramble]');

    els.forEach(el => {
        if (el.dataset.scrambleDone) return;
        const original = el.textContent;
        el.dataset.scrambleOriginal = original;

        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && !el.dataset.scrambleDone) {
                    el.dataset.scrambleDone = '1';
                    scrambleText(el, original, chars);
                    io.disconnect();
                }
            }
        }, { threshold: 0.5 });

        io.observe(el);
    });
};

const scrambleText = (el, target, chars) => {
    const duration = 1200;
    const t0 = performance.now();
    el.classList.add('scrambling');

    const tick = (ts) => {
        const p = clamp01((ts - t0) / duration);
        const revealedCount = Math.floor(p * target.length);
        let result = '';

        for (let i = 0; i < target.length; i++) {
            if (i < revealedCount) {
                result += target[i];
            } else if (target[i] === ' ') {
                result += ' ';
            } else {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }

        el.textContent = result;

        if (p < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = target;
            el.classList.remove('scrambling');
        }
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 8. HERO TYPING EFFECT
// ============================================================================
const startHeroTypingEffect = async () => {
    const lines = [
        { el: byId('heroSubtitle'), delayMs: 0 },
        { el: byId('heroTagline'), delayMs: 500 },
        { el: byId('heroDescription'), delayMs: 900 },
    ].filter(x => x.el);

    for (const { el } of lines) {
        if (el.dataset.fullText) continue;
        el.dataset.fullText = (el.textContent || '').trimEnd();
        el.textContent = '';
    }

    const ease = getEasing().easeInOutCubic;
    const t0 = performance.now();

    const tick = (ts) => {
        let active = false;
        for (const { el, delayMs } of lines) {
            const full = el.dataset.fullText || '';
            if (!full) continue;
            const local = ts - (t0 + delayMs);
            if (local < 0) { active = true; continue; }
            const dur = Math.max(450, Math.min(2200, full.length * 38));
            const p = clamp01(local / dur);
            const e = ease(p);
            el.textContent = full.slice(0, Math.floor(e * full.length));
            if (p < 1) active = true;
        }
        if (active) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 9. HERO IMAGE 3D PARALLAX TILT
// ============================================================================
const initHeroTilt = () => {
    const frame = byId('heroFrame');
    const hero = frame?.closest('.hero');
    if (!frame || !hero) return;
    let trx = 0, try_ = 0, crx = 0, cry = 0;

    hero.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        try_ = ((e.clientX - cx) / (r.width / 2)) * 15;
        trx = -((e.clientY - cy) / (r.height / 2)) * 15;
        trx = Math.max(-15, Math.min(15, trx));
        try_ = Math.max(-15, Math.min(15, try_));
    }, { passive: true });

    hero.addEventListener('mouseleave', () => { trx = 0; try_ = 0; }, { passive: true });

    const tick = () => {
        crx += (trx - crx) * 0.06;
        cry += (try_ - cry) * 0.06;
        frame.style.transform = `perspective(800px) rotateX(${crx}deg) rotateY(${cry}deg)`;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// 10. SERVICE CARD 3D TILT ON HOVER
// ============================================================================
const initServiceCardTilt = () => {
    $$('.service-card').forEach(card => {
        if (!card.querySelector('.tilt-card-light')) {
            const light = document.createElement('div');
            light.className = 'tilt-card-light';
            card.appendChild(light);
        }
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.style.transform = `perspective(600px) rotateX(${(y - 0.5) * -18}deg) rotateY(${(x - 0.5) * 18}deg) scale(1.05)`;
            card.style.setProperty('--light-x', `${x * 100}%`);
            card.style.setProperty('--light-y', `${y * 100}%`);
        }, { passive: true });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; }, { passive: true });
    });
};

// ============================================================================
// 11. MAGNETIC BUTTONS
// ============================================================================
const initMagneticButtons = () => {
    $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.04)`;
            btn.style.setProperty('--bx', `${((e.clientX - r.left) / r.width) * 100}%`);
            btn.style.setProperty('--by', `${((e.clientY - r.top) / r.height) * 100}%`);
        }, { passive: true });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; }, { passive: true });
    });
};

// ============================================================================
// 12. BUTTON CLICK RIPPLE EFFECT
// ============================================================================
const initButtonRipple = () => {
    $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const r = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const size = Math.max(r.width, r.height) * 2;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - r.left - size / 2}px`;
            ripple.style.top = `${e.clientY - r.top - size / 2}px`;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    });
};

// ============================================================================
// DOWNLOAD CV CONFIRMATION MODAL
// ============================================================================
const initDownloadCv = () => {
    const cvHref = '../assets/Pratik_Maharjan_CV.pdf';

    const showConfirm = () => {
        if (document.getElementById('cvDownloadConfirm')) return;
        const overlay = document.createElement('div');
        overlay.id = 'cvDownloadConfirm';
        overlay.className = 'cv-modal-overlay';
        overlay.innerHTML = `
            <div class="cv-modal" role="dialog" aria-modal="true" aria-labelledby="cvModalTitle">
                <h3 id="cvModalTitle">Download CV</h3>
                <p>Do you want to download this CV?</p>
                <div class="cv-modal-actions">
                    <button class="cv-yes">Yes</button>
                    <button class="cv-no">No</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        const yes = overlay.querySelector('.cv-yes');
        const no = overlay.querySelector('.cv-no');

        const close = () => { overlay.remove(); };

        yes.addEventListener('click', () => {
            // trigger download
            const a = document.createElement('a');
            a.href = cvHref;
            a.setAttribute('download', 'Pratik_Maharjan_CV.pdf');
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            a.remove();
            close();
        });

        no.addEventListener('click', () => { close(); });

        // close when clicking outside modal
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    };

    $$('.download-cv').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showConfirm();
        });
    });
};

// ============================================================================
// CONTACT REDIRECT + SUCCESS POPUP
// ============================================================================
const showContactSuccessPopup = () => {
    if (document.getElementById('contactSuccessPopup')) return;
    const overlay = document.createElement('div');
    overlay.id = 'contactSuccessPopup';
    overlay.className = 'cv-modal-overlay';
    overlay.innerHTML = `
        <div class="cv-modal" role="dialog" aria-modal="true" aria-labelledby="contactSuccessTitle">
            <h3 id="contactSuccessTitle">Message Sent</h3>
            <p>We received your email — thank you for contacting us.</p>
            <div class="cv-modal-actions">
                <button class="cv-ok">OK</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const ok = overlay.querySelector('.cv-ok');
    const close = () => { overlay.remove(); };
    ok.addEventListener('click', close, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
};

const initContactRedirect = () => {
    const form = byId('contactForm');
    if (!form) return;
    // ensure FormSubmit redirects back to this page in the same tab
    form.removeAttribute('target');
    form.addEventListener('submit', () => {
        try {
            const nextUrl = window.location.origin + window.location.pathname + '?sent=1';
            let nextInput = form.querySelector('input[name="_next"]');
            if (!nextInput) {
                nextInput = document.createElement('input');
                nextInput.type = 'hidden';
                nextInput.name = '_next';
                form.appendChild(nextInput);
            }
            nextInput.value = nextUrl;
        } catch (err) { /* ignore */ }
        // allow default submission to proceed (browser will follow FormSubmit redirect)
    });
};

// ============================================================================
// 13. ABOUT TYPING ON VIEW
// ============================================================================
const initAboutTypingOnView = () => {
    const section = byId('about');
    if (!section) return;
    const desc = byId('aboutDescription');
    const vals = Array.from(section.querySelectorAll('.info-value'));
    let started = false;

    const start = () => {
        if (started) return;
        started = true;
        const items = [];
        if (desc) items.push({ el: desc, delayMs: 0, perCharMs: 18 });
        vals.forEach((el, i) => items.push({ el, delayMs: 260 + i * 120, perCharMs: 24 }));
        typingEffect(items);
    };

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) { if (e.isIntersecting) { start(); io.disconnect(); break; } }
    }, { threshold: 0.18 });
    io.observe(section);
};

const typingEffect = (items) => {
    const targets = (items || []).filter(i => i?.el);
    for (const it of targets) {
        if (it.el.dataset.fullText) continue;
        it.el.dataset.fullText = (it.el.textContent || '').trimEnd();
        it.el.textContent = '';
    }
    const ease = getEasing().easeInOutCubic;
    const t0 = performance.now();

    const tick = (ts) => {
        let active = false;
        for (const it of targets) {
            const full = it.el.dataset.fullText || '';
            if (!full) continue;
            const local = ts - (t0 + (it.delayMs || 0));
            if (local < 0) { active = true; continue; }
            const dur = Math.max(520, Math.min(3800, full.length * (it.perCharMs || 30)));
            const p = clamp01(local / dur);
            it.el.textContent = full.slice(0, Math.floor(ease(p) * full.length));
            if (p < 1) active = true;
        }
        if (active) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// 14. ABOUT IMAGE SCROLL PARALLAX
// ============================================================================
const initAboutParallax = () => {
    const img = $('.about-image img');
    if (!img) return;
    const update = () => {
        const r = img.getBoundingClientRect();
        const vis = clamp01(1 - r.top / window.innerHeight);
        img.style.transform = `translateY(${(vis - 0.5) * -40}px)`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// 15. FOOTER SOCIAL SPRING-IN
// ============================================================================
const initFooterSpringIn = () => {
    const container = byId('socialLinks');
    if (!container) return;
    const icons = Array.from(container.querySelectorAll('a'));
    icons.forEach(i => { i.style.opacity = '0'; i.style.transform = 'translateY(40px) scale(0.3) rotate(-20deg)'; });

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                icons.forEach((icon, i) => setTimeout(() => springIn(icon), i * 100));
                io.disconnect(); break;
            }
        }
    }, { threshold: 0.3 });
    io.observe(container);
};

const springIn = (el) => {
    const ease = getEasing().easeOutElastic;
    const t0 = performance.now();
    const dur = 1000;
    const tick = (ts) => {
        const p = clamp01((ts - t0) / dur);
        const e = ease(p);
        el.style.opacity = String(Math.min(1, p * 3));
        el.style.transform = `translateY(${(1 - e) * 40}px) scale(${0.3 + e * 0.7}) rotate(${(1 - e) * -20}deg)`;
        if (p < 1) requestAnimationFrame(tick);
        else { el.style.opacity = ''; el.style.transform = ''; }
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// 16. CONTACT FIELD STAGGER ENTRANCE
// ============================================================================
const initContactFieldStagger = () => {
    const form = byId('contactForm');
    if (!form) return;
    const fields = Array.from(form.querySelectorAll('input, textarea, button'));
    fields.forEach(f => { f.style.opacity = '0'; f.style.transform = 'translateY(30px) scale(0.95)'; });

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                fields.forEach((f, i) => setTimeout(() => {
                    const ease = getEasing().easeOutBack;
                    const t0 = performance.now();
                    const tick = (ts) => {
                        const p = clamp01((ts - t0) / 650);
                        f.style.opacity = String(Math.min(1, p * 2.5));
                        f.style.transform = `translateY(${(1 - ease(p)) * 30}px) scale(${0.95 + ease(p) * 0.05})`;
                        if (p < 1) requestAnimationFrame(tick);
                        else { f.style.opacity = ''; f.style.transform = ''; }
                    };
                    requestAnimationFrame(tick);
                }, i * 90));
                io.disconnect(); break;
            }
        }
    }, { threshold: 0.2 });
    io.observe(form);
};

// ============================================================================
// 17. SCROLL VELOCITY INDICATOR
// ============================================================================
const initScrollVelocity = () => {
    const bar = document.createElement('div');
    bar.className = 'scroll-velocity-bar';
    document.body.appendChild(bar);

    let lastY = window.scrollY, lastT = performance.now();
    let velocity = 0;

    const tick = (ts) => {
        const y = window.scrollY;
        const dt = Math.max(1, ts - lastT);
        const v = Math.abs(y - lastY) / dt * 16; // normalize to 60fps
        velocity += (v - velocity) * 0.15;

        lastY = y;
        lastT = ts;

        const pct = Math.min(40, velocity * 3);
        bar.style.height = `${pct}%`;
        bar.classList.toggle('active', velocity > 0.5);

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 18. FLOATING SHAPES CURSOR REPEL
// ============================================================================
const initInteractiveTitles = () => {
    // Collect titles and subtitles for the jumping effect
    const titles = $$('.section-title, .section-subtitle, .hero-title, .hero-subtitle');
    if (!titles.length) return;
    window.__interactiveTitles = titles;
};

const initShapeRepel = () => {
    window.__floatingShapes = $$('.shape');
};

// ============================================================================
// 19. UNIFIED SIMULATION SYSTEM (Performance Core)
// ============================================================================
const initUnifiedSimulation = async () => {
    await waitForWasm();
    const api = initUnifiedApi();
    if (!api) return;

    const w = window.innerWidth, h = window.innerHeight;
    api.init(w | 0, h | 0, (Date.now() & 0x7fffffff) | 0);

    let mouseX = -100, mouseY = -100;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
    }, { passive: true });

    // Register interactive titles for spring triggering
    const titles = window.__interactiveTitles || [];
    titles.forEach((el, i) => {
        el.addEventListener('mouseenter', () => {
            // Trigger a vertical "jump" (negative vy) and slight horizontal wobble
            api.triggerSpring(i, (Math.random() - 0.5) * 100, -800);
        });
    });

    let lastT = performance.now();

    const tick = (ts) => {
        const dt = Math.min(0.05, (ts - lastT) / 1000);
        lastT = ts;

        const cw = window.innerWidth, ch = window.innerHeight;
        api.step(dt, ts / 1000, mouseX, mouseY, cw | 0, ch | 0);

        // 1. Draw Particles
        const ctx = window.__cursorCanvasCtx;
        if (ctx) {
            ctx.clearRect(0, 0, cw, ch);
            const ptr = api.getCursorPtr() | 0, count = api.getCursorCount() | 0, stride = api.getCursorStride() | 0;
            const heap = window.Module.HEAPF32, base = ptr >>> 2;

            for (let i = 0; i < count; i++) {
                const o = base + i * stride;
                const life = heap[o + 4];
                if (life <= 0) continue;

                const x = heap[o], y = heap[o + 1], size = heap[o + 5] * life, hue = heap[o + 6];
                const alpha = life * 0.6;

                ctx.beginPath();
                ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha * 0.3})`;
                ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 2. Update Floating Shapes
        const shapes = window.__floatingShapes;
        if (shapes) {
            const ptr = api.getShapePtr() | 0, count = api.getShapeCount() | 0, stride = api.getShapeStride() | 0;
            const heap = window.Module.HEAPF32, base = ptr >>> 2;

            for (let i = 0; i < count && i < shapes.length; i++) {
                const o = base + i * stride;
                const el = shapes[i];
                el.style.translate = `${heap[o]}px ${heap[o + 1]}px`;
                // Optional: Update hue or scale from WASM too
            }
        }

        // 3. Update Interactive Springs (Jumping Titles)
        if (titles.length) {
            const ptr = api.getSpringPtr() | 0, count = api.getSpringCount() | 0, stride = api.getSpringStride() | 0;
            const heap = window.Module.HEAPF32, base = ptr >>> 2;

            for (let i = 0; i < count && i < titles.length; i++) {
                const o = base + i * stride;
                const x = heap[o];     // x_current
                const y = heap[o + 3];   // y_current

                // Only apply if there's significant movement to save on style updates
                if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
                    titles[i].style.translate = `${x}px ${y}px`;
                    titles[i].style.display = 'inline-block'; // Ensure translate works properly
                } else {
                    titles[i].style.translate = '0px 0px';
                }
            }
        }

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 19. PARALLAX SCROLL SECTIONS
// ============================================================================
const initParallaxSections = () => {
    const sections = $$('section');

    const tick = () => {
        const y = window.scrollY;
        sections.forEach(section => {
            const r = section.getBoundingClientRect();
            const visible = r.top < window.innerHeight && r.bottom > 0;
            if (!visible) return;

            const progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
            const offset = (progress - 0.5) * -20;

            // Subtle parallax on section content
            const header = section.querySelector('.section-header');
            if (header) {
                header.style.transform = `translateY(${offset}px)`;
            }
        });

        requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 20. PORTFOLIO ITEM TILT ON HOVER
// ============================================================================
const initPortfolioTilt = () => {
    $$('.portfolio-item').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const r = item.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            item.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
        }, { passive: true });

        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
        }, { passive: true });
    });
};

// ============================================================================
// 21. INFO ITEM COUNTER ANIMATION
// ============================================================================
const initCounterAnimation = () => {
    const ageEl = byId('aboutAge');
    if (!ageEl) return;

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting && !ageEl.dataset.counted) {
                ageEl.dataset.counted = '1';
                const text = ageEl.textContent || '';
                const match = text.match(/(\d+)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = text.replace(/\d+/, '').trim();
                    animateCounter(ageEl, target, suffix);
                }
                io.disconnect();
            }
        }
    }, { threshold: 0.5 });

    io.observe(ageEl);
};

const animateCounter = (el, target, suffix) => {
    const ease = getEasing().easeOutBack;
    const t0 = performance.now();
    const dur = 1500;

    const tick = (ts) => {
        const p = clamp01((ts - t0) / dur);
        const val = Math.round(ease(p) * target);
        el.textContent = `${val} ${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = `${target} ${suffix}`;
    };

    requestAnimationFrame(tick);
};

// ============================================================================
// 22. LOGO HOVER ANIMATION
// ============================================================================
const initLogoAnimation = () => {
    const logo = byId('logoText');
    if (!logo) return;

    logo.addEventListener('mouseenter', () => {
        const text = logo.textContent;
        logo.innerHTML = '';
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.animation = `logoWave 0.6s ease ${i * 0.05}s`;
            logo.appendChild(span);
        });
    });

    const style = document.createElement('style');
    style.textContent = `@keyframes logoWave { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`;
    document.head.appendChild(style);
};

// ============================================================================
// 23. CUSTOM SMOOTH SCROLL
// ============================================================================
const customSmoothScroll = (targetY, ms = 800) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 1) return;
    const ease = getEasing().easeInOutQuart;
    const t0 = performance.now();
    const tick = (ts) => {
        const p = clamp01((ts - t0) / ms);
        window.scrollTo(0, startY + diff * ease(p));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// 24. INPUT FOCUS WAVE ANIMATION
// ============================================================================
const initInputWave = () => {
    $$('.contact-form input, .contact-form textarea').forEach(input => {
        input.addEventListener('focus', () => {
            input.style.animation = 'inputFocusPop 0.4s ease';
            setTimeout(() => { input.style.animation = ''; }, 400);
        });
    });

    const style = document.createElement('style');
    style.textContent = `@keyframes inputFocusPop { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-4px) scale(1.01); } 100% { transform: translateY(-3px) scale(1); } }`;
    document.head.appendChild(style);
};

// ============================================================================
// 25. STRESS ANIMATIONS (WASM)
// ============================================================================
const initStressAnimations = async () => {
    await waitForWasm();
    const api = initStressApi();
    if (!api) return;

    document.body.classList.add('stress-on');
    let targets = [];

    const collect = () => {
        const sel = [
            'section', '.container', '.navbar', '.nav-link',
            '.hero-content', '.hero-title', '.hero-tagline',
            '.hero-description', '.cta-button', '.image-frame',
            '.about-content', '.about-image', '.about-info',
            '.info-item', '.download-cv',
            '.service-card', '.service-icon',
            '.portfolio-item', '.portfolio-overlay',
            '.contact-form', '.submit-button',
            '.section-header', '.section-title',
            '.social-links a',
        ].join(',');
        const seen = new Set();
        targets = $$(sel).filter(n => { if (seen.has(n)) return false; seen.add(n); return true; }).slice(0, 512);
        targets.forEach(el => el.classList.add('stress-anim'));
        api.init(targets.length, (Date.now() & 0x7fffffff) | 0);
    };

    collect();
    window.addEventListener('profile-loaded', collect);

    let pointerX = window.innerWidth * 0.5, pointerY = window.innerHeight * 0.35;
    window.addEventListener('mousemove', (e) => { pointerX = e.clientX; pointerY = e.clientY; }, { passive: true });

    let lastT = performance.now();
    const tick = (ts) => {
        const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000));
        lastT = ts;
        const y = window.scrollY || 0;
        const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
        api.step(ts / 1000, dt, clamp01(y / maxS), clamp01(pointerX / w), clamp01(pointerY / h));

        const count = api.getCount() | 0, stride = api.getStride() | 0;
        const ptr = api.getPtr() | 0, heap = window.Module.HEAPF32, base = ptr >>> 2;

        for (let i = 0; i < count && i < targets.length; i++) {
            const el = targets[i], o = base + i * stride;
            const s = el.style;
            s.setProperty('--tx', `${heap[o] * 1.5}px`);
            s.setProperty('--ty', `${heap[o + 1] * 1.5}px`);
            s.setProperty('--rot', `${heap[o + 2]}deg`);
            s.setProperty('--sc', `${1 + (heap[o + 3] - 1) * 1.2}`);
            s.setProperty('--blur', `${heap[o + 4] * 1.8}px`);
            s.setProperty('--hue', `${heap[o + 5] * 1.3}deg`);
            s.setProperty('--sat', `${1 + (heap[o + 6] - 1) * 1.2}`);
            s.setProperty('--alpha', `${Math.max(0.6, heap[o + 7])}`);
            if (stride >= 10) {
                s.setProperty('--glow', `${Math.min(1, heap[o + 8] * 1.5)}`);
                s.setProperty('--skew', `${heap[o + 9] * 0.8}deg`);
            }
        }

        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// 26. CANVAS PARTICLE FX
// ============================================================================
const initFx = async () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const canvas = byId('bgFx'), ctx = canvas?.getContext?.('2d');
    const spotlight = byId('spotlight');
    if (!canvas || !ctx || !spotlight) return;

    const isTouch = 'ontouchstart' in window;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, running = true, wasm = null;

    const resize = () => {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        wasm?.fx?.resize(w, h, dpr);
    };

    const onPointer = (e) => {
        const px = e?.clientX ?? (w * 0.5);
        const py = e?.clientY ?? (h * 0.35);
        // update wasm pointer when available
        try {
            if (wasm?.fx) {
                // ensure touch mode is disabled for mouse
                wasm.fx.setIsTouch(0);
                wasm.fx.setPointer(px, py);
                // if particles were accidentally cleared, repopulate by resizing (safe)
                const cnt = (wasm.fx.getParticleCount && wasm.fx.getParticleCount()) | 0;
                if (!cnt) wasm.fx.resize(w, h, dpr);
            }
        } catch (err) { /* ignore wasm timing errors */ }
    };

    // support touch events: forward touches to wasm pointer and mark touch mode
    const onTouch = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        try {
            if (wasm?.fx) {
                wasm.fx.setIsTouch(1);
                wasm.fx.setPointer(t.clientX, t.clientY);
            }
        } catch (err) { }
    };

    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { running = document.visibilityState !== 'hidden'; });
    resize();
    onPointer({ clientX: w * 0.5, clientY: h * 0.35 });

    await waitForWasm();
    wasm = initWasmApi();
    if (!wasm?.fx) return;

    wasm.fx.setIsTouch(isTouch ? 1 : 0);
    wasm.fx.init(w, h, dpr, (Date.now() ^ (w << 16) ^ h) | 0);

    let lastT = performance.now();
    const tick = (ts) => {
        if (!running) { lastT = ts; requestAnimationFrame(tick); return; }
        const dt = Math.min(0.05, (ts - lastT) / 1000);
        lastT = ts;
        wasm.fx.step(dt);

        spotlight.style.setProperty('--mx', `${wasm.fx.getMx()}%`);
        spotlight.style.setProperty('--my', `${wasm.fx.getMy()}%`);

        ctx.clearRect(0, 0, w, h);

        const count = wasm.fx.getParticleCount() | 0;
        const stride = wasm.fx.getParticleStride() | 0;
        const ptr = wasm.fx.getParticlesPtr() | 0;
        const heap = window.Module.HEAPF32, base = ptr >>> 2;

        for (let i = 0; i < count; i++) {
            const o = base + i * stride;
            const x = heap[o], y = heap[o + 1], r = heap[o + 4], hue = heap[o + 5], a = heap[o + 6];
            ctx.beginPath();
            ctx.fillStyle = `hsla(${hue},90%,65%,${a})`;
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Particle links
        const maxL = w < 768 ? 90 : 120;
        const maxL2 = maxL * maxL;
        for (let i = 0; i < count; i++) {
            const ai = base + i * stride;
            for (let j = i + 1; j < count; j++) {
                const bj = base + j * stride;
                const dx = heap[ai] - heap[bj], dy = heap[ai + 1] - heap[bj + 1];
                const d2 = dx * dx + dy * dy;
                if (d2 < maxL2) {
                    ctx.strokeStyle = `rgba(99,102,241,${(1 - Math.sqrt(d2) / maxL) * 0.1})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(heap[ai], heap[ai + 1]);
                    ctx.lineTo(heap[bj], heap[bj + 1]);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// MAIN INIT
// ============================================================================
const initDom = () => {
    // If the page was redirected back from FormSubmit with ?sent=1, show success popup
    const qp = new URLSearchParams(window.location.search || '');
    if (qp.get('sent') === '1') {
        // delay slightly so UI is ready
        setTimeout(() => {
            showContactSuccessPopup();
            // remove query param without reloading
            try { const u = new URL(window.location.href); u.searchParams.delete('sent'); history.replaceState({}, '', u.pathname + u.search); } catch (e) { /* ignore */ }
        }, 250);
    }
    // Load profile XML (fires `profile-loaded` event when ready)
    loadProfileFromXml().catch(() => {});
    // Loading screen
    initLoadingScreen();

    // Image fallback
    ['heroImg', 'aboutImg'].forEach(id => {
        const el = byId(id);
        if (!el) return;
        const mark = () => el.classList.add('img-ready');
        if (el.complete && el.naturalWidth > 0) mark();
        else { el.addEventListener('load', mark, { once: true }); setTimeout(mark, 1200); }
    });

    // Char split
    let charDone = false;
    const doChar = () => { if (charDone) return; charDone = true; initHeroCharSplit(); };
    window.addEventListener('profile-loaded', () => { if (!charDone) doChar(); }, { once: true });
    // Fallback: only run if heroName already has content after a short delay
    setTimeout(() => { if (!charDone && (byId('heroName')?.textContent || '').trim()) doChar(); }, 900);

    // Typing
    let typeDone = false;
    const doType = () => { if (typeDone) return; typeDone = true; startHeroTypingEffect(); };
    window.addEventListener('profile-loaded', () => { if (!typeDone) doType(); }, { once: true });
    setTimeout(() => { if (!typeDone && (byId('heroSubtitle')?.textContent || '').trim()) doType(); }, 950);

    // All animation systems
    initScrollProgress();
    initNavbarMorph();
    initSectionReveal();
    initTextScramble();
    // Re-run text scramble after profile data is loaded (in case text was replaced)
    window.addEventListener('profile-loaded', () => initTextScramble());
    initHeroTilt();
    initServiceCardTilt();
    initMagneticButtons();
    initButtonRipple();
    initDownloadCv();
    initContactRedirect();
    initAboutTypingOnView();
    initAboutParallax();
    initFooterSpringIn();
    initContactFieldStagger();
    initCursorTrail();
    initScrollVelocity();
    initShapeRepel();
    initInteractiveTitles();
    initUnifiedSimulation();
    initParallaxSections();
    initPortfolioTilt();
    initCounterAnimation();
    initLogoAnimation();
    initInputWave();

    // Mobile nav
    const hamburger = byId('hamburger'), navMenu = byId('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Nav smooth scroll
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            e.preventDefault();
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            const target = $(href);
            if (target) customSmoothScroll(target.offsetTop - 80, 900);
        });
    });

    // Hero CTA: scroll to About section smoothly (account for navbar height)
    const heroCta = byId('heroCta');
    if (heroCta) {
        heroCta.addEventListener('click', (e) => {
            e.preventDefault();
            const target = $('#about');
            if (!target) return;
            const nav = byId('navbar');
            const offset = nav ? nav.offsetHeight : 80;
            // small extra gap so section header isn't flush against the nav
            customSmoothScroll(target.offsetTop - offset - 10, 900);
        });
    }

    // Active nav on scroll
    const secs = $$('section');
    window.addEventListener('scroll', () => {
        const y = window.pageYOffset || 0;
        let cur = '';
        secs.forEach(s => { if (y >= s.offsetTop - 100) cur = s.id; });
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
    }, { passive: true });

    // Contact form: posts directly to FormSubmit via HTML `action` attribute.
    // No JS interception is required so users can send using FormSubmit service.
};

// Run main init when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initDom, { once: true });
} else {
    setTimeout(initDom, 0);
}

