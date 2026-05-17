// coral_scene.js — High-quality glowing coral bed at the portfolio footer
// Sprite sheet: 8 cols x 6 rows, each cell 71x53px on a 568x319 sheet
// Quality: pre-rendered glow cache, high smoothing, depth-layered layout
// Perf: IntersectionObserver throttle, batched draw passes, delta-time
// Usage: <script src="../js/coral_scene.js" defer></script>

(function () {
    'use strict';

    const SHEET_COLS = 8;
    const SHEET_ROWS = 6;
    const CELL_W = 71;
    const CELL_H = 53;
    const CANVAS_H = 280;        // slightly taller for more depth
    const CORAL_COUNT = 48;         // richer reef
    const SHEET_SRC = '../assets/sprites/no_bg_corals.png';

    // Large coral columns (0-indexed) – the bigger, more detailed sprites
    const GOOD_COLS = [0, 1, 2, 3, 4, 5];
    // Skip row 5 (grey/white) for more colorful results
    const GOOD_ROWS = [0, 1, 2, 3, 4];

    // Depth layers: back (small, dim), mid, front (large, bright)
    const LAYERS = [
        { count: 16, scaleMin: 1.8, scaleMax: 2.6, alphaSharp: 0.55, alphaGlow: 0.12, yOffset: 22 },
        { count: 18, scaleMin: 2.4, scaleMax: 3.4, alphaSharp: 0.78, alphaGlow: 0.20, yOffset: 8 },
        { count: 14, scaleMin: 3.0, scaleMax: 4.2, alphaSharp: 0.94, alphaGlow: 0.30, yOffset: -4 },
    ];

    let canvas, ctx, sheet, pageW, isReady = false;
    let corals = [];
    let glowCache = new Map();   // key: "row,col" → ImageBitmap/canvas
    let raf = null;
    let prevTimestamp = 0;
    let time = 0;
    let isVisible = true;

    // ── seeded pseudo-random for deterministic layout ──────────────────────
    function seededRandom(seed) {
        let s = seed | 0;
        return function () {
            s = (s * 1664525 + 1013904223) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    // ── pre-render glow for a single sprite cell ──────────────────────────
    function renderGlow(row, col) {
        const key = `${row},${col}`;
        if (glowCache.has(key)) return glowCache.get(key);

        // Render at 2x cell size for sharper result
        const pad = 8;
        const w = CELL_W * 2 + pad * 2;
        const h = CELL_H * 2 + pad * 2;
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const oc = off.getContext('2d');

        oc.imageSmoothingEnabled = true;
        oc.imageSmoothingQuality = 'high';

        // Draw scaled sprite
        oc.filter = 'blur(6px) brightness(1.7) saturate(1.3)';
        oc.drawImage(
            sheet,
            col * CELL_W, row * CELL_H, CELL_W, CELL_H,
            pad, pad, CELL_W * 2, CELL_H * 2
        );
        oc.filter = 'none';

        glowCache.set(key, { canvas: off, w, h, pad });
        return glowCache.get(key);
    }

    // ── build canvas ──────────────────────────────────────────────────────
    function buildCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'coralScene';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = [
            'position:absolute',
            'left:0',
            'bottom:0',
            'width:100%',
            'height:' + CANVAS_H + 'px',
            'pointer-events:none',
            'z-index:3',
            'image-rendering:auto',
        ].join(';');

        const footer = document.querySelector('footer.footer');
        if (footer) {
            footer.style.position = 'relative';
            footer.style.overflow = 'visible';
            footer.appendChild(canvas);
        } else {
            canvas.style.position = 'fixed';
            document.body.appendChild(canvas);
        }

        ctx = canvas.getContext('2d');

        // Set up IntersectionObserver to pause when off-screen
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                isVisible = entries[0].isIntersecting;
            }, { rootMargin: '100px' });
            observer.observe(canvas);
        }
    }

    // ── load sprite sheet ─────────────────────────────────────────────────
    function loadSheet() {
        return new Promise((resolve) => {
            sheet = new Image();
            sheet.onload = () => resolve(true);
            sheet.onerror = () => { console.warn('coral sprite failed to load'); resolve(false); };
            sheet.src = SHEET_SRC;
        });
    }

    // ── place corals across all depth layers ──────────────────────────────
    function placeCorals(w) {
        corals = [];
        const rng = seededRandom(42);

        for (let li = 0; li < LAYERS.length; li++) {
            const layer = LAYERS[li];
            const spacing = w / layer.count;

            for (let i = 0; i < layer.count; i++) {
                const row = GOOD_ROWS[Math.floor(rng() * GOOD_ROWS.length)];
                const col = GOOD_COLS[Math.floor(rng() * GOOD_COLS.length)];
                const scale = layer.scaleMin + rng() * (layer.scaleMax - layer.scaleMin);
                const x = spacing * i + (rng() - 0.5) * spacing * 0.85;
                const phase = rng() * Math.PI * 2;
                const speed = 0.3 + rng() * 0.5;
                const flip = rng() > 0.5 ? -1 : 1;
                const yJitter = (rng() - 0.5) * 12;

                corals.push({
                    row, col, scale, x, phase, speed, flip, yJitter,
                    layerIdx: li,
                    alphaSharp: layer.alphaSharp,
                    alphaGlow: layer.alphaGlow,
                    yOffset: layer.yOffset,
                    drawW: CELL_W * scale,
                    drawH: CELL_H * scale,
                });
            }
        }

        // Sort by layer (back first) then by scale within layer
        corals.sort((a, b) => {
            if (a.layerIdx !== b.layerIdx) return a.layerIdx - b.layerIdx;
            return a.scale - b.scale;
        });

        // Pre-render glow for each unique sprite used
        const seen = new Set();
        for (const c of corals) {
            const key = `${c.row},${c.col}`;
            if (!seen.has(key)) {
                renderGlow(c.row, c.col);
                seen.add(key);
            }
        }
    }

    // ── resize ────────────────────────────────────────────────────────────
    function resize() {
        pageW = document.body.scrollWidth || window.innerWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(pageW * dpr));
        canvas.height = Math.max(1, Math.round(CANVAS_H * dpr));
        canvas.style.height = CANVAS_H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        placeCorals(pageW);
    }

    // ── draw one frame ────────────────────────────────────────────────────
    function draw(timestamp) {
        raf = requestAnimationFrame(draw);

        // Skip rendering when off-screen
        if (!isVisible) return;

        // Delta time from rAF timestamp
        if (!prevTimestamp) prevTimestamp = timestamp;
        const dt = Math.min((timestamp - prevTimestamp) / 1000, 0.05);
        prevTimestamp = timestamp;
        time += dt;

        ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1) + 10, CANVAS_H + 10);

        // Deep water gradient behind corals
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grad.addColorStop(0, 'rgba(1, 10, 30, 0)');
        grad.addColorStop(0.3, 'rgba(1, 8, 22, 0.45)');
        grad.addColorStop(0.7, 'rgba(0, 6, 20, 0.7)');
        grad.addColorStop(1, 'rgba(0, 4, 14, 0.88)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, pageW + 10, CANVAS_H);

        // Sandy floor strip
        const sandGrad = ctx.createLinearGradient(0, CANVAS_H - 32, 0, CANVAS_H);
        sandGrad.addColorStop(0, 'rgba(10, 40, 70, 0)');
        sandGrad.addColorStop(0.5, 'rgba(12, 35, 65, 0.5)');
        sandGrad.addColorStop(1, 'rgba(8, 28, 50, 0.92)');
        ctx.fillStyle = sandGrad;
        ctx.fillRect(0, CANVAS_H - 32, pageW + 10, 32);

        // ── PASS 1: Glow layer (all corals) — single blend mode switch ──
        ctx.globalCompositeOperation = 'screen';

        for (const c of corals) {
            const sway = Math.sin(time * c.speed + c.phase) * 2.2;
            const baseY = CANVAS_H - c.drawH + c.yOffset + c.yJitter;
            const glow = glowCache.get(`${c.row},${c.col}`);
            if (!glow) continue;

            ctx.save();
            ctx.globalAlpha = c.alphaGlow;
            ctx.translate(c.x + c.drawW / 2, baseY + c.drawH / 2);
            ctx.scale(c.flip, 1);
            ctx.rotate(sway * 0.01);

            // Draw pre-rendered glow (already blurred+brightened)
            const glowScale = c.scale / 2;  // glow cache is at 2x cell size
            ctx.drawImage(
                glow.canvas,
                -glow.w * glowScale / 2,
                -glow.h * glowScale / 2,
                glow.w * glowScale,
                glow.h * glowScale
            );
            ctx.restore();
        }

        // ── PASS 2: Sharp sprites (all corals) ──────────────────────────
        for (const c of corals) {
            const sway = Math.sin(time * c.speed + c.phase) * 2.2;
            const baseY = CANVAS_H - c.drawH + c.yOffset + c.yJitter;

            ctx.save();
            ctx.globalAlpha = c.alphaSharp;
            ctx.translate(c.x + c.drawW / 2, baseY + c.drawH / 2);
            ctx.scale(c.flip, 1);
            ctx.rotate(sway * 0.01);

            // Draw sharp sprite — no filter, just high-quality scaling
            ctx.drawImage(
                sheet,
                c.col * CELL_W, c.row * CELL_H, CELL_W, CELL_H,
                -c.drawW / 2, -c.drawH / 2, c.drawW, c.drawH
            );
            ctx.restore();
        }

        // ── Pulse glow overlay ──────────────────────────────────────────
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.05 + 0.025 * Math.sin(time * 0.6);
        const shimmer = ctx.createLinearGradient(0, CANVAS_H * 0.25, 0, CANVAS_H);
        shimmer.addColorStop(0, 'rgba(60, 180, 255, 0)');
        shimmer.addColorStop(0.4, 'rgba(60, 180, 255, 0.4)');
        shimmer.addColorStop(0.7, 'rgba(40, 120, 220, 0.5)');
        shimmer.addColorStop(1, 'rgba(15, 60, 160, 0)');
        ctx.fillStyle = shimmer;
        ctx.fillRect(0, 0, pageW + 10, CANVAS_H);
        ctx.globalAlpha = 1;
    }

    // ── init ──────────────────────────────────────────────────────────────
    async function init() {
        buildCanvas();
        const ok = await loadSheet();
        if (!ok) return;

        resize();
        window.addEventListener('resize', resize);
        isReady = true;
        raf = requestAnimationFrame(draw);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();