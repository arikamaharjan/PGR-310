// // ============================================================================
// // Heavy Animation Portfolio — script.js  (v2 – MAXIMUM ANIMATION)
// // All animation driven by custom math (C/WASM + JS fallbacks). Zero 3rd-party.
// // ============================================================================

// const $ = (sel) => document.querySelector(sel);
// const $$ = (sel) => Array.from(document.querySelectorAll(sel));
// const byId = (id) => document.getElementById(id);
// // When true, only run animations backed by C/WASM; JS-only animations will be skipped
// const WASM_ONLY_ANIM = true;

// function runWasmOnlyOrFinalize(runFn, finalizeFn) {
//     // runFn: function to run when WASM is available
//     // finalizeFn: apply final state immediately when WASM unavailable
//     if (window.Module && typeof window.Module.cwrap === 'function') {
//         try { return runFn(); } catch (e) { finalizeFn && finalizeFn(); }
//     } else {
//         if (WASM_ONLY_ANIM) { finalizeFn && finalizeFn(); return; }
//         return runFn();
//     }
// }

// // ============================================================================
// // XML DATA LOADER
// // ============================================================================
// const loadProfileFromXml = async () => {
//     const parseXmlText = (xmlText) => {
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(xmlText, 'application/xml');
//         if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
//         return doc;
//     };

//     const getText = (doc, selector) => doc.querySelector(selector)?.textContent?.trim() || '';
//     const setTextById = (id, value) => { if (!value) return; const el = byId(id); if (el) el.textContent = value; };

//     const setTextOrHideRowById = (id, value) => {
//         const el = byId(id);
//         if (!el) return;
//         const row = el.closest('.info-item');
//         if (!value) { if (row) row.style.display = 'none'; return; }
//         if (row) row.style.display = '';
//         el.textContent = value;
//     };

//     const setImgSrcById = (id, value) => {
//         if (!value) return;
//         const el = byId(id);
//         if (!el || el.tagName !== 'IMG') return;
//         const nextSrc = String(value).trim();
//         if (!nextSrc || el.dataset.finalSrc === nextSrc) return;
//         const hadReal = el.dataset.finalSrc && el.dataset.finalSrc !== '';
//         const preload = new Promise((res, rej) => {
//             const pre = new Image();
//             pre.decoding = 'async';
//             pre.onload = res;
//             pre.onerror = () => rej(new Error('img fail'));
//             pre.src = nextSrc;
//         });
//         const fadeOut = hadReal ? animateOpacityOut(el, 140) : Promise.resolve();
//         Promise.allSettled([preload, fadeOut]).then(async (r) => {
//             if (r[0].status !== 'fulfilled') { el.classList.add('img-ready'); return; }
//             el.src = nextSrc;
//             el.dataset.finalSrc = nextSrc;
//             await animateOpacityIn(el, 240);
//         });
//     };

//     const renderServicesFromXml = (doc) => {
//         const grid = byId('servicesGrid');
//         if (!grid) return;
//         const nodes = Array.from(doc.querySelectorAll('profile > services > service'));
//         if (!nodes.length) return;
//         grid.innerHTML = '';
//         nodes.forEach((s) => {
//             const icon = s.querySelector('icon')?.textContent?.trim() || '✨';
//             const title = s.querySelector('title')?.textContent?.trim() || '';
//             const desc = s.querySelector('description')?.textContent?.trim() || '';
//             const card = document.createElement('div');
//             card.className = 'service-card';
//             card.innerHTML = `<div class="service-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>`;
//             grid.appendChild(card);
//         });
//         initServiceCardTilt();
//     };

//     const renderProjectsFromXml = (doc) => {
//         const grid = byId('portfolioGrid');
//         if (!grid) return;
//         const nodes = Array.from(doc.querySelectorAll('profile > projects > project'));
//         if (!nodes.length) return;
//         grid.innerHTML = '';
//         nodes.forEach((p) => {
//             const title = p.querySelector('title')?.textContent?.trim() || '';
//             const cat = p.querySelector('category')?.textContent?.trim() || '';
//             const img = p.querySelector('image')?.textContent?.trim() || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&h=400&fit=crop';
//             const link = p.querySelector('link')?.textContent?.trim() || '';
//             const item = document.createElement('div');
//             item.className = 'portfolio-item';
//             if (link) {
//                 item.innerHTML = `<a class="portfolio-link" href="${link}" target="_blank" rel="noopener noreferrer"><img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div></a>`;
//             } else {
//                 item.innerHTML = `<img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div>`;
//             }
//             grid.appendChild(item);
//         });
//         initSectionReveal();
//     };

//     const fetchFirst = async (paths) => {
//         for (const p of paths) {
//             try {
//                 const r = await fetch(p, { cache: 'no-store' });
//                 if (!r.ok) throw new Error(`HTTP ${r.status}`);
//                 return await r.text();
//             } catch { /* next */ }
//         }
//         throw new Error('XML load failed');
//     };

//     try {
//         const xmlText = await fetchFirst(['../data/profile.xml', '../data/profile.example.xml']);
//         const doc = parseXmlText(xmlText);
//         setTextById('heroSubtitle', getText(doc, 'profile > hero > subtitle'));
//         setTextById('heroName', getText(doc, 'profile > hero > name'));
//         setTextById('heroTagline', getText(doc, 'profile > hero > tagline'));
//         setTextById('heroDescription', getText(doc, 'profile > hero > description'));
//         setTextById('heroCta', getText(doc, 'profile > hero > cta'));
//         setImgSrcById('heroImg', getText(doc, 'profile > hero > image'));
//         setImgSrcById('aboutImg', getText(doc, 'profile > about > image'));
//         setTextById('aboutName', getText(doc, 'profile > about > name'));
//         setTextById('aboutAge', getText(doc, 'profile > about > age'));
//         setTextOrHideRowById('aboutEmail', getText(doc, 'profile > about > email'));
//         setTextOrHideRowById('aboutPhone', getText(doc, 'profile > about > phone'));
//         setTextById('aboutAddress', getText(doc, 'profile > about > address'));
//         setTextById('aboutFreelance', getText(doc, 'profile > about > freelance'));
//         setTextById('aboutDescription', getText(doc, 'profile > about > description'));
//         setTextById('footerName', getText(doc, 'profile > footer > name') || getText(doc, 'profile > about > name') || getText(doc, 'profile > hero > name'));
//         renderServicesFromXml(doc);
//         renderProjectsFromXml(doc);
//         window.dispatchEvent(new Event('profile-loaded'));
//     } catch (err) {
//         console.warn('Profile XML not loaded:', err);
//     }
// };

// // ============================================================================
// // WASM BINDINGS
// // ============================================================================
// // Centralized WASM <-> JS bridge: readiness promise, cached cwrap, memory helpers
// (function () {
//     if (window.Wasm) return;
//     const bridge = {
//         // resolves with Module (or {} on timeout)
//         ready: new Promise((resolve) => {
//             let settled = false;
//             const settle = (mod) => { if (settled) return; settled = true; resolve(mod || {}); window.dispatchEvent(new Event('vector2d-wasm-ready')); };

//             // If Module already ready
//             if (window.Module && typeof window.Module.cwrap === 'function') return settle(window.Module);

//             // Hook Emscripten onRuntimeInitialized if present
//             if (window.Module && typeof window.Module.onRuntimeInitialized === 'function') {
//                 const orig = window.Module.onRuntimeInitialized;
//                 window.Module.onRuntimeInitialized = function () { try { orig(); } catch (e) { } settle(window.Module); };
//             }

//             // Listen for explicit event (other code may dispatch)
//             const onEvent = () => settle(window.Module);
//             window.addEventListener('vector2d-wasm-ready', onEvent, { once: true });

//             // Poll for Module.cwrap as a fallback
//             const poll = setInterval(() => {
//                 if (window.Module && typeof window.Module.cwrap === 'function') {
//                     clearInterval(poll);
//                     window.removeEventListener('vector2d-wasm-ready', onEvent);
//                     return settle(window.Module);
//                 }
//             }, 50);

//             // Give up after timeout (resolve with whatever Module exists)
//             setTimeout(() => { clearInterval(poll); window.removeEventListener('vector2d-wasm-ready', onEvent); settle(window.Module); }, 5000);
//         }),

//         // cwrap cache and helper
//         _cache: {},
//         cwrap(name, ret, argTypes) {
//             const k = `${name}|${ret}|${(argTypes || []).join(',')}`;
//             if (this._cache[k]) return this._cache[k];
//             if (!window.Module || typeof window.Module.cwrap !== 'function') {
//                 const err = function () { throw new Error('WASM cwrap not available: ' + name); };
//                 this._cache[k] = err;
//                 return err;
//             }
//             const fn = window.Module.cwrap(name, ret, argTypes || []);
//             this._cache[k] = fn;
//             return fn;
//         },

//         // Memory helpers (lightweight — avoid allocating views in hot loops)
//         heapF32() {
//             return (window.Module && window.Module.HEAPF32) ? window.Module.HEAPF32 : (typeof HEAPF32 !== 'undefined' ? HEAPF32 : null);
//         },
//         // return { heap, base } where base is the starting float index for ptr
//         getHeapF32AndBase(ptr) {
//             const heap = this.heapF32();
//             if (!heap || !ptr) return { heap: new Float32Array(0), base: 0 };
//             return { heap, base: ptr >>> 2 };
//         },
//         // Backward-compatible: allocate a view (use sparingly)
//         float32View(ptr, count) {
//             if (!ptr || !window.Module || !window.Module.HEAPF32) return new Float32Array(0);
//             return new Float32Array(window.Module.HEAPF32.buffer, ptr, count);
//         },

//         // Convenience wrapper for functions that expose vector components separately
//         makeVec2Wrapper(xName, yName, argTypes) {
//             const fx = () => { throw new Error('WASM not ready'); };
//             const fy = () => { throw new Error('WASM not ready'); };
//             const wrapper = (...args) => ({ x: bridge.cwrap(xName, 'number', argTypes)(...args), y: bridge.cwrap(yName, 'number', argTypes)(...args) });
//             return wrapper;
//         }
//     };
//     window.Wasm = bridge;
// })();
// const waitForWasm = () => {
//     // Prefer the centralized bridge when present
//     if (window.Wasm && window.Wasm.ready) return window.Wasm.ready;

//     // Fallback to legacy behavior if bridge not yet injected
//     return new Promise((resolve) => {
//         if (window.__vector2dWasmReady && window.Module?.cwrap) return resolve();
//         if (window.Module?.cwrap) { window.__vector2dWasmReady = true; return resolve(); }

//         let settled = false;
//         const settle = () => { if (settled) return; settled = true; clearInterval(poll); window.removeEventListener('vector2d-wasm-ready', onEvent); resolve(); };
//         const onEvent = () => settle();
//         window.addEventListener('vector2d-wasm-ready', onEvent, { once: true });

//         const poll = setInterval(() => { if (window.Module?.cwrap) settle(); }, 50);
//         setTimeout(() => settle(), 5000);
//     });
// };

// // Initialize cached math bindings from WASM (call after bridge created)
// const initMathWasmBindings = async () => {
//     if (!window.Wasm) return null;
//     await (window.Wasm.ready || Promise.resolve());
//     try {
//         const safeCwrap = (name, ret, args) => {
//             try {
//                 if (window.Wasm && typeof window.Wasm.cwrap === 'function') return window.Wasm.cwrap(name, ret, args);
//                 if (window.Module && typeof window.Module.cwrap === 'function') return window.Module.cwrap(name, ret, args);
//             } catch (e) { /* ignore */ }
//             return null;
//         };

//         const M = {
//             clamp01: safeCwrap('anim_clamp01', 'number', ['number']) || (x => Math.max(0, Math.min(1, x))),
//             lerp: safeCwrap('anim_lerp', 'number', ['number', 'number', 'number']) || ((a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t))),
//             easeInOutCubic: safeCwrap('anim_ease_in_out_cubic', 'number', ['number']) || (t => { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }),
//             smoothstep: safeCwrap('anim_smoothstep', 'number', ['number', 'number', 'number']) || ((e0, e1, x) => { if (e0 === e1) return x < e0 ? 0 : 1; let t = (x - e0) / (e1 - e0); t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }),
//             noise1: safeCwrap('anim_noise1', 'number', ['number']) || (x => { const i = Math.floor(x); const f = x - i; const a = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; const b = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1; const t = f * f * (3 - 2 * f); return a + (b - a) * t; }),
//             wave: safeCwrap('anim_wave', 'number', ['number', 'number', 'number', 'number']) || ((t, freq, amp, phase) => Math.sin(t * freq + phase) * amp),
//             expSmooth: safeCwrap('anim_exp_smooth', 'number', ['number', 'number', 'number', 'number']) || ((current, target, lambda, dt) => { if (dt <= 0) return current; const k = Math.exp(-lambda * dt); return target + (current - target) * k; }),
//             magnitude_xy: safeCwrap('vector2D_magnitude_xy', 'number', ['number', 'number']) || ((dx, dy) => Math.hypot(dx, dy)),
//             rotation_x: safeCwrap('vector2D_rotation_x', 'number', ['number', 'number', 'number']) || ((x, y, a) => x * Math.cos(a) - y * Math.sin(a)),
//             rotation_y: safeCwrap('vector2D_rotation_y', 'number', ['number', 'number', 'number']) || ((x, y, a) => x * Math.sin(a) + y * Math.cos(a)),
//         };
//         window.MathWasm = M;
//         return M;
//     } catch (e) { return null; }
// };

// const initAnimApi = () => {
//     if (!window.Module?.cwrap) return null;
//     const has = (n) => typeof window.Module[`_${n}`] === 'function';
//     if (!has('anim_ease_in_out_cubic')) return null;
//     try {
//         const w = window.Module.cwrap;
//         return {
//             easeInOutCubic: w('anim_ease_in_out_cubic', 'number', ['number']),
//             easeOutElastic: has('anim_ease_out_elastic') ? w('anim_ease_out_elastic', 'number', ['number']) : null,
//             easeOutBounce: has('anim_ease_out_bounce') ? w('anim_ease_out_bounce', 'number', ['number']) : null,
//             easeOutBack: has('anim_ease_out_back') ? w('anim_ease_out_back', 'number', ['number']) : null,
//             easeInOutQuart: has('anim_ease_in_out_quart') ? w('anim_ease_in_out_quart', 'number', ['number']) : null,
//             lerp: has('anim_lerp') ? w('anim_lerp', 'number', ['number', 'number', 'number']) : null,
//         };
//     } catch { return null; }
// };

// const initWasmApi = () => {
//     if (!window.Module?.cwrap) return null;
//     const has = (n) => typeof window.Module[`_${n}`] === 'function';
//     if (!has('portfoliofx_init')) return null;
//     try {
//         const w = window.Module.cwrap;
//         return {
//             fx: {
//                 init: w('portfoliofx_init', null, ['number', 'number', 'number', 'number']),
//                 resize: w('portfoliofx_resize', null, ['number', 'number', 'number']),
//                 setPointer: w('portfoliofx_set_pointer', null, ['number', 'number']),
//                 setIsTouch: w('portfoliofx_set_is_touch', null, ['number']),
//                 step: w('portfoliofx_step', null, ['number']),
//                 getMx: w('portfoliofx_get_spotlight_mx', 'number', []),
//                 getMy: w('portfoliofx_get_spotlight_my', 'number', []),
//                 getParticleCount: w('portfoliofx_get_particle_count', 'number', []),
//                 getParticleStride: w('portfoliofx_get_particles_stride_floats', 'number', []),
//                 getParticlesPtr: w('portfoliofx_get_particles_ptr', 'number', []),
//             },
//         };
//     } catch { return null; }
// };

// const initUnifiedApi = () => {
//     if (!window.Module?.cwrap) return null;
//     const has = (n) => typeof window.Module[`_${n}`] === 'function';
//     if (!has('unified_sim_init')) return null;
//     try {
//         const w = window.Module.cwrap;
//         return {
//             init: w('unified_sim_init', null, ['number', 'number', 'number']),
//             step: w('unified_sim_step', null, ['number', 'number', 'number', 'number', 'number', 'number']),
//             getCursorCount: w('unified_sim_get_cursor_count', 'number', []),
//             getCursorStride: w('unified_sim_get_cursor_stride', 'number', []),
//             getCursorPtr: w('unified_sim_get_cursor_ptr', 'number', []),
//             getShapeCount: w('unified_sim_get_shape_count', 'number', []),
//             getShapeStride: w('unified_sim_get_shape_stride', 'number', []),
//             getShapePtr: w('unified_sim_get_shape_ptr', 'number', []),
//             getSpringCount: w('unified_sim_get_spring_count', 'number', []),
//             getSpringStride: w('unified_sim_get_spring_stride', 'number', []),
//             getSpringPtr: w('unified_sim_get_spring_ptr', 'number', []),
//             triggerSpring: w('unified_sim_trigger_spring', null, ['number', 'number', 'number']),
//         };
//     } catch { return null; }
// };

// const initStressApi = () => {
//     if (!window.Module?.cwrap) return null;
//     const has = (n) => typeof window.Module[`_${n}`] === 'function';
//     if (!has('domanim_init')) return null;
//     try {
//         const w = window.Module.cwrap;
//         return {
//             init: w('domanim_init', null, ['number', 'number']),
//             step: w('domanim_step', null, ['number', 'number', 'number', 'number', 'number']),
//             getCount: w('domanim_get_count', 'number', []),
//             getStride: w('domanim_get_stride_floats', 'number', []),
//             getPtr: w('domanim_get_ptr', 'number', []),
//         };
//     } catch { return null; }
// };

// // ============================================================================
// // WASM-driven Template Animator (glue for `vector2D` animation API)
// // ============================================================================
// const initVector2DAnimApi = () => {
//     if (!window.Module?.cwrap) return null;
//     const has = (n) => typeof window.Module[`_${n}`] === 'function';
//     if (!has('animation_set_points')) return null;
//     try {
//         const w = window.Module.cwrap;
//         return {
//             setPoints: w('animation_set_points', null, ['number', 'number', 'number', 'number']),
//             setDuration: w('animation_set_duration', null, ['number']),
//             step: w('animation_step', null, ['number']),
//             getX: w('animation_get_x', 'number', []),
//             getY: w('animation_get_y', 'number', []),
//             reset: w('animation_reset', null, []),
//         };
//     } catch { return null; }
// };

// // Animate an element from one DOMRect origin to another using WASM math.
// // el: element to move (should be positioned absolute/relative to same container)
// // fromRect/toRect: DOMRect coordinates (use getBoundingClientRect())
// // duration: seconds
// const animateElementBetweenRectsWasm = async (el, fromRect, toRect, duration = 0.48) => {
//     await waitForWasm();

//     // Prefer handle-based API when available
//     const hasHandleApi = window.Module?.cwrap && typeof window.Module[`_animation_handle_create`] === 'function';
//     if (hasHandleApi) {
//         try {
//             const w = window.Module.cwrap;
//             const create = w('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
//             const step = w('animation_handle_step', null, ['number', 'number']);
//             const getX = w('animation_handle_get_x', 'number', ['number']);
//             const getY = w('animation_handle_get_y', 'number', ['number']);
//             const destroy = w('animation_handle_destroy', null, ['number']);

//             const handle = create(fromRect.x, fromRect.y, toRect.x, toRect.y, duration);
//             if (!handle) throw new Error('no-handle');

//             let last = performance.now();
//             return new Promise((res) => {
//                 const loop = (ts) => {
//                     const dt = (ts - last) / 1000;
//                     last = ts;
//                     step(handle, dt);
//                     const x = getX(handle);
//                     const y = getY(handle);
//                     el.style.transform = `translate(${x - fromRect.x}px, ${y - fromRect.y}px)`;
//                     // stop when handle reached end (time >= duration)
//                     // use numeric proximity check
//                     if (Math.abs(x - toRect.x) < 0.5 && Math.abs(y - toRect.y) < 0.5) {
//                         destroy(handle);
//                         return res();
//                     }
//                     requestAnimationFrame(loop);
//                 };
//                 requestAnimationFrame(loop);
//             });
//         } catch (err) {
//             // fallthrough to lower-level API
//         }
//     }

//     // Fallback to the older single-global API if present
//     const api = initVector2DAnimApi();
//     if (api) {
//         api.setPoints(fromRect.x, fromRect.y, toRect.x, toRect.y);
//         api.setDuration(duration);
//         let last = performance.now();
//         return new Promise((res) => {
//             const loop = (ts) => {
//                 const dt = (ts - last) / 1000;
//                 last = ts;
//                 api.step(dt);
//                 const x = api.getX();
//                 const y = api.getY();
//                 el.style.transform = `translate(${x - fromRect.x}px, ${y - fromRect.y}px)`;
//                 if ((api.getX() === toRect.x && api.getY() === toRect.y) || (ts - (last - dt * 1000)) / 1000 >= duration) return res();
//                 requestAnimationFrame(loop);
//             };
//             requestAnimationFrame(loop);
//         });
//     }

//     // Finally fall back to easing API (prefers WASM math via getEasing())
//     let t0 = performance.now();
//     return new Promise((res) => {
//         const ease = getEasing();
//         const loop = (ts) => {
//             const p = Math.min(1, (ts - t0) / (duration * 1000));
//             const x = ease.lerp(fromRect.x, toRect.x, p);
//             const y = ease.lerp(fromRect.y, toRect.y, p);
//             el.style.transform = `translate(${x - fromRect.x}px, ${y - fromRect.y}px)`;
//             if (p < 1) requestAnimationFrame(loop); else res();
//         };
//         requestAnimationFrame(loop);
//     });
// };

// // ============================================================================
// // JS EASING FALLBACKS
// // ============================================================================
// const clamp01 = (x) => Math.max(0, Math.min(1, x));
// const easeInOutCubicJS = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// const easeOutElasticJS = (t) => { t = clamp01(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
// const easeOutBounceJS = (t) => { t = clamp01(t); const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) { t -= 1.5 / d; return n * t * t + .75; } if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + .9375; } t -= 2.625 / d; return n * t * t + .984375; };
// const easeOutBackJS = (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// const easeInOutQuartJS = (t) => { t = clamp01(t); return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };
// const lerpJS = (a, b, t) => a + (b - a) * clamp01(t);

// let _easing = null;
// const getEasing = () => {
//     if (_easing) return _easing;
//     const a = initAnimApi();
//     _easing = {
//         easeInOutCubic: a?.easeInOutCubic || easeInOutCubicJS,
//         easeOutElastic: a?.easeOutElastic || easeOutElasticJS,
//         easeOutBounce: a?.easeOutBounce || easeOutBounceJS,
//         easeOutBack: a?.easeOutBack || easeOutBackJS,
//         easeInOutQuart: a?.easeInOutQuart || easeInOutQuartJS,
//         lerp: a?.lerp || lerpJS,
//         clamp01
//     };
//     return _easing;
// };

// // ============================================================================
// // Auto-rotate templates every 30s (uses CSS crossfade + optional WASM image move)
// // ============================================================================
// const initTemplateRotator = () => {
//     const t1 = document.querySelector('.hero-container');
//     const t2 = document.getElementById('template2');
//     if (!t1 || !t2) return;

//     // Wrap hero container into a template element to unify classes if not already
//     let wrapper1 = t1.closest('.template');
//     if (!wrapper1) {
//         wrapper1 = document.createElement('div');
//         wrapper1.className = 'template is-active';
//         t1.parentNode.insertBefore(wrapper1, t1);
//         wrapper1.appendChild(t1);
//     }
//     // ensure template2 exists and is hidden
//     t2.classList.remove('is-active');

//     const switchTo = async (fromEl, toEl) => {
//         if (fromEl === toEl) return;
//         fromEl.classList.add('is-leaving');
//         fromEl.classList.remove('is-active');
//         toEl.classList.add('is-active');
//         toEl.classList.remove('is-leaving');

//         // optional: animate hero image between rects using WASM math for a smoother perceived transition
//         try {
//             const fromImg = fromEl.querySelector('.image-frame img, .image-frame');
//             const toImg = toEl.querySelector('img, .t2-preview img');
//             if (fromImg && toImg && typeof animateElementBetweenRectsWasm === 'function') {
//                 const fr = fromImg.getBoundingClientRect();
//                 const tr = toImg.getBoundingClientRect();
//                 // visually place a temporary clone and animate it
//                 const clone = fromImg.cloneNode(true);
//                 clone.style.position = 'fixed';
//                 clone.style.left = `${fr.left}px`;
//                 clone.style.top = `${fr.top}px`;
//                 clone.style.width = `${fr.width}px`;
//                 clone.style.height = `${fr.height}px`;
//                 clone.style.margin = '0';
//                 clone.style.zIndex = 99999;
//                 document.body.appendChild(clone);
//                 await animateElementBetweenRectsWasm(clone, fr, tr, 0.48);
//                 clone.remove();
//             }
//         } catch (e) { /* ignore */ }

//         // cleanup leaving state after animation time
//         setTimeout(() => fromEl.classList.remove('is-leaving'), 520);
//     };

//     // initial states
//     wrapper1.classList.add('is-active');
//     t2.classList.remove('is-active');

//     let showingFirst = true;
//     const periodMs = 30000; // 30 seconds
//     setInterval(() => {
//         if (showingFirst) switchTo(wrapper1, t2); else switchTo(t2, wrapper1);
//         showingFirst = !showingFirst;
//     }, periodMs);
// };

// // Initialize rotator after profile loaded and DOM ready
// window.addEventListener('profile-loaded', () => setTimeout(initTemplateRotator, 300));
// document.addEventListener('DOMContentLoaded', () => setTimeout(initTemplateRotator, 600));

// // ============================================================================
// // Math-driven UI animations (prefer WASM easing/math when available)
// // ============================================================================
// const initMathAnimations = () => {
//     const easing = getEasing();
//     const orb = document.getElementById('t2Orb');
//     const heroFrame = document.querySelector('.image-frame');
//     const shapes = Array.from(document.querySelectorAll('.floating-shapes .shape'));

//     if (!orb && !heroFrame && shapes.length === 0) return;

//     let last = performance.now();

//     const tick = (ts) => {
//         const dt = (ts - last) / 1000;
//         last = ts;
//         const now = ts / 1000;

//         // Orb: subtle pulsing + slow orbit offset
//         if (orb) {
//             const freq = 0.35; // Hz
//             const raw = window.MathWasm ? (window.MathWasm.wave(now, Math.PI * 2 * freq, 1, 0) + 1) * 0.5 : (Math.sin(now * Math.PI * 2 * freq) + 1) * 0.5; // 0..1
//             const e = easing.easeInOutCubic(raw);
//             const scale = 0.92 + e * 0.18;
//             const y = -10 * e;
//             orb.style.transform = `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(3)})`;
//             orb.style.filter = `blur(${6 - e * 2}px)`;
//         }

//         // Hero image: gentle bobbing
//         if (heroFrame) {
//             const freqH = 0.22;
//             const rawH = window.MathWasm ? (window.MathWasm.wave(now, Math.PI * 2 * freqH, 1, 0.4) + 1) * 0.5 : (Math.sin(now * Math.PI * 2 * freqH + 0.4) + 1) * 0.5;
//             const eH = easing.easeOutBack(rawH);
//             const y = -6 * eH;
//             heroFrame.style.transform = `translateY(${y.toFixed(2)}px)`;
//         }

//         // Floating shapes: micro parallax using smooth noise-ish motion
//         if (shapes.length) {
//             shapes.forEach((s, i) => {
//                 const phase = (i % 5) * 0.7;
//                 const amp = (5 + (i % 3) * 3);
//                 const freqS = (0.1 + (i % 4) * 0.02) * Math.PI * 2;
//                 const rawS = window.MathWasm ? (window.MathWasm.wave(now, freqS, 1, phase) + 1) * 0.5 : (Math.sin(now * (0.1 + (i % 4) * 0.02) * Math.PI * 2 + phase) + 1) * 0.5;
//                 const eS = easing.lerp ? easing.lerp(0, 1, rawS) : rawS;
//                 const freqTx = (0.05 + (i % 3) * 0.01);
//                 const tx = window.MathWasm ? window.MathWasm.wave(now, freqTx, (amp * 0.6), phase + (Math.PI * 0.5)) : Math.cos(now * freqTx + phase) * (amp * 0.6);
//                 const freqTy = (0.06 + (i % 4) * 0.008);
//                 const ty = window.MathWasm ? window.MathWasm.wave(now, freqTy, (amp * 0.4), phase) : Math.sin(now * freqTy + phase) * (amp * 0.4);
//                 s.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${(rawS - 0.5) * 8}deg)`;
//             });
//         }

//         requestAnimationFrame(tick);
//     };

//     requestAnimationFrame(tick);
// };

// // Start math-driven animations once DOM ready and (optionally) when WASM is ready
// document.addEventListener('DOMContentLoaded', () => setTimeout(initMathAnimations, 400));
// window.addEventListener('vector2d-wasm-ready', () => setTimeout(initMathAnimations, 200));

// // ============================================================================
// // Image Animations (use WASM handle API when available, JS fallback otherwise)
// // ============================================================================
// const initImageAnimations = async () => {
//     const easing = getEasing();
//     const candidates = [];

//     const heroFrame = document.querySelector('.image-frame');
//     const heroImg = document.getElementById('heroImg');
//     const aboutImg = document.getElementById('aboutImg');
//     const t2Preview = document.querySelector('#t2Preview img');
//     const portfolioImgs = Array.from(document.querySelectorAll('.portfolio-item img'));

//     if (heroFrame) candidates.push({ el: heroFrame, amp: 8, dur: 3.2 });
//     if (heroImg) candidates.push({ el: heroImg, amp: 6, dur: 3.6 });
//     if (aboutImg) candidates.push({ el: aboutImg, amp: 6, dur: 3.2 });
//     if (t2Preview) candidates.push({ el: t2Preview, amp: 10, dur: 4.2 });
//     portfolioImgs.slice(0, 12).forEach(img => candidates.push({ el: img, amp: 6 + Math.random() * 6, dur: 3 + Math.random() * 2 }));

//     if (!candidates.length) return;

//     await waitForWasm();
//     const hasHandleApi = window.Module?.cwrap && typeof window.Module[`_animation_handle_create`] === 'function';

//     let create, stepHandle, getY, destroy;
//     if (hasHandleApi) {
//         try {
//             const w = window.Module.cwrap;
//             create = w('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
//             stepHandle = w('animation_handle_step', null, ['number', 'number']);
//             getY = w('animation_handle_get_y', 'number', ['number']);
//             destroy = w('animation_handle_destroy', null, ['number']);
//         } catch (e) {
//             // fallthrough to JS
//             create = null;
//         }
//     }

//     // Try to allocate handles for items up to available slots
//     const allocated = [];
//     const jsItems = [];

//     for (const it of candidates) {
//         const el = it.el;
//         const amp = it.amp;
//         const dur = it.dur;
//         if (create) {
//             // start at y=-amp/2 -> y=amp/2 for gentle bobbing
//             const h = create(0.0, -amp * 0.5, 0.0, amp * 0.5, dur);
//             if (h) {
//                 allocated.push({ el, amp, dur, handle: h });
//                 continue;
//             }
//         }
//         // fallback to JS-driven item
//         jsItems.push({ el, amp, dur, phase: Math.random() * Math.PI * 2, freq: (1 / dur) });
//     }

//     let last = performance.now();
//     const tick = (ts) => {
//         const dt = (ts - last) / 1000; last = ts;
//         const now = ts / 1000;

//         // step WASM handles
//         if (allocated.length && stepHandle) {
//             for (const a of allocated) {
//                 try {
//                     stepHandle(a.handle, dt);
//                     const y = getY(a.handle);
//                     a.el.style.transform = `translateY(${y.toFixed(2)}px)`;
//                 } catch (e) { /* ignore per-frame wasm timing issues */ }
//             }
//         }

//         // JS fallback bobbing
//         if (jsItems.length) {
//             for (const j of jsItems) {
//                 const raw = window.MathWasm ? (window.MathWasm.wave(now, Math.PI * 2 * j.freq, 1, j.phase) + 1) * 0.5 : (Math.sin(now * Math.PI * 2 * j.freq + j.phase) + 1) * 0.5;
//                 const e = easing.easeInOutCubic(raw);
//                 const y = (e - 0.5) * j.amp * 2;
//                 j.el.style.transform = `translateY(${y.toFixed(2)}px)`;
//             }
//         }

//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);

//     // cleanup on unload
//     window.addEventListener('pagehide', () => {
//         if (destroy) allocated.forEach(a => { try { destroy(a.handle); } catch (e) { } });
//     });
// };

// document.addEventListener('DOMContentLoaded', () => setTimeout(initImageAnimations, 600));
// window.addEventListener('vector2d-wasm-ready', () => setTimeout(initImageAnimations, 300));

// // initSeaScene — DISABLED: Three.js water_theme.js now handles phoenix + fish
// const initSeaScene = async () => {
//     // Replaced by water_theme.js Three.js scene
//     return;
// };

// // ============================================================================
// // Profile Image Interactive Rotation (uses WASM vector2D_rotation from C)
// // ============================================================================
// const initProfileImageRotation = async () => {
//     const aboutImage = document.getElementById('aboutImg');
//     if (!aboutImage) return;

//     const imageContainer = aboutImage.closest('.about-image');
//     if (!imageContainer) return;

//     await waitForWasm();
//     const M = window.MathWasm;

//     // Rotation state
//     let targetRotX = 0, targetRotY = 0;
//     let currentRotX = 0, currentRotY = 0;
//     let isHovering = false;
//     let animFrameId = null;

//     // Max rotation angles (degrees)
//     const MAX_ROT = 25;

//     const onMouseMove = (e) => {
//         const rect = imageContainer.getBoundingClientRect();
//         const cx = rect.left + rect.width / 2;
//         const cy = rect.top + rect.height / 2;

//         // Normalized mouse offset from center (-1 to 1)
//         const nx = (e.clientX - cx) / (rect.width / 2);
//         const ny = (e.clientY - cy) / (rect.height / 2);

//         // Clamp to [-1, 1]
//         const clampedX = Math.max(-1, Math.min(1, nx));
//         const clampedY = Math.max(-1, Math.min(1, ny));

//         if (M && M.rotation_x && M.rotation_y) {
//             // Use WASM vector2D_rotation to compute rotated offset
//             // We rotate the (nx, ny) vector by a small angle proportional to distance from center
//             const dist = M.magnitude_xy ? M.magnitude_xy(clampedX, clampedY) : Math.hypot(clampedX, clampedY);
//             const angle = dist * 0.3; // subtle rotation influence from WASM

//             const rotatedX = M.rotation_x(clampedX, clampedY, angle);
//             const rotatedY = M.rotation_y(clampedX, clampedY, angle);

//             // Map to CSS rotation: mouse X → rotateY, mouse Y → rotateX (inverted)
//             targetRotY = rotatedX * MAX_ROT;
//             targetRotX = -rotatedY * MAX_ROT;
//         } else {
//             // JS fallback — same math
//             const angle = Math.hypot(clampedX, clampedY) * 0.3;
//             const cosA = Math.cos(angle), sinA = Math.sin(angle);
//             targetRotY = (clampedX * cosA - clampedY * sinA) * MAX_ROT;
//             targetRotX = -(clampedX * sinA + clampedY * cosA) * MAX_ROT;
//         }

//         isHovering = true;
//         aboutImage.classList.add('wasm-rotating');
//     };

//     const onMouseLeave = () => {
//         isHovering = false;
//         targetRotX = 0;
//         targetRotY = 0;
//     };

//     // Smooth animation loop
//     const smoothFactor = 0.12;
//     const returnFactor = 0.06;

//     const tick = () => {
//         const factor = isHovering ? smoothFactor : returnFactor;

//         if (M && M.lerp) {
//             // WASM lerp unused here because it clamps t 0–1; we need it as raw factor
//         }

//         currentRotX += (targetRotX - currentRotX) * factor;
//         currentRotY += (targetRotY - currentRotY) * factor;

//         // Apply transform
//         aboutImage.style.transform = `perspective(800px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

//         // Remove class when returned to rest
//         if (!isHovering && Math.abs(currentRotX) < 0.05 && Math.abs(currentRotY) < 0.05) {
//             currentRotX = 0;
//             currentRotY = 0;
//             aboutImage.style.transform = '';
//             aboutImage.classList.remove('wasm-rotating');
//         }

//         animFrameId = requestAnimationFrame(tick);
//     };

//     imageContainer.addEventListener('mousemove', onMouseMove);
//     imageContainer.addEventListener('mouseleave', onMouseLeave);

//     // Touch support for mobile
//     imageContainer.addEventListener('touchmove', (e) => {
//         if (e.touches.length === 1) {
//             const touch = e.touches[0];
//             onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
//         }
//     }, { passive: true });
//     imageContainer.addEventListener('touchend', onMouseLeave);

//     animFrameId = requestAnimationFrame(tick);
//     console.log('✅ Profile image WASM rotation initialized');
// };

// document.addEventListener('DOMContentLoaded', () => setTimeout(initProfileImageRotation, 500));
// window.addEventListener('vector2d-wasm-ready', () => setTimeout(initProfileImageRotation, 300));


// // WASM-driven SVG wave animator — replaces CSS keyframes for smoother, continuous waves
// const initWasmWaves = async () => {
//     const paths = Array.from(document.querySelectorAll('.section-wave svg path, .sea-waves path'));
//     if (!paths.length) return;
//     await waitForWasm();

//     // safe cwrap for anim_wave
//     const safeCwrap = (name) => {
//         try { return (window.Module && typeof window.Module.cwrap === 'function') ? window.Module.cwrap(name, 'number', ['number', 'number', 'number', 'number']) : null; } catch (e) { return null; }
//     };
//     const wasmWave = safeCwrap('anim_wave') || null;

//     // Per-path parsed data: original command tokens and indices of Y values to offset
//     const parsed = paths.map(p => {
//         const d = p.getAttribute('d') || '';
//         // tokenise: keep commands and numbers
//         const tokens = d.replace(/,/g, ' ').trim().split(/(\s+|(?=[A-Za-z])|(?<=[A-Za-z]))/).filter(t => t && !/^\s+$/.test(t));
//         // Extract numeric sequence and remember which indexes are Y values (every second number after an X)
//         const numMatches = d.match(/-?\d*\.?\d+/g) || [];
//         const nums = numMatches.map(n => parseFloat(n));
//         // Determine indices in the numbers array that correspond to Y (assume pairs x,y)
//         const yIndices = [];
//         for (let i = 0; i < nums.length; i++) {
//             if (i % 2 === 1) yIndices.push(i);
//         }
//         // Store original numbers and the raw d template where we will replace numbers by index markers
//         // Create a template by replacing each numeric occurrence with placeholder like {0}
//         let idx = 0;
//         const template = d.replace(/-?\d*\.?\d+/g, () => `{${idx++}}`);
//         return { el: p, template, nums, yIndices };
//     });

//     const width = () => Math.max(320, window.innerWidth || 960);

//     let last = performance.now();
//     const tick = (ts) => {
//         const t = ts / 1000;
//         const w = width();
//         for (const entry of parsed) {
//             const { el, template, nums: origNums, yIndices } = entry;
//             const nums = origNums.slice();
//             // compute offset for each Y by sampling wave at normalized X
//             for (const yi of yIndices) {
//                 const xIndex = yi - 1;
//                 const x = (nums[xIndex] || 0);
//                 const nx = (x / Math.max(1, w));
// const amp = 30 + (1 - nx) * 35;  // was 18 + (1-nx)*22
// const freq = 1.8 + nx * 2.0;     // was 1.2 + nx * 1.4
//                 const phase = nx * Math.PI * 2;
//                 let sample = 0;
//                 try {
//                     if (wasmWave) sample = wasmWave(t, Math.PI * 2 * freq, 1, phase);
//                     else sample = Math.sin(t * Math.PI * 2 * freq + phase);
//                 } catch (e) { sample = Math.sin(t * Math.PI * 2 * freq + phase); }
//                 const offset = sample * amp;
//                 nums[yi] = origNums[yi] + offset;
//             }
//             // Rebuild the d string from template
//             const dNext = template.replace(/\{(\d+)\}/g, (_, n) => Number(nums[Number(n)]).toFixed(2));
//             el.setAttribute('d', dNext);
//         }
//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// document.addEventListener('DOMContentLoaded', () => setTimeout(initWasmWaves, 200));
// window.addEventListener('vector2d-wasm-ready', () => setTimeout(initWasmWaves, 300));

// // ============================================================================
// // BUBBLE LAYER (WASM-driven)
// // Uses animation_handle_create/step/getX/getY to move bubbles from bottom->top
// // ============================================================================
// const initBubbleLayer = async (opts = {}) => {
//     const canvas = document.getElementById('bubbleLayer');
//     if (!canvas) return;
//     await waitForWasm();
//     if (!window.Module || typeof window.Module.cwrap !== 'function') return;

//     const w = () => window.innerWidth;
//     const h = () => window.innerHeight;

//     const ctx = canvas.getContext('2d');
//     const dpr = Math.min(window.devicePixelRatio || 1, 2);
//     let cw = 0, ch = 0;

//     const resize = () => {
//         cw = w(); ch = h();
//         canvas.width = cw * dpr; canvas.height = ch * dpr;
//         canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
//         ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//     };
//     window.addEventListener('resize', resize, { passive: true });
//     resize();

//     const cwrap = window.Module.cwrap;
//     const create = cwrap('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
//     const stepHandle = cwrap('animation_handle_step', null, ['number', 'number']);
//     const getX = cwrap('animation_handle_get_x', 'number', ['number']);
//     const getY = cwrap('animation_handle_get_y', 'number', ['number']);
//     const destroy = (typeof window.Module._animation_handle_destroy === 'function') ? cwrap('animation_handle_destroy', null, ['number']) : null;
//     if (!create || !stepHandle || !getX || !getY) return;

//     const bubbles = [];
//     const POP_COUNT = opts.count || 18;

//     const makeBubble = (index) => {
//         const startX = Math.random() * cw;
//         const startY = ch + (Math.random() * 80 + 20);
//         const endX = startX + (Math.random() * 80 - 40);
//         const endY = -50 - Math.random() * 60;
//         const duration = 6 + Math.random() * 6; // seconds
//         const radius = 4 + Math.random() * 10;
//         const handle = create(startX, startY, endX, endY, duration);
//         return { handle, radius, hue: 190 + Math.random() * 40, alpha: 0.08 + Math.random() * 0.35 };
//     };

//     for (let i = 0; i < POP_COUNT; i++) {
//         bubbles.push(makeBubble(i));
//     }

//     let last = performance.now();
//     const tick = (ts) => {
//         const dt = (ts - last) / 1000; last = ts;
//         ctx.clearRect(0, 0, cw, ch);

//         // draw subtle light shafts overlay slightly up top
//         ctx.save();
//         ctx.globalCompositeOperation = 'lighter';
//         ctx.fillStyle = 'rgba(12,40,70,0.02)';
//         ctx.fillRect(0, 0, cw, ch * 0.6);
//         ctx.restore();

//         for (const b of bubbles) {
//             try {
//                 stepHandle(b.handle, dt);
//                 const x = getX(b.handle);
//                 const y = getY(b.handle);
//                 // draw bubble bloom + rim
//                 const grd = ctx.createRadialGradient(x - b.radius * 0.3, y - b.radius * 0.3, 0, x, y, b.radius * 1.8);
//                 grd.addColorStop(0, `rgba(255,255,255,${Math.min(0.9, b.alpha * 2)})`);
//                 grd.addColorStop(0.6, `hsla(${b.hue},80%,70%,${b.alpha})`);
//                 grd.addColorStop(1, `hsla(${b.hue},80%,50%,0)`);
//                 ctx.fillStyle = grd;
//                 ctx.beginPath(); ctx.arc(x, y, b.radius * 1.6, 0, Math.PI * 2); ctx.fill();
//                 // crisp rim
//                 ctx.beginPath(); ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.95, b.alpha * 0.8)})`; ctx.lineWidth = 1; ctx.arc(x, y, b.radius, 0, Math.PI * 2); ctx.stroke();

//                 // Reset if out of bounds (top)
//                 if (y < -80 || x < -200 || x > cw + 200) {
//                     // destroy & replace handle
//                     if (destroy) try { destroy(b.handle); } catch (e) { }
//                     const nb = makeBubble(0);
//                     b.handle = nb.handle; b.radius = nb.radius; b.hue = nb.hue; b.alpha = nb.alpha;
//                 }
//             } catch (e) { /* ignore per-frame errors */ }
//         }

//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);

//     window.addEventListener('pagehide', () => {
//         try { if (destroy) bubbles.forEach(b => { try { destroy(b.handle); } catch (e) { } }); } catch (e) { }
//     });
// };

// // document.addEventListener('DOMContentLoaded', () => setTimeout(() => initBubbleLayer({ count: 18 }), 900));
// // window.addEventListener('vector2d-wasm-ready', () => setTimeout(() => initBubbleLayer({ count: 18 }), 400));

// waitForWasm().then(async () => { _easing = null; getEasing(); try { await initMathWasmBindings(); } catch (e) { } }).catch(() => { });

// // ============================================================================
// // OPACITY ANIMATION HELPERS
// // ============================================================================
// const animateOpacityTo = async (el, from, to, ms = 220) => {
//     if (!el) return;
//     return runWasmOnlyOrFinalize(() => {
//         const ease = getEasing().easeInOutCubic;
//         el.style.transition = 'none';
//         el.style.opacity = String(from);
//         const t0 = performance.now();
//         return new Promise(res => {
//             const tick = (ts) => {
//                 const p = clamp01((ts - t0) / ms);
//                 el.style.opacity = String(from + (to - from) * ease(p));
//                 p < 1 ? requestAnimationFrame(tick) : res();
//             };
//             requestAnimationFrame(tick);
//         });
//     }, () => { el.style.opacity = String(to); });
// };
// const animateOpacityIn = async (el, ms = 220) => {
//     if (!el) return;
//     el.classList.remove('img-ready');
//     await animateOpacityTo(el, 0, 1, ms);
//     el.style.transition = ''; el.style.opacity = '';
//     el.classList.add('img-ready');
// };
// const animateOpacityOut = async (el, ms = 160) => {
//     if (!el) return;
//     const cur = parseFloat(getComputedStyle(el).opacity || '1');
//     return animateOpacityTo(el, isFinite(cur) ? cur : 1, 0, ms);
// };

// // ============================================================================
// // 1. LOADING SCREEN
// // ============================================================================
// const initLoadingScreen = () => {
//     const screen = byId('loadingScreen');
//     if (!screen) return;
//     const hide = () => {
//         screen.classList.add('hidden');
//         setTimeout(() => { screen.style.display = 'none'; }, 900);
//     };
//     // Wait for either window load or 2.5s max
//     if (document.readyState === 'complete') setTimeout(hide, 800);
//     else {
//         window.addEventListener('load', () => setTimeout(hide, 600));
//         setTimeout(hide, 2500);
//     }
// };

// // ============================================================================
// // 2. CURSOR PARTICLE TRAIL
// // ============================================================================
// const initCursorTrail = () => {
//     // Only used as a hook for the canvas-to-WASM-rendering bridge
//     const canvas = byId('cursorTrail');
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d', { alpha: true });
//     if (!ctx) return;

//     const dpr = Math.min(window.devicePixelRatio || 1, 2);
//     let w = 0, h = 0;

//     const resize = () => {
//         w = window.innerWidth; h = window.innerHeight;
//         canvas.width = w * dpr; canvas.height = h * dpr;
//         canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
//         ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//     };

//     window.addEventListener('resize', resize, { passive: true });
//     resize();

//     // Register canvas for the unified loop
//     window.__cursorCanvasCtx = ctx;
//     window.__cursorCanvasRes = { w, h };
// };

// // ============================================================================
// // 3. SCROLL PROGRESS BAR
// // ============================================================================
// const initScrollProgress = () => {
//     const bar = byId('scrollProgress');
//     if (!bar) return;
//     const update = () => {
//         const y = window.scrollY || 0;
//         const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
//         bar.style.width = `${Math.max(0, Math.min(100, (y / max) * 100))}%`;
//     };
//     window.addEventListener('scroll', update, { passive: true });
//     update();
// };

// // ============================================================================
// // 4. NAVBAR SCROLL MORPH
// // ============================================================================
// const initNavbarMorph = () => {
//     const navbar = byId('navbar');
//     if (!navbar) return;
//     let scrolled = false;
//     const update = () => {
//         const now = (window.scrollY || 0) > 50;
//         if (now !== scrolled) { scrolled = now; navbar.classList.toggle('scrolled', scrolled); }
//     };
//     window.addEventListener('scroll', update, { passive: true });
//     update();
// };

// // ============================================================================
// // 5. SECTION REVEAL ON SCROLL
// // ============================================================================
// const initSectionReveal = () => {
//     const sels = [
//         '.section-header', '.hero-content', '.hero-image',
//         '.about-image', '.about-info',
//         '.service-card', '.portfolio-item',
//         '.contact-content', '.info-item',
//         '.download-cv', '.social-links',
//     ];
//     const targets = $$(sels.join(','));
//     targets.forEach(el => {
//         if (el.classList.contains('anim-reveal')) return;
//         el.classList.add('anim-reveal');
//     });
//     $$('.about-image').forEach(el => el.classList.add('from-left'));
//     $$('.about-info').forEach(el => el.classList.add('from-right'));

//     const io = new IntersectionObserver((entries) => {
//         for (const e of entries) {
//             if (e.isIntersecting) e.target.classList.add('revealed');
//         }
//     }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
//     $$('.anim-reveal').forEach(el => io.observe(el));
// };

// // ============================================================================
// // 6. HERO CHARACTER SPLIT ANIMATION
// // ============================================================================
// const initHeroCharSplit = () => {
//     const nameEl = byId('heroName');
//     if (!nameEl || nameEl.dataset.charSplit) return;
//     nameEl.dataset.charSplit = '1';
//     const text = nameEl.textContent.trim();
//     if (!text) return;
//     nameEl.innerHTML = '';
//     // Color palette to cycle through for each non-space character
//     const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
//     let ci = 0;
//     for (let i = 0; i < text.length; i++) {
//         if (text[i] === ' ') {
//             const sp = document.createElement('span');
//             sp.className = 'anim-char-space';
//             nameEl.appendChild(sp);
//         } else {
//             const span = document.createElement('span');
//             span.className = 'anim-char';
//             span.textContent = text[i];
//             span.style.transitionDelay = `${ci * 60}ms`;
//             // apply repeating color pattern (1,2,3,4,1,...)
//             span.style.color = colors[ci % colors.length];
//             nameEl.appendChild(span);
//             ci++;
//         }
//     }
//     // Immediately show characters when not using JS-only animations
//     nameEl.querySelectorAll('.anim-char').forEach(c => c.classList.add('visible'));
// };


// // ============================================================================
// // 7. TEXT SCRAMBLE EFFECT (section titles)
// // ============================================================================
// const initTextScramble = () => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
//     const els = $$('[data-scramble]');

//     els.forEach(el => {
//         if (el.dataset.scrambleDone) return;
//         const original = el.textContent;
//         el.dataset.scrambleOriginal = original;

//         const io = new IntersectionObserver((entries) => {
//             for (const entry of entries) {
//                 if (entry.isIntersecting && !el.dataset.scrambleDone) {
//                     el.dataset.scrambleDone = '1';
//                     scrambleText(el, original, chars);
//                     io.disconnect();
//                 }
//             }
//         }, { threshold: 0.5 });

//         io.observe(el);
//     });
// };

// const scrambleText = (el, target, chars) => {
//     const duration = 1200;
//     const t0 = performance.now();
//     el.classList.add('scrambling');

//     const tick = (ts) => {
//         const p = clamp01((ts - t0) / duration);
//         const revealedCount = Math.floor(p * target.length);
//         let result = '';

//         for (let i = 0; i < target.length; i++) {
//             if (i < revealedCount) {
//                 result += target[i];
//             } else if (target[i] === ' ') {
//                 result += ' ';
//             } else {
//                 result += chars[Math.floor(Math.random() * chars.length)];
//             }
//         }

//         el.textContent = result;

//         if (p < 1) {
//             requestAnimationFrame(tick);
//         } else {
//             el.textContent = target;
//             el.classList.remove('scrambling');
//         }
//     };

//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 8. HERO TYPING EFFECT
// // ============================================================================
// const startHeroTypingEffect = async () => {
//     const lines = [
//         { el: byId('heroSubtitle'), delayMs: 0 },
//         { el: byId('heroTagline'), delayMs: 500 },
//         { el: byId('heroDescription'), delayMs: 900 },
//     ].filter(x => x.el);

//     for (const { el } of lines) {
//         if (el.dataset.fullText) continue;
//         el.dataset.fullText = (el.textContent || '').trimEnd();
//         el.textContent = '';
//     }

//     // When removing JS-only animations, simply reveal full text immediately
//     for (const { el } of lines) {
//         const full = el.dataset.fullText || '';
//         el.textContent = full;
//     }
// };

// // ============================================================================
// // 9. HERO IMAGE 3D PARALLAX TILT
// // ============================================================================
// const initHeroTilt = () => {
//     const frame = byId('heroFrame');
//     const hero = frame?.closest('.hero');
//     if (!frame || !hero) return;
//     if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) return; // disable JS-only tilt when forcing WASM-only
//     let trx = 0, try_ = 0, crx = 0, cry = 0;

//     hero.addEventListener('mousemove', (e) => {
//         const r = frame.getBoundingClientRect();
//         const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
//         try_ = ((e.clientX - cx) / (r.width / 2)) * 15;
//         trx = -((e.clientY - cy) / (r.height / 2)) * 15;
//         trx = Math.max(-15, Math.min(15, trx));
//         try_ = Math.max(-15, Math.min(15, try_));
//     }, { passive: true });

//     hero.addEventListener('mouseleave', () => { trx = 0; try_ = 0; }, { passive: true });

//     // Use WASM exponential smoothing when available for crx/cry (lower-cost than JS lerp in hot loops)
//     let lastT = performance.now();
//     const tick = (ts) => {
//         const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000));
//         lastT = ts;
//         if (window.MathWasm && typeof window.MathWasm.expSmooth === 'function') {
//             crx = window.MathWasm.expSmooth(crx, trx, 60.0, dt);
//             cry = window.MathWasm.expSmooth(cry, try_, 60.0, dt);
//         } else {
//             crx += (trx - crx) * 0.06;
//             cry += (try_ - cry) * 0.06;
//         }
//         frame.style.transform = `perspective(800px) rotateX(${crx}deg) rotateY(${cry}deg)`;
//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 10. SERVICE CARD 3D TILT ON HOVER
// // ============================================================================
// const initServiceCardTilt = () => {
//     if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) return; // disable if forcing WASM-only and WASM not ready
//     $$('.service-card').forEach(card => {
//         if (!card.querySelector('.tilt-card-light')) {
//             const light = document.createElement('div');
//             light.className = 'tilt-card-light';
//             card.appendChild(light);
//         }
//         card.addEventListener('mousemove', (e) => {
//             const r = card.getBoundingClientRect();
//             const x = (e.clientX - r.left) / r.width;
//             const y = (e.clientY - r.top) / r.height;
//             card.style.transform = `perspective(600px) rotateX(${(y - 0.5) * -18}deg) rotateY(${(x - 0.5) * 18}deg) scale(1.05)`;
//             card.style.setProperty('--light-x', `${x * 100}%`);
//             card.style.setProperty('--light-y', `${y * 100}%`);
//         }, { passive: true });
//         card.addEventListener('mouseleave', () => { card.style.transform = ''; }, { passive: true });
//     });
// };

// // ============================================================================
// // 11. MAGNETIC BUTTONS
// // ============================================================================
// const initMagneticButtons = () => {
//     if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) return; // disable JS-only magnetic effect
//     $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
//         btn.addEventListener('mousemove', (e) => {
//             const r = btn.getBoundingClientRect();
//             const x = e.clientX - r.left - r.width / 2;
//             const y = e.clientY - r.top - r.height / 2;
//             btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.04)`;
//             btn.style.setProperty('--bx', `${((e.clientX - r.left) / r.width) * 100}%`);
//             btn.style.setProperty('--by', `${((e.clientY - r.top) / r.height) * 100}%`);
//         }, { passive: true });
//         btn.addEventListener('mouseleave', () => { btn.style.transform = ''; }, { passive: true });
//     });
// };

// // ============================================================================
// // 12. BUTTON CLICK RIPPLE EFFECT
// // ============================================================================
// const initButtonRipple = () => {
//     $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             // If forcing WASM-only animations and WASM not available, don't create JS ripple
//             if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) return;
//             const r = btn.getBoundingClientRect();
//             const ripple = document.createElement('span');
//             ripple.className = 'btn-ripple';
//             const size = Math.max(r.width, r.height) * 2;
//             ripple.style.width = ripple.style.height = `${size}px`;
//             ripple.style.left = `${e.clientX - r.left - size / 2}px`;
//             ripple.style.top = `${e.clientY - r.top - size / 2}px`;
//             btn.appendChild(ripple);
//             setTimeout(() => ripple.remove(), 700);
//         });
//     });
// };

// // ============================================================================
// // DOWNLOAD CV CONFIRMATION MODAL
// // ============================================================================
// const initDownloadCv = () => {
//     const cvHref = '../assets/Pratik_Maharjan_CV.pdf';

//     const showConfirm = () => {
//         if (document.getElementById('cvDownloadConfirm')) return;
//         const overlay = document.createElement('div');
//         overlay.id = 'cvDownloadConfirm';
//         overlay.className = 'cv-modal-overlay';
//         overlay.innerHTML = `
//             <div class="cv-modal" role="dialog" aria-modal="true" aria-labelledby="cvModalTitle">
//                 <h3 id="cvModalTitle">Download CV</h3>
//                 <p>Do you want to download this CV?</p>
//                 <div class="cv-modal-actions">
//                     <button class="cv-yes">Yes</button>
//                     <button class="cv-no">No</button>
//                 </div>
//             </div>`;

//         document.body.appendChild(overlay);

//         const yes = overlay.querySelector('.cv-yes');
//         const no = overlay.querySelector('.cv-no');

//         const close = () => { overlay.remove(); };

//         yes.addEventListener('click', () => {
//             // trigger download
//             const a = document.createElement('a');
//             a.href = cvHref;
//             a.setAttribute('download', 'Pratik_Maharjan_CV.pdf');
//             a.target = '_blank';
//             a.rel = 'noopener noreferrer';
//             document.body.appendChild(a);
//             a.click();
//             a.remove();
//             close();
//         });

//         no.addEventListener('click', () => { close(); });

//         // close when clicking outside modal
//         overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
//     };

//     $$('.download-cv').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.preventDefault();
//             showConfirm();
//         });
//     });
// };

// // ============================================================================
// // CONTACT REDIRECT + SUCCESS POPUP
// // ============================================================================
// const showContactSuccessPopup = () => {
//     if (document.getElementById('contactSuccessPopup')) return;
//     const overlay = document.createElement('div');
//     overlay.id = 'contactSuccessPopup';
//     overlay.className = 'cv-modal-overlay';
//     overlay.innerHTML = `
//         <div class="cv-modal" role="dialog" aria-modal="true" aria-labelledby="contactSuccessTitle">
//             <h3 id="contactSuccessTitle">Message Sent</h3>
//             <p>We received your email — thank you for contacting us.</p>
//             <div class="cv-modal-actions">
//                 <button class="cv-ok">OK</button>
//             </div>
//         </div>`;

//     document.body.appendChild(overlay);

//     const ok = overlay.querySelector('.cv-ok');
//     const close = () => { overlay.remove(); };
//     ok.addEventListener('click', close, { once: true });
//     overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
// };

// const initContactRedirect = () => {
//     const form = byId('contactForm');
//     if (!form) return;
//     // ensure FormSubmit redirects back to this page in the same tab
//     form.removeAttribute('target');
//     form.addEventListener('submit', () => {
//         try {
//             const nextUrl = window.location.origin + window.location.pathname + '?sent=1';
//             let nextInput = form.querySelector('input[name="_next"]');
//             if (!nextInput) {
//                 nextInput = document.createElement('input');
//                 nextInput.type = 'hidden';
//                 nextInput.name = '_next';
//                 form.appendChild(nextInput);
//             }
//             nextInput.value = nextUrl;
//         } catch (err) { /* ignore */ }
//         // allow default submission to proceed (browser will follow FormSubmit redirect)
//     });
// };

// // ============================================================================
// // 13. ABOUT TYPING ON VIEW
// // ============================================================================
// const initAboutTypingOnView = () => {
//     const section = byId('about');
//     if (!section) return;
//     const desc = byId('aboutDescription');
//     const vals = Array.from(section.querySelectorAll('.info-value'));
//     let started = false;

//     const start = () => {
//         if (started) return;
//         started = true;
//         const items = [];
//         if (desc) items.push({ el: desc, delayMs: 0, perCharMs: 18 });
//         vals.forEach((el, i) => items.push({ el, delayMs: 260 + i * 120, perCharMs: 24 }));
//         typingEffect(items);
//     };

//     const io = new IntersectionObserver((entries) => {
//         for (const e of entries) { if (e.isIntersecting) { start(); io.disconnect(); break; } }
//     }, { threshold: 0.18 });
//     io.observe(section);
// };

// const typingEffect = (items) => {
//     const targets = (items || []).filter(i => i?.el);
//     for (const it of targets) {
//         if (it.el.dataset.fullText) continue;
//         it.el.dataset.fullText = (it.el.textContent || '').trimEnd();
//         it.el.textContent = '';
//             const h = it.el.getBoundingClientRect().height;
//     if (h > 0) it.el.style.minHeight = h + 'px';
//     it.el.textContent = '';
//     }
//     // If forcing WASM-only animations but WASM not available, reveal immediately
//     if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) {
//         targets.forEach(it => { it.el.textContent = it.el.dataset.fullText || it.el.textContent || ''; });
//         return;
//     }
//     const ease = getEasing().easeInOutCubic;
//     const t0 = performance.now();

//     const tick = (ts) => {
//         let active = false;
//         for (const it of targets) {
//             const full = it.el.dataset.fullText || '';
//             if (!full) continue;
//             const local = ts - (t0 + (it.delayMs || 0));
//             if (local < 0) { active = true; continue; }
//             const dur = Math.max(520, Math.min(3800, full.length * (it.perCharMs || 30)));
//             const p = clamp01(local / dur);
//             it.el.textContent = full.slice(0, Math.floor(ease(p) * full.length));
//             if (p < 1) active = true;
//         }
//         if (active) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 14. ABOUT IMAGE SCROLL PARALLAX
// // ============================================================================
// const initAboutParallax = () => {
//     const img = $('.about-image img');
//     if (!img) return;
//     const update = () => {
//         const r = img.getBoundingClientRect();
//         const vis = clamp01(1 - r.top / window.innerHeight);
//         img.style.transform = `translateY(${(vis - 0.5) * -40}px)`;
//     };
//     window.addEventListener('scroll', update, { passive: true });
//     update();
// };

// // ============================================================================
// // 15. FOOTER SOCIAL SPRING-IN
// // ============================================================================
// const initFooterSpringIn = () => {
//     const container = byId('socialLinks');
//     if (!container) return;
//     const icons = Array.from(container.querySelectorAll('a'));
//     icons.forEach(i => { i.style.opacity = '0'; i.style.transform = 'translateY(40px) scale(0.3) rotate(-20deg)'; });
//     if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) {
//         // Show immediately if not using JS-only animations
//         icons.forEach(i => { i.style.opacity = ''; i.style.transform = ''; });
//         return;
//     }

//     const io = new IntersectionObserver((entries) => {
//         for (const e of entries) {
//             if (e.isIntersecting) {
//                 icons.forEach((icon, i) => setTimeout(() => springIn(icon), i * 100));
//                 io.disconnect(); break;
//             }
//         }
//     }, { threshold: 0.3 });
//     io.observe(container);
// };

// const springIn = (el) => {
//     return runWasmOnlyOrFinalize(() => {
//         const ease = getEasing().easeOutElastic;
//         const t0 = performance.now();
//         const dur = 1000;
//         const tick = (ts) => {
//             const p = clamp01((ts - t0) / dur);
//             const e = ease(p);
//             el.style.opacity = String(Math.min(1, p * 3));
//             el.style.transform = `translateY(${(1 - e) * 40}px) scale(${0.3 + e * 0.7}) rotate(${(1 - e) * -20}deg)`;
//             if (p < 1) requestAnimationFrame(tick);
//             else { el.style.opacity = ''; el.style.transform = ''; }
//         };
//         requestAnimationFrame(tick);
//     }, () => { el.style.opacity = ''; el.style.transform = ''; });
// };

// // ============================================================================
// // 16. CONTACT FIELD STAGGER ENTRANCE
// // ============================================================================
// const initContactFieldStagger = () => {
//     const form = byId('contactForm');
//     if (!form) return;
//     const fields = Array.from(form.querySelectorAll('input, textarea, button'));
//     fields.forEach(f => { f.style.opacity = '0'; f.style.transform = 'translateY(30px) scale(0.95)'; });

//     const io = new IntersectionObserver((entries) => {
//         for (const e of entries) {
//             if (e.isIntersecting) {
//                 // If WASM-only mode and WASM not available, set final styles immediately
//                 if (WASM_ONLY_ANIM && !(window.Module && typeof window.Module.cwrap === 'function')) {
//                     fields.forEach(f => { f.style.opacity = ''; f.style.transform = ''; });
//                     io.disconnect(); break;
//                 }
//                 fields.forEach((f, i) => setTimeout(() => {
//                     const ease = getEasing().easeOutBack;
//                     const t0 = performance.now();
//                     const tick = (ts) => {
//                         const p = clamp01((ts - t0) / 650);
//                         f.style.opacity = String(Math.min(1, p * 2.5));
//                         f.style.transform = `translateY(${(1 - ease(p)) * 30}px) scale(${0.95 + ease(p) * 0.05})`;
//                         if (p < 1) requestAnimationFrame(tick);
//                         else { f.style.opacity = ''; f.style.transform = ''; }
//                     };
//                     requestAnimationFrame(tick);
//                 }, i * 90));
//                 io.disconnect(); break;
//             }
//         }
//     }, { threshold: 0.2 });
//     io.observe(form);
// };

// // ============================================================================
// // 17. SCROLL VELOCITY INDICATOR
// // ============================================================================
// const initScrollVelocity = () => {
//     const bar = document.createElement('div');
//     bar.className = 'scroll-velocity-bar';
//     document.body.appendChild(bar);

//     let lastY = window.scrollY, lastT = performance.now();
//     let velocity = 0;

//     const tick = (ts) => {
//         const y = window.scrollY;
//         const dt = Math.max(1, ts - lastT);
//         const v = Math.abs(y - lastY) / dt * 16; // normalize to 60fps
//         velocity += (v - velocity) * 0.15;

//         lastY = y;
//         lastT = ts;

//         const pct = Math.min(40, velocity * 3);
//         bar.style.height = `${pct}%`;
//         bar.classList.toggle('active', velocity > 0.5);

//         requestAnimationFrame(tick);
//     };

//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 18. FLOATING SHAPES CURSOR REPEL
// // ============================================================================
// const initInteractiveTitles = () => {
//     // Collect titles and subtitles for the jumping effect
//     const titles = $$('.section-title, .section-subtitle, .hero-title, .hero-subtitle');
//     if (!titles.length) return;
//     window.__interactiveTitles = titles;
// };

// const initShapeRepel = () => {
//     window.__floatingShapes = $$('.shape');
// };

// // ============================================================================
// // 19. UNIFIED SIMULATION SYSTEM (Performance Core)
// // ============================================================================
// const initUnifiedSimulation = async () => {
//     await waitForWasm();
//     const api = initUnifiedApi();
//     if (!api) return;

//     const w = window.innerWidth, h = window.innerHeight;
//     api.init(w | 0, h | 0, (Date.now() & 0x7fffffff) | 0);

//     let mouseX = -100, mouseY = -100;
//     window.addEventListener('mousemove', (e) => {
//         mouseX = e.clientX; mouseY = e.clientY;
//     }, { passive: true });

//     // Register interactive titles for spring triggering
//     const titles = window.__interactiveTitles || [];
//     titles.forEach((el, i) => {
//         el.addEventListener('mouseenter', () => {
//             // Trigger a vertical "jump" (negative vy) and slight horizontal wobble
//             api.triggerSpring(i, (Math.random() - 0.5) * 100, -800);
//         });
//     });

//     let lastT = performance.now();

//     const tick = (ts) => {
//         const dt = Math.min(0.05, (ts - lastT) / 1000);
//         lastT = ts;

//         const cw = window.innerWidth, ch = window.innerHeight;
//         api.step(dt, ts / 1000, mouseX, mouseY, cw | 0, ch | 0);

//         // 1. Draw Particles
//         const ctx = window.__cursorCanvasCtx;
//         if (ctx) {
//             ctx.clearRect(0, 0, cw, ch);
//             const ptr = api.getCursorPtr() | 0, count = api.getCursorCount() | 0, stride = api.getCursorStride() | 0;
//             const hb = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || new Float32Array(0)), base: (ptr >>> 2) };
//             const heap = hb.heap, base = hb.base;

//             for (let i = 0; i < count; i++) {
//                 const o = base + i * stride;
//                 const life = heap[o + 4];
//                 if (life <= 0) continue;

//                 const x = heap[o], y = heap[o + 1], size = heap[o + 5] * life, hue = heap[o + 6];
//                 const alpha = life * 0.6;

//                 ctx.beginPath();
//                 ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
//                 ctx.arc(x, y, size, 0, Math.PI * 2);
//                 ctx.fill();

//                 ctx.beginPath();
//                 ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha * 0.3})`;
//                 ctx.arc(x, y, size * 2, 0, Math.PI * 2);
//                 ctx.fill();
//             }
//         }

//         // 2. Update Floating Shapes
//         const shapes = window.__floatingShapes;
//         if (shapes) {
//             const ptr = api.getShapePtr() | 0, count = api.getShapeCount() | 0, stride = api.getShapeStride() | 0;
//             const hb2 = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || new Float32Array(0)), base: (ptr >>> 2) };
//             const heap2 = hb2.heap, base2 = hb2.base;

//             for (let i = 0; i < count && i < shapes.length; i++) {
//                 const o = base2 + i * stride;
//                 const el = shapes[i];
//                 el.style.translate = `${heap2[o]}px ${heap2[o + 1]}px`;
//             }
//         }

//         // 3. Update Interactive Springs (Jumping Titles)
//         if (titles.length) {
//             const ptr = api.getSpringPtr() | 0, count = api.getSpringCount() | 0, stride = api.getSpringStride() | 0;
//             const hb3 = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || new Float32Array(0)), base: (ptr >>> 2) };
//             const heap3 = hb3.heap, base3 = hb3.base;

//             for (let i = 0; i < count && i < titles.length; i++) {
//                 const o = base3 + i * stride;
//                 const x = heap3[o];     // x_current
//                 const y = heap3[o + 3];   // y_current

//                 if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
//                     titles[i].style.translate = `${x}px ${y}px`;
//                     titles[i].style.display = 'inline-block';
//                 } else {
//                     titles[i].style.translate = '0px 0px';
//                 }
//             }
//         }

//         requestAnimationFrame(tick);
//     };

//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 19. PARALLAX SCROLL SECTIONS
// // ============================================================================
// const initParallaxSections = () => {
//     const sections = $$('section');

//     const tick = () => {
//         const y = window.scrollY;
//         sections.forEach(section => {
//             const r = section.getBoundingClientRect();
//             const visible = r.top < window.innerHeight && r.bottom > 0;
//             if (!visible) return;

//             const progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
//             const offset = (progress - 0.5) * -20;

//             // Subtle parallax on section content
//             const header = section.querySelector('.section-header');
//             if (header) {
//                 header.style.transform = `translateY(${offset}px)`;
//             }
//         });

//         requestAnimationFrame(tick);
//     };

//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 20. PORTFOLIO ITEM TILT ON HOVER
// // ============================================================================
// const initPortfolioTilt = () => {
//     $$('.portfolio-item').forEach(item => {
//         item.addEventListener('mousemove', (e) => {
//             const r = item.getBoundingClientRect();
//             const x = (e.clientX - r.left) / r.width - 0.5;
//             const y = (e.clientY - r.top) / r.height - 0.5;
//             item.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
//         }, { passive: true });

//         item.addEventListener('mouseleave', () => {
//             item.style.transform = '';
//         }, { passive: true });
//     });
// };

// // ============================================================================
// // 21. INFO ITEM COUNTER ANIMATION
// // ============================================================================
// const initCounterAnimation = () => {
//     const ageEl = byId('aboutAge');
//     if (!ageEl) return;

//     const io = new IntersectionObserver((entries) => {
//         for (const e of entries) {
//             if (e.isIntersecting && !ageEl.dataset.counted) {
//                 ageEl.dataset.counted = '1';
//                 const text = ageEl.textContent || '';
//                 const match = text.match(/(\d+)/);
//                 if (match) {
//                     const target = parseInt(match[1]);
//                     const suffix = text.replace(/\d+/, '').trim();
//                     animateCounter(ageEl, target, suffix);
//                 }
//                 io.disconnect();
//             }
//         }
//     }, { threshold: 0.5 });

//     io.observe(ageEl);
// };

// const animateCounter = (el, target, suffix) => {
//     const ease = getEasing().easeOutBack;
//     const t0 = performance.now();
//     const dur = 1500;

//     const tick = (ts) => {
//         const p = clamp01((ts - t0) / dur);
//         const val = Math.round(ease(p) * target);
//         el.textContent = `${val} ${suffix}`;
//         if (p < 1) requestAnimationFrame(tick);
//         else el.textContent = `${target} ${suffix}`;
//     };

//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 22. LOGO HOVER ANIMATION
// // ============================================================================
// const initLogoAnimation = () => {
//     const logo = byId('logoText');
//     if (!logo) return;

//     logo.addEventListener('mouseenter', () => {
//         const text = logo.textContent;
//         logo.innerHTML = '';
//         text.split('').forEach((char, i) => {
//             const span = document.createElement('span');
//             span.textContent = char;
//             span.style.display = 'inline-block';
//             span.style.animation = `logoWave 0.6s ease ${i * 0.05}s`;
//             logo.appendChild(span);
//         });
//     });

//     const style = document.createElement('style');
//     style.textContent = `@keyframes logoWave { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`;
//     document.head.appendChild(style);
// };

// // ============================================================================
// // 23. CUSTOM SMOOTH SCROLL
// // ============================================================================
// const customSmoothScroll = (targetY, ms = 800) => {
//     const startY = window.scrollY;
//     const diff = targetY - startY;
//     if (Math.abs(diff) < 1) return;
//     const ease = getEasing().easeInOutQuart;
//     const t0 = performance.now();
//     const tick = (ts) => {
//         const p = clamp01((ts - t0) / ms);
//         window.scrollTo(0, startY + diff * ease(p));
//         if (p < 1) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // 24. INPUT FOCUS WAVE ANIMATION
// // ============================================================================
// const initInputWave = () => {
//     $$('.contact-form input, .contact-form textarea').forEach(input => {
//         input.addEventListener('focus', () => {
//             input.style.animation = 'inputFocusPop 0.4s ease';
//             setTimeout(() => { input.style.animation = ''; }, 400);
//         });
//     });

//     const style = document.createElement('style');
//     style.textContent = `@keyframes inputFocusPop { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-4px) scale(1.01); } 100% { transform: translateY(-3px) scale(1); } }`;
//     document.head.appendChild(style);
// };

// // ============================================================================
// // 25. STRESS ANIMATIONS (WASM)
// // ============================================================================
// const initStressAnimations = async () => {
//     await waitForWasm();
//     const api = initStressApi();
//     if (!api) return;

//     document.body.classList.add('stress-on');
//     let targets = [];

//     const collect = () => {
//         const sel = [
//             'section', '.container', '.navbar', '.nav-link',
//             '.hero-content', '.hero-title', '.hero-tagline',
//             '.hero-description', '.cta-button', '.image-frame',
//             '.about-content', '.about-image', '.about-info',
//             '.info-item', '.download-cv',
//             '.service-card', '.service-icon',
//             '.portfolio-item', '.portfolio-overlay',
//             '.contact-form', '.submit-button',
//             '.section-header', '.section-title',
//             '.social-links a',
//         ].join(',');
//         const seen = new Set();
//         targets = $$(sel).filter(n => { if (seen.has(n)) return false; seen.add(n); return true; }).slice(0, 512);
//         targets.forEach(el => el.classList.add('stress-anim'));
//         api.init(targets.length, (Date.now() & 0x7fffffff) | 0);
//     };

//     collect();
//     window.addEventListener('profile-loaded', collect);

//     let pointerX = window.innerWidth * 0.5, pointerY = window.innerHeight * 0.35;
//     window.addEventListener('mousemove', (e) => { pointerX = e.clientX; pointerY = e.clientY; }, { passive: true });

//     // DEBUG: if true, position particles by setting `left`/`top` directly
//     const DEBUG_USE_LEFT_TOP = true;

//     let lastT = performance.now();
//     const tick = (ts) => {
//         const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000));
//         lastT = ts;
//         const y = window.scrollY || 0;
//         const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
//         const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
//         api.step(ts / 1000, dt, clamp01(y / maxS), clamp01(pointerX / w), clamp01(pointerY / h));

//         const count = api.getCount() | 0, stride = api.getStride() | 0;
//         const ptr = api.getPtr() >>> 0;
//         const hb = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || (typeof HEAPF32 !== 'undefined' ? HEAPF32 : null)), base: (ptr >>> 2) };
//         const heap = hb.heap, base = hb.base;

//         for (let i = 0; i < count && i < targets.length; i++) {
//             const el = targets[i], o = base + i * stride;
//             const s = el.style;
//             s.setProperty('--tx', `${heap[o] * 1.5}px`);
//             s.setProperty('--ty', `${heap[o + 1] * 1.5}px`);
//             s.setProperty('--rot', `${heap[o + 2]}deg`);
//             s.setProperty('--sc', `${1 + (heap[o + 3] - 1) * 1.2}`);
//             s.setProperty('--blur', `${heap[o + 4] * 1.8}px`);
//             s.setProperty('--hue', `${heap[o + 5] * 1.3}deg`);
//             s.setProperty('--sat', `${1 + (heap[o + 6] - 1) * 1.2}`);
//             s.setProperty('--alpha', `${Math.max(0.6, heap[o + 7])}`);
//             if (stride >= 10) {
//                 s.setProperty('--glow', `${Math.min(1, heap[o + 8] * 1.5)}`);
//                 s.setProperty('--skew', `${heap[o + 9] * 0.8}deg`);
//             }
//         }

//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// // Create N DOM elements and animate them using the C/WASM `domanim` math.
// // Call `createAndStartWasmParticles(500)` to start. Exposed as `window.createWasmParticles`.
// const createAndStartWasmParticles = async (count = 500) => {
//     await waitForWasm();
//     const api = initStressApi();
//     console.log('[wasm-particles] wasm-ready:', !!window.__vector2dWasmReady, 'domanim-api:', !!api);
//     if (!api) {
//         console.warn('[wasm-particles] WASM domanim API not available — cannot start wasm particles');
//         return;
//     }

//     // Clamp to DOMANIM_MAX (512) as defined in C implementation
//     const MAX = 512;
//     if (count > MAX) count = MAX;

//     // local debug toggle for particle rendering mode
//     const DEBUG_USE_LEFT_TOP = true;

//     // Remove previous container if present
//     let container = document.getElementById('wasmParticles');
//     if (container) container.remove();
//     container = document.createElement('div');
//     container.id = 'wasmParticles';
//     // Force container inline styles to ensure it covers the viewport
//     container.style.position = 'fixed';
//     container.style.inset = '0';
//     container.style.top = '0';
//     container.style.left = '0';
//     container.style.width = '100vw';
//     container.style.height = '100vh';
//     container.style.pointerEvents = 'none';
//     container.style.zIndex = '2147483647';
//     document.body.appendChild(container);
//     // debug container
//     console.log('[wasm-particles] created container', { id: container.id, w: container.offsetWidth, h: container.offsetHeight, z: getComputedStyle(container).zIndex });
//     try {
//         const crect = container.getBoundingClientRect();
//         console.log('[wasm-particles] containerRect', crect);
//         console.log('[wasm-particles] containerComputed', {
//             position: getComputedStyle(container).position,
//             inset: getComputedStyle(container).inset,
//             width: getComputedStyle(container).width,
//             height: getComputedStyle(container).height,
//             display: getComputedStyle(container).display,
//             zIndex: getComputedStyle(container).zIndex,
//         });
//     } catch (e) { /* ignore */ }

//     const els = [];
//     const parts = [];
//     const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
//     for (let i = 0; i < count; i++) {
//         const el = document.createElement('div');
//         const sizeClass = (i % 3 === 0) ? 'small' : (i % 3 === 1) ? 'medium' : 'large';
//         el.className = `wasm-particle ${sizeClass}`;
//         // position relative to container; we drive movement via CSS vars set below
//         el.style.left = '0px';
//         el.style.top = '0px';
//         // random initial placement
//         const x = Math.random() * w;
//         const y = Math.random() * h;
//         // pick a hue from a small palette so particles vary (red, green, blue, cyan, magenta)
//         const palette = [0, 120, 240, 180, 300];
//         const hue = palette[Math.floor(Math.random() * palette.length)];
//         const sat = 0.9 + Math.random() * 0.6; // 0.9 - 1.5
//         const glow = Math.random() * 0.9; // 0 - 0.9
//         el.style.setProperty('--tx', `${x}px`);
//         el.style.setProperty('--ty', `${y}px`);
//         el.style.setProperty('--rot', `0deg`);
//         el.style.setProperty('--sc', 1);
//         el.style.setProperty('--blur', `0px`);
//         el.style.setProperty('--alpha', 1);
//         el.style.setProperty('--hue', `${hue}deg`);
//         el.style.setProperty('--sat', sat);
//         el.style.setProperty('--glow', glow);
//         container.appendChild(el);
//         // initialize particle state for smooth interpolation / fireworks-like motion
//         parts.push({ x, y, vx: 0, vy: 0, hue, sat, glow, alpha: 1 });
//         els.push(el);
//     }

//     // Debug helper: force first few particles visible and topmost for 3s to verify rendering
//     const forceVisible = (n = 6, duration = 3000) => {
//         for (let i = 0; i < n && i < els.length; i++) {
//             const e = els[i];
//             const hue = (i * 60) % 360;
//             e.__dbg_old = {
//                 width: e.style.width,
//                 height: e.style.height,
//                 transform: e.style.transform,
//                 background: e.style.background,
//                 boxShadow: e.style.boxShadow,
//                 zIndex: e.style.zIndex,
//                 mixBlendMode: e.style.mixBlendMode,
//                 opacity: e.style.opacity,
//             };
//             e.style.width = '48px';
//             e.style.height = '48px';
//             e.style.borderRadius = '50%';
//             e.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,1) 0%, hsl(${hue} 100% 60%) 20%, rgba(0,0,0,0) 60%)`;
//             e.style.boxShadow = `0 0 24px hsl(${hue} 100% 60% / 0.95)`;
//             e.style.zIndex = '99999';
//             e.style.mixBlendMode = 'normal';
//             e.style.opacity = '1';
//             // place near center using inline transform (overrides stylesheet transform)
//             e.style.transform = 'translate(50vw,50vh) translate(-50%,-50%) scale(1)';
//             try { console.log('[wasm-particles] debugRect', i, e.getBoundingClientRect()); } catch (e) { /* ignore */ }
//         }
//         setTimeout(() => {
//             for (let i = 0; i < n && i < els.length; i++) {
//                 const e = els[i];
//                 if (!e.__dbg_old) continue;
//                 e.style.width = e.__dbg_old.width || '';
//                 e.style.height = e.__dbg_old.height || '';
//                 e.style.transform = e.__dbg_old.transform || '';
//                 e.style.background = e.__dbg_old.background || '';
//                 e.style.boxShadow = e.__dbg_old.boxShadow || '';
//                 e.style.zIndex = e.__dbg_old.zIndex || '';
//                 e.style.mixBlendMode = e.__dbg_old.mixBlendMode || '';
//                 e.style.opacity = e.__dbg_old.opacity || '';
//                 delete e.__dbg_old;
//             }
//             console.log('[wasm-particles] debug forceVisible restored');
//         }, duration);
//     };
//     // debug: don't auto-run forceVisible in normal mode (was making particles disappear after it restored)
//     // forceVisible(6, 3500);

//     api.init(count, (Date.now() & 0x7fffffff) | 0);

//     let lastT = performance.now();
//     const tick = (ts) => {
//         const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000));
//         lastT = ts;
//         const y = window.scrollY || 0;
//         const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
//         api.step(ts / 1000, dt, clamp01(y / maxS), 0.5, 0.5);

//         const got = api.getCount() | 0;
//         const stride = api.getStride() | 0;
//         const ptr = api.getPtr() >>> 0;
//         const hb = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || (typeof HEAPF32 !== 'undefined' ? HEAPF32 : null)), base: (ptr >>> 2) };
//         const heap = hb.heap, base = hb.base;

//         // debug: log once when starting to inspect heap/ptr info
//         if (!tick._logged) {
//             console.log('[wasm-particles] tick start — got=%d stride=%d ptr=%d base=%d heapLen=%d bufferBytes=%d', got, stride, ptr, base, heap?.length || 0, window.wasmMemory?.buffer?.byteLength || 0);
//             tick._logged = true;
//         }

//         // safety counter for suppressed warnings
//         tick._missed = tick._missed || 0;

//         for (let i = 0; i < got && i < els.length; i++) {
//             const el = els[i], o = base + i * stride;
//             // guard against invalid heap/index (can happen if memory not yet mapped or pointer is 0)
//             if (!heap || o < 0 || o + 9 >= heap.length) {
//                 if (tick._missed < 6) {
//                     const required = base + got * stride + 10;
//                     console.warn('[wasm-particles] skipping particle update; invalid heap/index — i=%d o=%d got=%d stride=%d ptr=%d base=%d heapLen=%d requiredMin=%d bufferBytes=%d', i, o, got, stride, ptr, base, heap?.length || 0, required, window.wasmMemory?.buffer?.byteLength || 0);
//                     tick._missed++;
//                 }
//                 continue;
//             }
//             const tx = heap[o] || 0;
//             const ty = heap[o + 1] || 0;
//             const rot = heap[o + 2] || 0;
//             const sc = 1 + ((heap[o + 3] || 1) - 1) * 1.2;
//             const blur = (heap[o + 4] || 0) * 1.5;
//             const hue = ((heap[o + 5] || 0) * 360) % 360;
//             const sat = Math.max(0.2, 1 + ((heap[o + 6] || 1) - 1) * 1.1);
//             const alpha = Math.max(0.15, (heap[o + 7] || 1));

//             if (DEBUG_USE_LEFT_TOP) {
//                 // Physics-based interpolation: use WASM outputs as attraction targets
//                 const p = parts[i] || { x: tx, y: ty, vx: 0, vy: 0 };
//                 // map small WASM offsets to screen coordinates around focal point
//                 const focalX = window.innerWidth * 0.5;
//                 const focalY = window.innerHeight * 0.45;
//                 const targetX = focalX + tx * 56;
//                 const targetY = focalY + ty * 56;
//                 // attract
//                 p.vx += (targetX - p.x) * 8 * dt;
//                 p.vy += (targetY - p.y) * 8 * dt;
//                 // occasional burst for fireworks-like motion
//                 if (Math.random() < 0.003) {
//                     p.vx += (Math.random() - 0.5) * 400;
//                     p.vy += (Math.random() - 0.8) * 420;
//                 }
//                 // damping & integrate
//                 p.vx *= 0.96;
//                 p.vy *= 0.96;
//                 p.x += p.vx * dt;
//                 p.y += p.vy * dt;
//                 // write back state
//                 parts[i] = p;
//                 // render
//                 el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${rot}deg) scale(${sc})`;
//                 el.style.opacity = `${alpha}`;
//                 el.style.filter = `blur(${blur}px) saturate(${sat}) hue-rotate(${hue}deg)`;
//             } else {
//                 el.style.setProperty('--tx', `${tx}px`);
//                 el.style.setProperty('--ty', `${ty}px`);
//                 el.style.setProperty('--rot', `${rot}deg`);
//                 el.style.setProperty('--sc', sc);
//                 el.style.setProperty('--blur', `${blur}px`);
//                 el.style.setProperty('--sat', sat);
//                 el.style.setProperty('--hue', `${hue}deg`);
//                 el.style.setProperty('--alpha', alpha);
//             }
//             // debug sample first few particles to inspect visibility values
//             if (i === 0 && (tick._visChecks || 0) < 6) {
//                 const glow = (stride >= 10) ? (heap[o + 8] || 0) : 0;
//                 console.log('[wasm-particles] sample[0]', { tx, ty, hue, sat, alpha, glow, ptr, base, o, heapLen: heap?.length });
//                 try {
//                     const rect = el.getBoundingClientRect();
//                     console.log('[wasm-particles] elRect', { left: rect.left, top: rect.top, w: rect.width, h: rect.height });
//                 } catch (e) { /* ignore */ }
//                 // temporarily highlight the particle to ensure it's visible
//                 el.style.outline = '1px solid rgba(255,255,255,0.6)';
//                 tick._visChecks = (tick._visChecks || 0) + 1;
//             }
//             if (stride >= 10) {
//                 el.style.setProperty('--glow', Math.min(1, (heap[o + 8] || 0) * 1.5));
//                 el.style.setProperty('--skew', `${(heap[o + 9] || 0) * 0.8}deg`);
//             }
//         }

//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);

//     // Expose stop/start helpers
//     window.createWasmParticles = createAndStartWasmParticles;
// };

// // Auto-start when wasm is ready (convenience)
// window.addEventListener('vector2d-wasm-ready', () => {
//     // slight delay so page layout stabilizes
//     setTimeout(() => {
//         // Disabled to allow Three.js water theme to run smoothly
//         // try { console.log('[wasm-particles] vector2d-wasm-ready event, attempting start'); createAndStartWasmParticles(500); } catch (e) { console.error('[wasm-particles] start failed', e); }
//     }, 200);
// });

// // ============================================================================
// // 26. CANVAS PARTICLE FX
// // ============================================================================
// const initFx = async () => {
//     if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
//     const canvas = byId('bgFx'), ctx = canvas?.getContext?.('2d');
//     const spotlight = byId('spotlight');
//     if (!canvas || !ctx || !spotlight) return;

//     const isTouch = 'ontouchstart' in window;
//     const dpr = Math.min(window.devicePixelRatio || 1, 2);
//     let w = 0, h = 0, running = true, wasm = null;

//     const resize = () => {
//         w = window.innerWidth; h = window.innerHeight;
//         canvas.width = w * dpr; canvas.height = h * dpr;
//         canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
//         ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//         wasm?.fx?.resize(w, h, dpr);
//     };

//     const onPointer = (e) => {
//         const px = e?.clientX ?? (w * 0.5);
//         const py = e?.clientY ?? (h * 0.35);
//         // update wasm pointer when available
//         try {
//             if (wasm?.fx) {
//                 // ensure touch mode is disabled for mouse
//                 wasm.fx.setIsTouch(0);
//                 wasm.fx.setPointer(px, py);
//                 // if particles were accidentally cleared, repopulate by resizing (safe)
//                 const cnt = (wasm.fx.getParticleCount && wasm.fx.getParticleCount()) | 0;
//                 if (!cnt) wasm.fx.resize(w, h, dpr);
//             }
//         } catch (err) { /* ignore wasm timing errors */ }
//     };

//     // support touch events: forward touches to wasm pointer and mark touch mode
//     const onTouch = (e) => {
//         if (!e.touches || e.touches.length === 0) return;
//         const t = e.touches[0];
//         try {
//             if (wasm?.fx) {
//                 wasm.fx.setIsTouch(1);
//                 wasm.fx.setPointer(t.clientX, t.clientY);
//             }
//         } catch (err) { }
//     };

//     window.addEventListener('mousemove', onPointer, { passive: true });
//     window.addEventListener('touchstart', onTouch, { passive: true });
//     window.addEventListener('touchmove', onTouch, { passive: true });
//     window.addEventListener('resize', resize, { passive: true });
//     document.addEventListener('visibilitychange', () => { running = document.visibilityState !== 'hidden'; });
//     resize();
//     onPointer({ clientX: w * 0.5, clientY: h * 0.35 });

//     await waitForWasm();
//     wasm = initWasmApi();
//     if (!wasm?.fx) return;

//     wasm.fx.setIsTouch(isTouch ? 1 : 0);
//     wasm.fx.init(w, h, dpr, (Date.now() ^ (w << 16) ^ h) | 0);

//     let lastT = performance.now();
//     const tick = (ts) => {
//         if (!running) { lastT = ts; requestAnimationFrame(tick); return; }
//         const dt = Math.min(0.05, (ts - lastT) / 1000);
//         lastT = ts;
//         wasm.fx.step(dt);

//         spotlight.style.setProperty('--mx', `${wasm.fx.getMx()}%`);
//         spotlight.style.setProperty('--my', `${wasm.fx.getMy()}%`);

//         ctx.clearRect(0, 0, w, h);

//         const count = wasm.fx.getParticleCount() | 0;
//         const stride = wasm.fx.getParticleStride() | 0;
//         const ptr = wasm.fx.getParticlesPtr() | 0;
//         const hbp = (window.Wasm && typeof window.Wasm.getHeapF32AndBase === 'function') ? window.Wasm.getHeapF32AndBase(ptr) : { heap: (window.Module?.HEAPF32 || new Float32Array(0)), base: (ptr >>> 2) };
//         const heap = hbp.heap, base = hbp.base;

//         for (let i = 0; i < count; i++) {
//             const o = base + i * stride;
//             const x = heap[o], y = heap[o + 1], r = heap[o + 4], hue = heap[o + 5], a = heap[o + 6];
//             ctx.beginPath();
//             ctx.fillStyle = `hsla(${hue},90%,65%,${a})`;
//             ctx.arc(x, y, r, 0, Math.PI * 2);
//             ctx.fill();
//         }


//         // Glowing lights pass (replace linking lines with soft additive glow)
//         ctx.save();
//         ctx.globalCompositeOperation = 'lighter';
//         for (let i = 0; i < count; i++) {
//             const o = base + i * stride;
//             const x = heap[o], y = heap[o + 1], r = heap[o + 4], hue = heap[o + 5], a = heap[o + 6];
//             // bloom: draw a larger blurred circle behind the particle
//             ctx.beginPath();
//             ctx.fillStyle = `hsla(${hue},90%,65%,${Math.min(0.9, a * 0.8)})`;
//             ctx.shadowColor = `hsla(${hue},90%,65%,${Math.min(0.9, a)})`;
//             ctx.shadowBlur = Math.max(8, r * 6);
//             ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
//             ctx.fill();
//             // small crisp center (already drawn above) will show on top
//             ctx.shadowBlur = 0;
//         }
//         ctx.restore();

//         requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
// };

// // ============================================================================
// // MAIN INIT
// // ============================================================================
// const initDom = () => {
//     // If the page was redirected back from FormSubmit with ?sent=1, show success popup
//     const qp = new URLSearchParams(window.location.search || '');
//     if (qp.get('sent') === '1') {
//         // delay slightly so UI is ready
//         setTimeout(() => {
//             showContactSuccessPopup();
//             // remove query param without reloading
//             try { const u = new URL(window.location.href); u.searchParams.delete('sent'); history.replaceState({}, '', u.pathname + u.search); } catch (e) { /* ignore */ }
//         }, 250);
//     }
//     // Load profile XML (fires `profile-loaded` event when ready)
//     loadProfileFromXml().catch(() => { });
//     // Loading screen
//     initLoadingScreen();

//     // Image fallback
//     ['heroImg', 'aboutImg'].forEach(id => {
//         const el = byId(id);
//         if (!el) return;
//         const mark = () => el.classList.add('img-ready');
//         if (el.complete && el.naturalWidth > 0) mark();
//         else { el.addEventListener('load', mark, { once: true }); setTimeout(mark, 1200); }
//     });

//     // Char split
//     let charDone = false;
//     const doChar = () => { if (charDone) return; charDone = true; initHeroCharSplit(); };
//     window.addEventListener('profile-loaded', () => { if (!charDone) doChar(); }, { once: true });
//     // Fallback: only run if heroName already has content after a short delay
//     setTimeout(() => { if (!charDone && (byId('heroName')?.textContent || '').trim()) doChar(); }, 900);

//     // Typing
//     let typeDone = false;
//     const doType = () => { if (typeDone) return; typeDone = true; startHeroTypingEffect(); };
//     window.addEventListener('profile-loaded', () => { if (!typeDone) doType(); }, { once: true });
//     setTimeout(() => { if (!typeDone && (byId('heroSubtitle')?.textContent || '').trim()) doType(); }, 950);

//     // All animation systems
//     initScrollProgress();
//     initNavbarMorph();
//     initSectionReveal();
//     initTextScramble();
//     // Re-run text scramble after profile data is loaded (in case text was replaced)
//     window.addEventListener('profile-loaded', () => initTextScramble());
//     initHeroTilt();
//     initServiceCardTilt();
//     initMagneticButtons();
//     initButtonRipple();
//     initDownloadCv();
//     initContactRedirect();
//     initAboutTypingOnView();
//     initAboutParallax();
//     initFooterSpringIn();
//     initContactFieldStagger();
//     initCursorTrail();
//     initScrollVelocity();
//     initShapeRepel();
//     initInteractiveTitles();
//     initUnifiedSimulation();
//     initParallaxSections();
//     initPortfolioTilt();
//     initCounterAnimation();
//     initLogoAnimation();
//     initInputWave();

//     // Mobile nav
//     const hamburger = byId('hamburger'), navMenu = byId('navMenu');
//     if (hamburger && navMenu) {
//         hamburger.addEventListener('click', () => {
//             hamburger.classList.toggle('active');
//             navMenu.classList.toggle('active');
//         });
//     }

//     // Nav smooth scroll
//     $$('.nav-link').forEach(link => {
//         link.addEventListener('click', (e) => {
//             const href = link.getAttribute('href') || '';
//             if (!href.startsWith('#')) return;
//             e.preventDefault();
//             hamburger?.classList.remove('active');
//             navMenu?.classList.remove('active');
//             const target = $(href);
//             if (target) customSmoothScroll(target.offsetTop - 80, 900);
//         });
//     });

//     // Hero CTA: scroll to About section smoothly (account for navbar height)
//     const heroCta = byId('heroCta');
//     if (heroCta) {
//         heroCta.addEventListener('click', (e) => {
//             e.preventDefault();
//             const target = $('#about');
//             if (!target) return;
//             const nav = byId('navbar');
//             const offset = nav ? nav.offsetHeight : 80;
//             // small extra gap so section header isn't flush against the nav
//             customSmoothScroll(target.offsetTop - offset - 10, 900);
//         });
//     }

//     // Active nav on scroll
//     const secs = $$('section');
//     window.addEventListener('scroll', () => {
//         const y = window.pageYOffset || 0;
//         let cur = '';
//         secs.forEach(s => { if (y >= s.offsetTop - 100) cur = s.id; });
//         $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
//     }, { passive: true });

//     // Contact form: posts directly to FormSubmit via HTML `action` attribute.
//     // No JS interception is required so users can send using FormSubmit service.
// };

// // Run main init when DOM is ready
// if (document.readyState === 'loading') {
//     window.addEventListener('DOMContentLoaded', initDom, { once: true });
// } else {
//     setTimeout(initDom, 0);
// }

// ============================================================================
// Heavy Animation Portfolio — script.js  (v3 – WASM-ONLY MATH)
// All animation math sourced exclusively from C/WASM.
// No JS math fallbacks. If WASM is not ready, animations are skipped.
// ============================================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

// ============================================================================
// WASM BRIDGE — single source of truth for all math
// ============================================================================
(function () {
    if (window.Wasm) return;
    const bridge = {
        ready: new Promise((resolve) => {
            let settled = false;
            const settle = (mod) => {
                if (settled) return;
                settled = true;
                resolve(mod || {});
                window.dispatchEvent(new Event('vector2d-wasm-ready'));
            };
            if (window.Module && typeof window.Module.cwrap === 'function') return settle(window.Module);
            if (window.Module && typeof window.Module.onRuntimeInitialized === 'function') {
                const orig = window.Module.onRuntimeInitialized;
                window.Module.onRuntimeInitialized = function () { try { orig(); } catch (e) { } settle(window.Module); };
            }
            const onEvent = () => settle(window.Module);
            window.addEventListener('vector2d-wasm-ready', onEvent, { once: true });
            const poll = setInterval(() => {
                if (window.Module && typeof window.Module.cwrap === 'function') {
                    clearInterval(poll);
                    window.removeEventListener('vector2d-wasm-ready', onEvent);
                    settle(window.Module);
                }
            }, 50);
            setTimeout(() => { clearInterval(poll); window.removeEventListener('vector2d-wasm-ready', onEvent); settle(window.Module); }, 5000);
        }),

        _cache: {},
        cwrap(name, ret, argTypes) {
            const k = `${name}|${ret}|${(argTypes || []).join(',')}`;
            if (this._cache[k]) return this._cache[k];
            if (!window.Module || typeof window.Module.cwrap !== 'function') return null;
            try {
                const fn = window.Module.cwrap(name, ret, argTypes || []);
                this._cache[k] = fn;
                return fn;
            } catch (e) { return null; }
        },

        heapI32() { return window.Module?.HEAP32 || null; },
        heapF32() { return window.Module?.HEAPF32 || null; },
        getHeapF32AndBase(ptr) {
            const heap = this.heapF32();
            if (!heap || !ptr) return { heap: new Float32Array(0), base: 0 };
            return { heap, base: ptr >>> 2 };
        },
        getHeapI32AndBase(ptr) {
            const heap = this.heapI32();
            if (!heap || !ptr) return { heap: new Int32Array(0), base: 0 };
            return { heap, base: ptr >>> 2 };
        },
        float32View(ptr, count) {
            if (!ptr || !window.Module?.HEAPF32) return new Float32Array(0);
            return new Float32Array(window.Module.HEAPF32.buffer, ptr, count);
        }
    };
    window.Wasm = bridge;
})();

const waitForWasm = () => window.Wasm?.ready || Promise.resolve({});

// ============================================================================
// MATH WASM BINDINGS
// All functions from C. No JS fallbacks — returns null if WASM not ready.
// ============================================================================
let M = null; // populated by initMathWasmBindings

const initMathWasmBindings = async () => {
    await waitForWasm();
    if (!window.Module || typeof window.Module.cwrap !== 'function') return null;

    const w = window.Module.cwrap;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';

    try {
        M = {
            // anim.h
            clamp01: has('anim_clamp01') ? w('anim_clamp01', 'number', ['number']) : null,
            lerp: has('anim_lerp') ? w('anim_lerp', 'number', ['number', 'number', 'number']) : null,
            easeInOutCubic: has('anim_ease_in_out_cubic') ? w('anim_ease_in_out_cubic', 'number', ['number']) : null,
            easeOutElastic: has('anim_ease_out_elastic') ? w('anim_ease_out_elastic', 'number', ['number']) : null,
            easeOutBounce: has('anim_ease_out_bounce') ? w('anim_ease_out_bounce', 'number', ['number']) : null,
            easeOutBack: has('anim_ease_out_back') ? w('anim_ease_out_back', 'number', ['number']) : null,
            easeInOutQuart: has('anim_ease_in_out_quart') ? w('anim_ease_in_out_quart', 'number', ['number']) : null,
            smoothstep: has('anim_smoothstep') ? w('anim_smoothstep', 'number', ['number', 'number', 'number']) : null,
            noise1: has('anim_noise1') ? w('anim_noise1', 'number', ['number', 'number']) : null,
            wave: has('anim_wave') ? w('anim_wave', 'number', ['number', 'number', 'number', 'number']) : null,
            expSmooth: has('anim_exp_smooth') ? w('anim_exp_smooth', 'number', ['number', 'number', 'number', 'number']) : null,
            // vector2D.h
            magnitude_xy: has('vector2D_magnitude_xy') ? w('vector2D_magnitude_xy', 'number', ['number', 'number']) : null,
            rotation_x: has('vector2D_rotation_x') ? w('vector2D_rotation_x', 'number', ['number', 'number', 'number']) : null,
            rotation_y: has('vector2D_rotation_y') ? w('vector2D_rotation_y', 'number', ['number', 'number', 'number']) : null,
            // sin/cos via vector2D_rotation: cos(a)=rot_x(1,0,a), sin(a)=rot_y(1,0,a)
            // These go through the C LUT, zero libm.
            sin: null, // set below after rotation_x/y confirmed
            cos: null,
        };

        // Wire sin/cos through the C LUT via vector2D_rotation
        if (M.rotation_x && M.rotation_y) {
            M.cos = (a) => M.rotation_x(1, 0, a);
            M.sin = (a) => M.rotation_y(1, 0, a);
        }

        window.MathWasm = M;
        return M;
    } catch (e) {
        console.warn('initMathWasmBindings failed:', e);
        return null;
    }
};

// Convenience: returns true only when M is fully populated
const mathReady = () => !!M && !!M.wave && !!M.lerp && !!M.easeInOutCubic;

// ============================================================================
// EASING — WASM only. Returns null if not ready.
// ============================================================================
const getEasing = () => {
    if (!mathReady()) return null;
    return {
        easeInOutCubic: M.easeInOutCubic,
        easeOutElastic: M.easeOutElastic,
        easeOutBounce: M.easeOutBounce,
        easeOutBack: M.easeOutBack,
        easeInOutQuart: M.easeInOutQuart,
        lerp: M.lerp,
        clamp01: M.clamp01,
    };
};

// clamp01 — thin wrapper, used often
const clamp01 = (x) => (M?.clamp01 ? M.clamp01(x) : Math.max(0, Math.min(1, x)));

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
    const getText = (doc, sel) => doc.querySelector(sel)?.textContent?.trim() || '';
    const setTextById = (id, value) => { if (!value) return; const el = byId(id); if (el) el.textContent = value; };
    const setTextOrHideRowById = (id, value) => {
        const el = byId(id); if (!el) return;
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
            const pre = new Image(); pre.decoding = 'async';
            pre.onload = res; pre.onerror = () => rej(new Error('img fail'));
            pre.src = nextSrc;
        });
        const fadeOut = hadReal ? animateOpacityOut(el, 140) : Promise.resolve();
        Promise.allSettled([preload, fadeOut]).then(async (r) => {
            if (r[0].status !== 'fulfilled') { el.classList.add('img-ready'); return; }
            el.src = nextSrc; el.dataset.finalSrc = nextSrc;
            await animateOpacityIn(el, 240);
        });
    };
    const renderServicesFromXml = (doc) => {
        const grid = byId('servicesGrid'); if (!grid) return;
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
        const grid = byId('portfolioGrid'); if (!grid) return;
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
            item.innerHTML = link
                ? `<a class="portfolio-link" href="${link}" target="_blank" rel="noopener noreferrer"><img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div></a>`
                : `<img src="${img}" alt="${title}"><div class="portfolio-overlay"><h3>${title}</h3><p>${cat}</p></div>`;
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
        setTextById('footerName',
            getText(doc, 'profile > footer > name') ||
            getText(doc, 'profile > about > name') ||
            getText(doc, 'profile > hero > name'));
        renderServicesFromXml(doc);
        renderProjectsFromXml(doc);
        window.dispatchEvent(new Event('profile-loaded'));
    } catch (err) { console.warn('Profile XML not loaded:', err); }
};

// ============================================================================
// SIMULATION APIS — thin cwrap wrappers, no math in JS
// ============================================================================
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
            }
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

const initVector2DAnimApi = () => {
    if (!window.Module?.cwrap) return null;
    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (!has('animation_set_points')) return null;
    try {
        const w = window.Module.cwrap;
        return {
            setPoints: w('animation_set_points', null, ['number', 'number', 'number', 'number']),
            setDuration: w('animation_set_duration', null, ['number']),
            step: w('animation_step', null, ['number']),
            getX: w('animation_get_x', 'number', []),
            getY: w('animation_get_y', 'number', []),
            reset: w('animation_reset', null, []),
        };
    } catch { return null; }
};

// ============================================================================
// WASM-driven element rect animation
// ============================================================================
const animateElementBetweenRectsWasm = async (el, fromRect, toRect, duration = 0.48) => {
    await waitForWasm();
    if (!window.Module?.cwrap) return;

    const has = (n) => typeof window.Module[`_${n}`] === 'function';
    if (has('animation_handle_create')) {
        try {
            const w = window.Module.cwrap;
            const create = w('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
            const step = w('animation_handle_step', null, ['number', 'number']);
            const getX = w('animation_handle_get_x', 'number', ['number']);
            const getY = w('animation_handle_get_y', 'number', ['number']);
            const destroy = w('animation_handle_destroy', null, ['number']);
            const handle = create(fromRect.x, fromRect.y, toRect.x, toRect.y, duration);
            if (!handle) return;
            let last = performance.now();
            return new Promise((res) => {
                const loop = (ts) => {
                    const dt = (ts - last) / 1000; last = ts;
                    step(handle, dt);
                    const x = getX(handle), y = getY(handle);
                    el.style.transform = `translate(${x - fromRect.x}px, ${y - fromRect.y}px)`;
                    if (Math.abs(x - toRect.x) < 0.5 && Math.abs(y - toRect.y) < 0.5) { destroy(handle); return res(); }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            });
        } catch (e) { /* fallthrough */ }
    }
    // older single-global API
    const api = initVector2DAnimApi();
    if (!api) return;
    api.setPoints(fromRect.x, fromRect.y, toRect.x, toRect.y);
    api.setDuration(duration);
    let last = performance.now();
    return new Promise((res) => {
        const loop = (ts) => {
            const dt = (ts - last) / 1000; last = ts;
            api.step(dt);
            const x = api.getX(), y = api.getY();
            el.style.transform = `translate(${x - fromRect.x}px, ${y - fromRect.y}px)`;
            if (Math.abs(x - toRect.x) < 0.5 && Math.abs(y - toRect.y) < 0.5) return res();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    });
};

// ============================================================================
// OPACITY HELPERS — WASM easing only
// ============================================================================
const animateOpacityTo = async (el, from, to, ms = 220) => {
    if (!el || !mathReady()) return;
    const ease = M.easeInOutCubic;
    el.style.transition = 'none';
    el.style.opacity = String(from);
    const t0 = performance.now();
    return new Promise(res => {
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
    return animateOpacityTo(el, isFinite(cur) ? cur : 1, 0, ms);
};

// ============================================================================
// TEMPLATE ROTATOR
// ============================================================================
const initTemplateRotator = () => {
    const t1 = document.querySelector('.hero-container');
    const t2 = byId('template2');
    if (!t1 || !t2) return;
    let wrapper1 = t1.closest('.template');
    if (!wrapper1) {
        wrapper1 = document.createElement('div');
        wrapper1.className = 'template is-active';
        t1.parentNode.insertBefore(wrapper1, t1);
        wrapper1.appendChild(t1);
    }
    t2.classList.remove('is-active');
    const switchTo = async (fromEl, toEl) => {
        if (fromEl === toEl) return;
        fromEl.classList.add('is-leaving'); fromEl.classList.remove('is-active');
        toEl.classList.add('is-active'); toEl.classList.remove('is-leaving');
        try {
            const fromImg = fromEl.querySelector('.image-frame img, .image-frame');
            const toImg = toEl.querySelector('img, .t2-preview img');
            if (fromImg && toImg) {
                const fr = fromImg.getBoundingClientRect(), tr = toImg.getBoundingClientRect();
                const clone = fromImg.cloneNode(true);
                Object.assign(clone.style, { position: 'fixed', left: `${fr.left}px`, top: `${fr.top}px`, width: `${fr.width}px`, height: `${fr.height}px`, margin: '0', zIndex: 99999 });
                document.body.appendChild(clone);
                await animateElementBetweenRectsWasm(clone, fr, tr, 0.48);
                clone.remove();
            }
        } catch (e) { }
        setTimeout(() => fromEl.classList.remove('is-leaving'), 520);
    };
    wrapper1.classList.add('is-active');
    let showingFirst = true;
    setInterval(() => {
        if (showingFirst) switchTo(wrapper1, t2); else switchTo(t2, wrapper1);
        showingFirst = !showingFirst;
    }, 30000);
};
window.addEventListener('profile-loaded', () => setTimeout(initTemplateRotator, 300));
document.addEventListener('DOMContentLoaded', () => setTimeout(initTemplateRotator, 600));

// ============================================================================
// MATH-DRIVEN UI ANIMATIONS — 100% from C via M.*
// ============================================================================
const initMathAnimations = () => {
    if (!mathReady()) return;
    const orb = byId('t2Orb');
    const heroFrame = document.querySelector('.image-frame');
    const shapes = Array.from(document.querySelectorAll('.floating-shapes .shape'));
    if (!orb && !heroFrame && shapes.length === 0) return;

    let last = performance.now();
    const TWO_PI = Math.PI * 2;

    const tick = (ts) => {
        const now = ts / 1000;

        if (orb) {
            // wave returns [-amp, +amp]; map to [0,1]
            const raw = (M.wave(now, TWO_PI * 0.35, 1, 0) + 1) * 0.5;
            const e = M.easeInOutCubic(raw);
            orb.style.transform = `translateY(${(-10 * e).toFixed(2)}px) scale(${(0.92 + e * 0.18).toFixed(3)})`;
            orb.style.filter = `blur(${(6 - e * 2).toFixed(2)}px)`;
        }

        if (heroFrame) {
            const rawH = (M.wave(now, TWO_PI * 0.22, 1, 0.4) + 1) * 0.5;
            const eH = M.easeOutBack(rawH);
            heroFrame.style.transform = `translateY(${(-6 * eH).toFixed(2)}px)`;
        }

        if (shapes.length) {
            shapes.forEach((s, i) => {
                const phase = (i % 5) * 0.7;
                const amp = 5 + (i % 3) * 3;
                const freqS = (0.1 + (i % 4) * 0.02) * TWO_PI;
                const rawS = (M.wave(now, freqS, 1, phase) + 1) * 0.5;
                const eS = M.lerp(0, 1, rawS);
                const tx = M.wave(now, (0.05 + (i % 3) * 0.01), amp * 0.6, phase + Math.PI * 0.5);
                const ty = M.wave(now, (0.06 + (i % 4) * 0.008), amp * 0.4, phase);
                s.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${((rawS - 0.5) * 8).toFixed(2)}deg)`;
            });
        }

        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};
document.addEventListener('DOMContentLoaded', () => setTimeout(initMathAnimations, 400));
window.addEventListener('vector2d-wasm-ready', () => setTimeout(initMathAnimations, 200));

// ============================================================================
// IMAGE ANIMATIONS — WASM handle API
// ============================================================================
const initImageAnimations = async () => {
    await waitForWasm();
    if (!window.Module?.cwrap || !mathReady()) return;

    const candidates = [];
    const heroFrame = document.querySelector('.image-frame');
    const heroImg = byId('heroImg');
    const aboutImg = byId('aboutImg');
    const t2Preview = document.querySelector('#t2Preview img');
    const portfolioImgs = Array.from(document.querySelectorAll('.portfolio-item img'));

    if (heroFrame) candidates.push({ el: heroFrame, amp: 8, dur: 3.2 });
    if (heroImg) candidates.push({ el: heroImg, amp: 6, dur: 3.6 });
    if (aboutImg) candidates.push({ el: aboutImg, amp: 6, dur: 3.2 });
    if (t2Preview) candidates.push({ el: t2Preview, amp: 10, dur: 4.2 });
    portfolioImgs.slice(0, 12).forEach((img, i) =>
        candidates.push({ el: img, amp: 6 + (i % 3) * 2, dur: 3 + (i % 5) * 0.4 }));
    if (!candidates.length) return;

    const w = window.Module.cwrap;
    const create = w('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
    const stepH = w('animation_handle_step', null, ['number', 'number']);
    const getY = w('animation_handle_get_y', 'number', ['number']);
    const destroy = w('animation_handle_destroy', null, ['number']);

    const allocated = [];
    for (const it of candidates) {
        const h = create(0, -it.amp * 0.5, 0, it.amp * 0.5, it.dur);
        if (h) allocated.push({ el: it.el, handle: h });
    }

    let last = performance.now();
    const tick = (ts) => {
        const dt = (ts - last) / 1000; last = ts;
        for (const a of allocated) {
            try {
                stepH(a.handle, dt);
                a.el.style.transform = `translateY(${getY(a.handle).toFixed(2)}px)`;
            } catch (e) { }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => allocated.forEach(a => { try { destroy(a.handle); } catch (e) { } }));
};
document.addEventListener('DOMContentLoaded', () => setTimeout(initImageAnimations, 600));
window.addEventListener('vector2d-wasm-ready', () => setTimeout(initImageAnimations, 300));

// ============================================================================
// PROFILE IMAGE ROTATION — WASM vector2D_rotation + magnitude_xy
// ============================================================================
const initProfileImageRotation = async () => {
    const aboutImage = byId('aboutImg');
    if (!aboutImage) return;
    const imageContainer = aboutImage.closest('.about-image');
    if (!imageContainer) return;
    await waitForWasm();
    if (!mathReady()) return;

    let targetRotX = 0, targetRotY = 0, currentRotX = 0, currentRotY = 0, isHovering = false;
    const MAX_ROT = 25;

    const onMouseMove = (e) => {
        const rect = imageContainer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const nx = M.clamp01((e.clientX - cx) / (rect.width / 2) * 0.5 + 0.5) * 2 - 1;
        const ny = M.clamp01((e.clientY - cy) / (rect.height / 2) * 0.5 + 0.5) * 2 - 1;
        const dist = M.magnitude_xy(nx, ny);
        const angle = dist * 0.3;
        targetRotY = M.rotation_x(nx, ny, angle) * MAX_ROT;
        targetRotX = -M.rotation_y(nx, ny, angle) * MAX_ROT;
        isHovering = true;
        aboutImage.classList.add('wasm-rotating');
    };
    const onMouseLeave = () => { isHovering = false; targetRotX = 0; targetRotY = 0; };

    const tick = () => {
        // expSmooth from C: anim_exp_smooth(current, target, lambda, dt)
        const dt = 1 / 60;
        const lambda = isHovering ? 60 : 30;
        currentRotX = M.expSmooth(currentRotX, targetRotX, lambda, dt);
        currentRotY = M.expSmooth(currentRotY, targetRotY, lambda, dt);
        aboutImage.style.transform = `perspective(800px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
        if (!isHovering && Math.abs(currentRotX) < 0.05 && Math.abs(currentRotY) < 0.05) {
            currentRotX = currentRotY = 0;
            aboutImage.style.transform = '';
            aboutImage.classList.remove('wasm-rotating');
        }
        requestAnimationFrame(tick);
    };

    imageContainer.addEventListener('mousemove', onMouseMove);
    imageContainer.addEventListener('mouseleave', onMouseLeave);
    imageContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }, { passive: true });
    imageContainer.addEventListener('touchend', onMouseLeave);
    requestAnimationFrame(tick);
};
document.addEventListener('DOMContentLoaded', () => setTimeout(initProfileImageRotation, 500));
window.addEventListener('vector2d-wasm-ready', () => setTimeout(initProfileImageRotation, 300));

// ============================================================================
// WASM WAVE SVG PATHS — C anim_wave only
// ============================================================================
const initWasmWaves = async () => {
    const paths = Array.from(document.querySelectorAll('.section-wave svg path, .sea-waves path'));
    if (!paths.length) return;
    await waitForWasm();
    if (!mathReady()) return;

    const parsed = paths.map(p => {
        const d = p.getAttribute('d') || '';
        const numMatches = d.match(/-?\d*\.?\d+/g) || [];
        const nums = numMatches.map(n => parseFloat(n));
        const yIndices = [];
        for (let i = 0; i < nums.length; i++) { if (i % 2 === 1) yIndices.push(i); }
        let idx = 0;
        const template = d.replace(/-?\d*\.?\d+/g, () => `{${idx++}}`);
        return { el: p, template, nums, yIndices };
    });

    const w = () => Math.max(320, window.innerWidth || 960);
    const TWO_PI = Math.PI * 2;

    const tick = (ts) => {
        const t = ts / 1000, ww = w();
        for (const entry of parsed) {
            const { el, template, nums: origNums, yIndices } = entry;
            const nums = origNums.slice();
            for (const yi of yIndices) {
                const x = nums[yi - 1] || 0;
                const nx = x / Math.max(1, ww);
                const amp = 30 + (1 - nx) * 35;
                const freq = 1.8 + nx * 2.0;
                const phase = nx * TWO_PI;
                // all trig from C
                const waveVal = M.wave(t, TWO_PI * freq, amp, phase);
                nums[yi] = origNums[yi] + (waveVal < 0 ? waveVal * 0.15 : waveVal);
            }
            el.setAttribute('d', template.replace(/\{(\d+)\}/g, (_, n) => Number(nums[Number(n)]).toFixed(2)));
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};
document.addEventListener('DOMContentLoaded', () => setTimeout(initWasmWaves, 200));
window.addEventListener('vector2d-wasm-ready', () => setTimeout(initWasmWaves, 300));

// ============================================================================
// BUBBLE LAYER — WASM handle API
// ============================================================================
const initBubbleLayer = async (opts = {}) => {
    const canvas = byId('bubbleLayer');
    if (!canvas) return;
    await waitForWasm();
    if (!window.Module?.cwrap) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cw = 0, ch = 0;
    const resize = () => {
        cw = window.innerWidth; ch = window.innerHeight;
        canvas.width = cw * dpr; canvas.height = ch * dpr;
        canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const ww = window.Module.cwrap;
    const create = ww('animation_handle_create', 'number', ['number', 'number', 'number', 'number', 'number']);
    const stepH = ww('animation_handle_step', null, ['number', 'number']);
    const getX = ww('animation_handle_get_x', 'number', ['number']);
    const getY = ww('animation_handle_get_y', 'number', ['number']);
    const destroy = ww('animation_handle_destroy', null, ['number']);
    if (!create || !stepH || !getX || !getY) return;

    const bubbles = [];
    const POP_COUNT = opts.count || 18;
    const makeBubble = () => {
        const startX = M.noise1(Math.random() * 1000, 1) * cw;
        const startY = ch + M.noise1(Math.random() * 999, 2) * 100 + 20;
        const endX = startX + (M.noise1(Math.random() * 998, 3) - 0.5) * 80;
        const endY = -50 - M.noise1(Math.random() * 997, 4) * 60;
        const dur = 6 + M.noise1(Math.random() * 996, 5) * 6;
        const radius = 4 + M.noise1(Math.random() * 995, 6) * 10;
        const handle = create(startX, startY, endX, endY, dur);
        return { handle, radius, hue: 190 + M.noise1(Math.random() * 994, 7) * 40, alpha: 0.08 + M.noise1(Math.random() * 993, 8) * 0.35 };
    };
    for (let i = 0; i < POP_COUNT; i++) bubbles.push(makeBubble());

    let last = performance.now();
    const tick = (ts) => {
        const dt = (ts - last) / 1000; last = ts;
        ctx.clearRect(0, 0, cw, ch);
        for (const b of bubbles) {
            try {
                stepH(b.handle, dt);
                const x = getX(b.handle), y = getY(b.handle);
                const grd = ctx.createRadialGradient(x - b.radius * 0.3, y - b.radius * 0.3, 0, x, y, b.radius * 1.8);
                grd.addColorStop(0, `rgba(255,255,255,${Math.min(0.9, b.alpha * 2)})`);
                grd.addColorStop(0.6, `hsla(${b.hue},80%,70%,${b.alpha})`);
                grd.addColorStop(1, `hsla(${b.hue},80%,50%,0)`);
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(x, y, b.radius * 1.6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.95, b.alpha * 0.8)})`; ctx.lineWidth = 1; ctx.arc(x, y, b.radius, 0, Math.PI * 2); ctx.stroke();
                if (y < -80 || x < -200 || x > cw + 200) {
                    if (destroy) try { destroy(b.handle); } catch (e) { }
                    const nb = makeBubble();
                    b.handle = nb.handle; b.radius = nb.radius; b.hue = nb.hue; b.alpha = nb.alpha;
                }
            } catch (e) { }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => {
        if (destroy) bubbles.forEach(b => { try { destroy(b.handle); } catch (e) { } });
    });
};

// ============================================================================
// LOADING SCREEN
// ============================================================================
const initLoadingScreen = () => {
    const screen = byId('loadingScreen'); if (!screen) return;
    const hide = () => { screen.classList.add('hidden'); setTimeout(() => { screen.style.display = 'none'; }, 900); };
    if (document.readyState === 'complete') setTimeout(hide, 800);
    else { window.addEventListener('load', () => setTimeout(hide, 600)); setTimeout(hide, 2500); }
};

// ============================================================================
// CURSOR TRAIL
// ============================================================================
const initCursorTrail = () => {
    const canvas = byId('cursorTrail'); if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); if (!ctx) return;
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
    window.__cursorCanvasCtx = ctx;
    window.__cursorCanvasRes = { w, h };
};

// ============================================================================
// SCROLL PROGRESS
// ============================================================================
const initScrollProgress = () => {
    const bar = byId('scrollProgress'); if (!bar) return;
    const update = () => {
        const y = window.scrollY || 0, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        bar.style.width = `${Math.max(0, Math.min(100, (y / max) * 100))}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// NAVBAR MORPH
// ============================================================================
const initNavbarMorph = () => {
    const navbar = byId('navbar'); if (!navbar) return;
    let scrolled = false;
    const update = () => { const now = (window.scrollY || 0) > 50; if (now !== scrolled) { scrolled = now; navbar.classList.toggle('scrolled', scrolled); } };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// SECTION REVEAL
// ============================================================================
const initSectionReveal = () => {
    const sels = ['.section-header', '.hero-content', '.hero-image', '.about-image', '.about-info', '.service-card', '.portfolio-item', '.contact-content', '.info-item', '.download-cv', '.social-links'];
    $$(sels.join(',')).forEach(el => { if (!el.classList.contains('anim-reveal')) el.classList.add('anim-reveal'); });
    $$('.about-image').forEach(el => el.classList.add('from-left'));
    $$('.about-info').forEach(el => el.classList.add('from-right'));
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) { if (e.isIntersecting) e.target.classList.add('revealed'); }
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    $$('.anim-reveal').forEach(el => io.observe(el));
};

// ============================================================================
// HERO CHAR SPLIT
// ============================================================================
const initHeroCharSplit = () => {
    const nameEl = byId('heroName');
    if (!nameEl || nameEl.dataset.charSplit) return;
    nameEl.dataset.charSplit = '1';
    const text = nameEl.textContent.trim(); if (!text) return;
    nameEl.innerHTML = '';
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    let ci = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') { const sp = document.createElement('span'); sp.className = 'anim-char-space'; nameEl.appendChild(sp); }
        else {
            const span = document.createElement('span'); span.className = 'anim-char'; span.textContent = text[i];
            span.style.transitionDelay = `${ci * 60}ms`; span.style.color = colors[ci % colors.length];
            nameEl.appendChild(span); ci++;
        }
    }
    nameEl.querySelectorAll('.anim-char').forEach(c => c.classList.add('visible'));
};

// ============================================================================
// TEXT SCRAMBLE — Math.random kept (not computational math)
// ============================================================================
const initTextScramble = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    $$('[data-scramble]').forEach(el => {
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
    if (!mathReady()) { el.textContent = target; return; }
    const duration = 1200, t0 = performance.now();
    el.classList.add('scrambling');
    const tick = (ts) => {
        const p = M.clamp01((ts - t0) / duration);
        const revealedCount = Math.floor(p * target.length);
        let result = '';
        for (let i = 0; i < target.length; i++) {
            if (i < revealedCount) result += target[i];
            else if (target[i] === ' ') result += ' ';
            else result += chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = result;
        if (p < 1) requestAnimationFrame(tick);
        else { el.textContent = target; el.classList.remove('scrambling'); }
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// HERO TYPING — reveal immediately (WASM only mode)
// ============================================================================
const startHeroTypingEffect = async () => {
    const lines = [{ el: byId('heroSubtitle') }, { el: byId('heroTagline') }, { el: byId('heroDescription') }].filter(x => x.el);
    for (const { el } of lines) { el.dataset.fullText = (el.textContent || '').trimEnd(); el.textContent = el.dataset.fullText; }
};

// ============================================================================
// HERO TILT — C expSmooth
// ============================================================================
const initHeroTilt = () => {
    const frame = byId('heroFrame'), hero = frame?.closest('.hero');
    if (!frame || !hero) return;
    if (!mathReady()) return;
    let trx = 0, try_ = 0, crx = 0, cry = 0, lastT = performance.now();
    hero.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        try_ = M.clamp01((e.clientX - cx) / (r.width / 2) * 0.5 + 0.5) * 30 - 15;
        trx = -(M.clamp01((e.clientY - cy) / (r.height / 2) * 0.5 + 0.5) * 30 - 15);
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { trx = 0; try_ = 0; }, { passive: true });
    const tick = (ts) => {
        const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000)); lastT = ts;
        crx = M.expSmooth(crx, trx, 60, dt);
        cry = M.expSmooth(cry, try_, 60, dt);
        frame.style.transform = `perspective(800px) rotateX(${crx}deg) rotateY(${cry}deg)`;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// SERVICE CARD TILT
// ============================================================================
const initServiceCardTilt = () => {
    if (!mathReady()) return;
    $$('.service-card').forEach(card => {
        if (!card.querySelector('.tilt-card-light')) { const l = document.createElement('div'); l.className = 'tilt-card-light'; card.appendChild(l); }
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            card.style.transform = `perspective(600px) rotateX(${(y - 0.5) * -18}deg) rotateY(${(x - 0.5) * 18}deg) scale(1.05)`;
            card.style.setProperty('--light-x', `${x * 100}%`);
            card.style.setProperty('--light-y', `${y * 100}%`);
        }, { passive: true });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; }, { passive: true });
    });
};

// ============================================================================
// MAGNETIC BUTTONS
// ============================================================================
const initMagneticButtons = () => {
    if (!mathReady()) return;
    $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.04)`;
        }, { passive: true });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; }, { passive: true });
    });
};

// ============================================================================
// BUTTON RIPPLE
// ============================================================================
const initButtonRipple = () => {
    $$('.cta-button, .download-cv, .submit-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!mathReady()) return;
            const r = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const size = Math.max(r.width, r.height) * 2;
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
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
        if (byId('cvDownloadConfirm')) return;
        const overlay = document.createElement('div');
        overlay.id = 'cvDownloadConfirm'; overlay.className = 'cv-modal-overlay';
        overlay.innerHTML = `<div class="cv-modal" role="dialog" aria-modal="true" aria-labelledby="cvModalTitle"><h3 id="cvModalTitle">Download CV</h3><p>Do you want to download this CV?</p><div class="cv-modal-actions"><button class="cv-yes">Yes</button><button class="cv-no">No</button></div></div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.querySelector('.cv-yes').addEventListener('click', () => {
            const a = document.createElement('a'); a.href = cvHref; a.setAttribute('download', 'Pratik_Maharjan_CV.pdf'); a.target = '_blank'; a.rel = 'noopener noreferrer';
            document.body.appendChild(a); a.click(); a.remove(); close();
        });
        overlay.querySelector('.cv-no').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    };
    $$('.download-cv').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); showConfirm(); }));
};

// ============================================================================
// CONTACT REDIRECT + SUCCESS POPUP
// ============================================================================
const showContactSuccessPopup = () => {
    if (byId('contactSuccessPopup')) return;
    const overlay = document.createElement('div');
    overlay.id = 'contactSuccessPopup'; overlay.className = 'cv-modal-overlay';
    overlay.innerHTML = `<div class="cv-modal" role="dialog" aria-modal="true"><h3>Message Sent</h3><p>We received your email — thank you for contacting us.</p><div class="cv-modal-actions"><button class="cv-ok">OK</button></div></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.cv-ok').addEventListener('click', close, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
};

const initContactRedirect = () => {
    const form = byId('contactForm'); if (!form) return;
    form.removeAttribute('target');
    form.addEventListener('submit', () => {
        try {
            const nextUrl = window.location.origin + window.location.pathname + '?sent=1';
            let nextInput = form.querySelector('input[name="_next"]');
            if (!nextInput) { nextInput = document.createElement('input'); nextInput.type = 'hidden'; nextInput.name = '_next'; form.appendChild(nextInput); }
            nextInput.value = nextUrl;
        } catch (err) { }
    });
};

// ============================================================================
// ABOUT TYPING ON VIEW
// ============================================================================
const initAboutTypingOnView = () => {
    const section = byId('about'); if (!section) return;
    const desc = byId('aboutDescription');
    const vals = Array.from(section.querySelectorAll('.info-value'));
    let started = false;
    const start = () => {
        if (started) return; started = true;
        const items = [];
        if (desc) items.push({ el: desc, delayMs: 0, perCharMs: 18 });
        vals.forEach((el, i) => items.push({ el, delayMs: 260 + i * 120, perCharMs: 24 }));
        typingEffect(items);
    };
    const io = new IntersectionObserver((entries) => { for (const e of entries) { if (e.isIntersecting) { start(); io.disconnect(); break; } } }, { threshold: 0.18 });
    io.observe(section);
};

const typingEffect = (items) => {
    if (!mathReady()) { (items || []).forEach(it => { if (it?.el) it.el.textContent = it.el.dataset.fullText || it.el.textContent || ''; }); return; }
    const targets = (items || []).filter(i => i?.el);
    for (const it of targets) {
        if (it.el.dataset.fullText) continue;
        it.el.dataset.fullText = (it.el.textContent || '').trimEnd();
        const h = it.el.getBoundingClientRect().height;
        if (h > 0) it.el.style.minHeight = h + 'px';
        it.el.textContent = '';
    }
    const t0 = performance.now();
    const tick = (ts) => {
        let active = false;
        for (const it of targets) {
            const full = it.el.dataset.fullText || ''; if (!full) continue;
            const local = ts - (t0 + (it.delayMs || 0)); if (local < 0) { active = true; continue; }
            const dur = Math.max(520, Math.min(3800, full.length * (it.perCharMs || 30)));
            const p = M.clamp01(local / dur);
            it.el.textContent = full.slice(0, Math.floor(M.easeInOutCubic(p) * full.length));
            if (p < 1) active = true;
        }
        if (active) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// ABOUT PARALLAX
// ============================================================================
const initAboutParallax = () => {
    const img = $('.about-image img'); if (!img) return;
    const update = () => {
        if (!mathReady()) return;
        const r = img.getBoundingClientRect();
        const vis = M.clamp01(1 - r.top / window.innerHeight);
        img.style.transform = `translateY(${(vis - 0.5) * -40}px)`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
};

// ============================================================================
// FOOTER SPRING-IN
// ============================================================================
const initFooterSpringIn = () => {
    const container = byId('socialLinks'); if (!container) return;
    const icons = Array.from(container.querySelectorAll('a'));
    icons.forEach(i => { i.style.opacity = '0'; i.style.transform = 'translateY(40px) scale(0.3) rotate(-20deg)'; });
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                if (!mathReady()) { icons.forEach(i => { i.style.opacity = ''; i.style.transform = ''; }); }
                else icons.forEach((icon, i) => setTimeout(() => springIn(icon), i * 100));
                io.disconnect(); break;
            }
        }
    }, { threshold: 0.3 });
    io.observe(container);
};

const springIn = (el) => {
    if (!mathReady()) return;
    const ease = M.easeOutElastic;
    const t0 = performance.now(), dur = 1000;
    const tick = (ts) => {
        const p = M.clamp01((ts - t0) / dur), e = ease(p);
        el.style.opacity = String(Math.min(1, p * 3));
        el.style.transform = `translateY(${(1 - e) * 40}px) scale(${0.3 + e * 0.7}) rotate(${(1 - e) * -20}deg)`;
        if (p < 1) requestAnimationFrame(tick);
        else { el.style.opacity = ''; el.style.transform = ''; }
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// CONTACT FIELD STAGGER
// ============================================================================
const initContactFieldStagger = () => {
    const form = byId('contactForm'); if (!form) return;
    const fields = Array.from(form.querySelectorAll('input, textarea, button'));
    fields.forEach(f => { f.style.opacity = '0'; f.style.transform = 'translateY(30px) scale(0.95)'; });
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                if (!mathReady()) { fields.forEach(f => { f.style.opacity = ''; f.style.transform = ''; }); }
                else fields.forEach((f, i) => setTimeout(() => {
                    const t0 = performance.now();
                    const tick = (ts) => {
                        const p = M.clamp01((ts - t0) / 650), ev = M.easeOutBack(p);
                        f.style.opacity = String(Math.min(1, p * 2.5));
                        f.style.transform = `translateY(${(1 - ev) * 30}px) scale(${0.95 + ev * 0.05})`;
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
// SCROLL VELOCITY INDICATOR
// ============================================================================
const initScrollVelocity = () => {
    const bar = document.createElement('div'); bar.className = 'scroll-velocity-bar'; document.body.appendChild(bar);
    let lastY = window.scrollY, lastT = performance.now(), velocity = 0;
    const tick = (ts) => {
        const y = window.scrollY, dt = Math.max(1, ts - lastT);
        const v = Math.abs(y - lastY) / dt * 16;
        velocity += (v - velocity) * 0.15;
        lastY = y; lastT = ts;
        const pct = Math.min(40, velocity * 3);
        bar.style.height = `${pct}%`;
        bar.classList.toggle('active', velocity > 0.5);
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// SHAPE REPEL / INTERACTIVE TITLES
// ============================================================================
const initInteractiveTitles = () => { window.__interactiveTitles = $$('.section-title, .section-subtitle, .hero-title, .hero-subtitle'); };
const initShapeRepel = () => { window.__floatingShapes = $$('.shape'); };

// ============================================================================
// UNIFIED SIMULATION — all sim math in C
// ============================================================================
const initUnifiedSimulation = async () => {
    await waitForWasm();
    const api = initUnifiedApi(); if (!api) return;

    const w = window.innerWidth, h = window.innerHeight;
    api.init(w | 0, h | 0, (Date.now() & 0x7fffffff) | 0);

    let mouseX = -100, mouseY = -100;
    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

    const titles = window.__interactiveTitles || [];
    titles.forEach((el, i) => {
        el.addEventListener('mouseenter', () => api.triggerSpring(i, (M?.noise1(i, 1) || 0) * 100 - 50, -800));
    });

    let lastT = performance.now();
    const tick = (ts) => {
        const dt = Math.min(0.05, (ts - lastT) / 1000); lastT = ts;
        const cw = window.innerWidth, ch = window.innerHeight;
        api.step(dt, ts / 1000, mouseX, mouseY, cw | 0, ch | 0);

        const ctx = window.__cursorCanvasCtx;
        if (ctx) {
            ctx.clearRect(0, 0, cw, ch);
            const { heap, base } = window.Wasm.getHeapI32AndBase(api.getCursorPtr() | 0);
            const count = api.getCursorCount() | 0, stride = api.getCursorStride() | 0;
            for (let i = 0; i < count; i++) {
                const o = base + i * stride;
                // fields are 16.16 int32 — divide by 65536
                const life = heap[o + 4] / 65536;
                if (life <= 0) continue;
                const x = heap[o] / 65536;
                const y = heap[o + 1] / 65536;
                const size = (heap[o + 5] / 65536) * life;
                const hue = heap[o + 6] / 65536;
                const alpha = life * 0.6;
                ctx.beginPath(); ctx.fillStyle = `hsla(${hue},80%,65%,${alpha})`; ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.fillStyle = `hsla(${hue},90%,70%,${alpha * 0.3})`; ctx.arc(x, y, size * 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        const shapes = window.__floatingShapes;
        if (shapes) {
            const { heap: h2, base: b2 } = window.Wasm.getHeapI32AndBase(api.getShapePtr() | 0);
            const count = api.getShapeCount() | 0, stride = api.getShapeStride() | 0;
            for (let i = 0; i < count && i < shapes.length; i++) {
                const o = b2 + i * stride;
                shapes[i].style.translate = `${h2[o] / 65536}px ${h2[o + 1] / 65536}px`;
            }
        }

        if (titles.length) {
            const { heap: h3, base: b3 } = window.Wasm.getHeapI32AndBase(api.getSpringPtr() | 0);
            const count = api.getSpringCount() | 0, stride = api.getSpringStride() | 0;
            for (let i = 0; i < count && i < titles.length; i++) {
                const o = b3 + i * stride;
                const x = h3[o] / 65536;
                const y = h3[o + 3] / 65536;
                if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
                    titles[i].style.translate = `${x}px ${y}px`;
                    titles[i].style.display = 'inline-block';
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
// PARALLAX SECTIONS
// ============================================================================
const initParallaxSections = () => {
    const sections = $$('section');
    const tick = () => {
        sections.forEach(section => {
            const r = section.getBoundingClientRect();
            if (r.top >= window.innerHeight || r.bottom <= 0) return;
            const progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
            const offset = (progress - 0.5) * -20;
            const header = section.querySelector('.section-header');
            if (header) header.style.transform = `translateY(${offset}px)`;
        });
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// PORTFOLIO TILT
// ============================================================================
const initPortfolioTilt = () => {
    $$('.portfolio-item').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const r = item.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
            item.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
        }, { passive: true });
        item.addEventListener('mouseleave', () => { item.style.transform = ''; }, { passive: true });
    });
};

// ============================================================================
// COUNTER ANIMATION — WASM easeOutBack
// ============================================================================
const initCounterAnimation = () => {
    const ageEl = byId('aboutAge'); if (!ageEl) return;
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting && !ageEl.dataset.counted) {
                ageEl.dataset.counted = '1';
                const text = ageEl.textContent || '', match = text.match(/(\d+)/);
                if (match && mathReady()) {
                    const target = parseInt(match[1]), suffix = text.replace(/\d+/, '').trim();
                    const t0 = performance.now(), dur = 1500;
                    const tick = (ts) => {
                        const p = M.clamp01((ts - t0) / dur);
                        ageEl.textContent = `${Math.round(M.easeOutBack(p) * target)} ${suffix}`;
                        if (p < 1) requestAnimationFrame(tick);
                        else ageEl.textContent = `${target} ${suffix}`;
                    };
                    requestAnimationFrame(tick);
                }
                io.disconnect();
            }
        }
    }, { threshold: 0.5 });
    io.observe(ageEl);
};

// ============================================================================
// LOGO ANIMATION
// ============================================================================
const initLogoAnimation = () => {
    const logo = byId('logoText'); if (!logo) return;
    logo.addEventListener('mouseenter', () => {
        const text = logo.textContent; logo.innerHTML = '';
        text.split('').forEach((char, i) => {
            const span = document.createElement('span'); span.textContent = char;
            span.style.cssText = `display:inline-block;animation:logoWave 0.6s ease ${i * 0.05}s`;
            logo.appendChild(span);
        });
    });
    const style = document.createElement('style');
    style.textContent = `@keyframes logoWave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`;
    document.head.appendChild(style);
};

// ============================================================================
// CUSTOM SMOOTH SCROLL — WASM easeInOutQuart
// ============================================================================
const customSmoothScroll = (targetY, ms = 800) => {
    if (!mathReady()) return;
    const startY = window.scrollY, diff = targetY - startY;
    if (Math.abs(diff) < 1) return;
    const t0 = performance.now();
    const tick = (ts) => {
        const p = M.clamp01((ts - t0) / ms);
        window.scrollTo(0, startY + diff * M.easeInOutQuart(p));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// INPUT WAVE
// ============================================================================
const initInputWave = () => {
    $$('.contact-form input, .contact-form textarea').forEach(input => {
        input.addEventListener('focus', () => { input.style.animation = 'inputFocusPop 0.4s ease'; setTimeout(() => { input.style.animation = ''; }, 400); });
    });
    const style = document.createElement('style');
    style.textContent = `@keyframes inputFocusPop{0%{transform:translateY(0) scale(1)}30%{transform:translateY(-4px) scale(1.01)}100%{transform:translateY(-3px) scale(1)}}`;
    document.head.appendChild(style);
};

// ============================================================================
// STRESS ANIMATIONS — domanim C kernel, HEAP32 for 16.16 output
// ============================================================================
const initStressAnimations = async () => {
    await waitForWasm();
    const api = initStressApi(); if (!api) return;

    document.body.classList.add('stress-on');
    let targets = [];
    const collect = () => {
        const sel = ['section', '.container', '.navbar', '.nav-link', '.hero-content', '.hero-title', '.hero-tagline', '.hero-description', '.cta-button', '.image-frame', '.about-content', '.about-image', '.about-info', '.info-item', '.download-cv', '.service-card', '.service-icon', '.portfolio-item', '.portfolio-overlay', '.contact-form', '.submit-button', '.section-header', '.section-title', '.social-links a'].join(',');
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
        const dt = Math.min(0.05, Math.max(0, (ts - lastT) / 1000)); lastT = ts;
        const y = window.scrollY || 0;
        const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
        // domanim_step now takes 16.16 fixed-point inputs
        api.step(
            (ts / 1000 * 65536) | 0,
            (dt * 65536) | 0,
            (M ? M.clamp01(y / maxS) * 65536 | 0 : 0),
            (M ? M.clamp01(pointerX / w) * 65536 | 0 : 32768),
            (M ? M.clamp01(pointerY / h) * 65536 | 0 : 32768)
        );

        const count = api.getCount() | 0, stride = api.getStride() | 0;
        const ptr = api.getPtr() >>> 0;
        const { heap, base } = window.Wasm.getHeapI32AndBase(ptr);
        const F = 1 / 65536; // scale factor from 16.16

        for (let i = 0; i < count && i < targets.length; i++) {
            const el = targets[i], o = base + i * stride, s = el.style;
            s.setProperty('--tx', `${heap[o] * F * 1.5}px`);
            s.setProperty('--ty', `${heap[o + 1] * F * 1.5}px`);
            s.setProperty('--rot', `${heap[o + 2] * F}deg`);
            s.setProperty('--sc', `${1 + (heap[o + 3] * F - 1) * 1.2}`);
            s.setProperty('--blur', `${heap[o + 4] * F * 1.8}px`);
            s.setProperty('--hue', `${heap[o + 5] * F * 1.3}deg`);
            s.setProperty('--sat', `${1 + (heap[o + 6] * F - 1) * 1.2}`);
            s.setProperty('--alpha', `${Math.max(0.6, heap[o + 7] * F)}`);
            if (stride >= 10) {
                s.setProperty('--glow', `${Math.min(1, heap[o + 8] * F * 1.5)}`);
                s.setProperty('--skew', `${heap[o + 9] * F * 0.8}deg`);
            }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// CANVAS PARTICLE FX — portfoliofx C kernel, HEAP32 for 16.16 output
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
        const px = e?.clientX ?? (w * 0.5), py = e?.clientY ?? (h * 0.35);
        try { if (wasm?.fx) { wasm.fx.setIsTouch(0); wasm.fx.setPointer(px, py); } } catch (err) { }
    };
    const onTouch = (e) => {
        if (!e.touches?.length) return;
        try { if (wasm?.fx) { wasm.fx.setIsTouch(1); wasm.fx.setPointer(e.touches[0].clientX, e.touches[0].clientY); } } catch (err) { }
    };
    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { running = document.visibilityState !== 'hidden'; });
    resize();

    await waitForWasm();
    wasm = initWasmApi(); if (!wasm?.fx) return;

    wasm.fx.setIsTouch(isTouch ? 1 : 0);
    wasm.fx.init(w, h, dpr, (Date.now() ^ (w << 16) ^ h) | 0);

    const F = 1 / 65536; // 16.16 scale factor
    let lastT = performance.now();
    const tick = (ts) => {
        if (!running) { lastT = ts; requestAnimationFrame(tick); return; }
        const dt = Math.min(0.05, (ts - lastT) / 1000); lastT = ts;
        // portfoliofx_step still takes float dt (float boundary kept for simplicity)
        wasm.fx.step(dt);

        spotlight.style.setProperty('--mx', `${wasm.fx.getMx()}%`);
        spotlight.style.setProperty('--my', `${wasm.fx.getMy()}%`);

        ctx.clearRect(0, 0, w, h);

        const count = wasm.fx.getParticleCount() | 0;
        const stride = wasm.fx.getParticleStride() | 0;
        const ptr = wasm.fx.getParticlesPtr() | 0;
        // output buffer is now int32 16.16
        const { heap, base } = window.Wasm.getHeapI32AndBase(ptr);

        for (let i = 0; i < count; i++) {
            const o = base + i * stride;
            const x = heap[o] * F;
            const y = heap[o + 1] * F;
            const r = heap[o + 4] * F;
            const hue = heap[o + 5] * F;
            const a = heap[o + 7] * F;  // alpha field
            ctx.beginPath(); ctx.fillStyle = `hsla(${hue},90%,65%,${a})`; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < count; i++) {
            const o = base + i * stride;
            const x = heap[o] * F;
            const y = heap[o + 1] * F;
            const r = heap[o + 4] * F;
            const hue = heap[o + 5] * F;
            const a = heap[o + 7] * F;
            ctx.beginPath();
            ctx.fillStyle = `hsla(${hue},90%,65%,${Math.min(0.9, a * 0.8)})`;
            ctx.shadowColor = `hsla(${hue},90%,65%,${Math.min(0.9, a)})`;
            ctx.shadowBlur = Math.max(8, r * 6);
            ctx.arc(x, y, r * 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// ============================================================================
// MAIN INIT
// ============================================================================
const initDom = () => {
    const qp = new URLSearchParams(window.location.search || '');
    if (qp.get('sent') === '1') {
        setTimeout(() => {
            showContactSuccessPopup();
            try { const u = new URL(window.location.href); u.searchParams.delete('sent'); history.replaceState({}, '', u.pathname + u.search); } catch (e) { }
        }, 250);
    }

    loadProfileFromXml().catch(() => { });
    initLoadingScreen();

    ['heroImg', 'aboutImg'].forEach(id => {
        const el = byId(id); if (!el) return;
        const mark = () => el.classList.add('img-ready');
        if (el.complete && el.naturalWidth > 0) mark();
        else { el.addEventListener('load', mark, { once: true }); setTimeout(mark, 1200); }
    });

    let charDone = false;
    const doChar = () => { if (charDone) return; charDone = true; initHeroCharSplit(); };
    window.addEventListener('profile-loaded', () => { if (!charDone) doChar(); }, { once: true });
    setTimeout(() => { if (!charDone && (byId('heroName')?.textContent || '').trim()) doChar(); }, 900);

    let typeDone = false;
    const doType = () => { if (typeDone) return; typeDone = true; startHeroTypingEffect(); };
    window.addEventListener('profile-loaded', () => { if (!typeDone) doType(); }, { once: true });
    setTimeout(() => { if (!typeDone && (byId('heroSubtitle')?.textContent || '').trim()) doType(); }, 950);

    initScrollProgress();
    initNavbarMorph();
    initSectionReveal();
    initTextScramble();
    window.addEventListener('profile-loaded', () => initTextScramble());
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
    initParallaxSections();
    initPortfolioTilt();
    initCounterAnimation();
    initLogoAnimation();
    initInputWave();

    const hamburger = byId('hamburger'), navMenu = byId('navMenu');
    if (hamburger && navMenu) hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navMenu.classList.toggle('active'); });

    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || ''; if (!href.startsWith('#')) return;
            e.preventDefault();
            hamburger?.classList.remove('active'); navMenu?.classList.remove('active');
            const target = $(href); if (target) customSmoothScroll(target.offsetTop - 80, 900);
        });
    });

    const heroCta = byId('heroCta');
    if (heroCta) heroCta.addEventListener('click', (e) => {
        e.preventDefault();
        const target = $('#about'); if (!target) return;
        const nav = byId('navbar'), offset = nav ? nav.offsetHeight : 80;
        customSmoothScroll(target.offsetTop - offset - 10, 900);
    });

    const secs = $$('section');
    window.addEventListener('scroll', () => {
        const y = window.pageYOffset || 0; let cur = '';
        secs.forEach(s => { if (y >= s.offsetTop - 100) cur = s.id; });
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
    }, { passive: true });

    // Wire up WASM-dependent systems after WASM loads
    waitForWasm().then(async () => {
        await initMathWasmBindings();
        initHeroTilt();
        initMathAnimations();
        initWasmWaves();
        initFx();
        initUnifiedSimulation();
        initStressAnimations();
    });
};

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initDom, { once: true });
else setTimeout(initDom, 0);