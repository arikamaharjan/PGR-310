// // ============================================================================
// // water_theme.js — FULL PAGE UNDERWATER IMMERSION (v5 — FIXED)
// // Phoenix centered + facing user, fish/bubbles in correct world-space coords
// // ============================================================================

// console.log('🔥 WATER THEME v2026-03-05-V6 LOADING 🔥');

// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// console.log('✅ Three.js imported, revision:', THREE.REVISION);

// if (!window.THREE) {
//     window.THREE = THREE;
// }

// (function () {
//     'use strict';

//     const FISH_COUNT = 500;
//     const BUBBLE_COUNT = 200;
//     const LUT_SIZE = 1024;

//     // ─── Precompute sin/cos lookup tables ──────────────────────────
//     const sinLUT = new Float32Array(LUT_SIZE);
//     const cosLUT = new Float32Array(LUT_SIZE);
//     for (let i = 0; i < LUT_SIZE; i++) {
//         const angle = (i / LUT_SIZE) * Math.PI * 2;
//         sinLUT[i] = Math.sin(angle);
//         cosLUT[i] = Math.cos(angle);
//     }

//     function fastSin(t) {
//         const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
//         return sinLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
//     }
//     function fastCos(t) {
//         const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
//         return cosLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
//     }

//     // ─── WASM wait ─────────────────────────────────────────────────
//     const waitWasm = () => new Promise((resolve) => {
//         const timeout = setTimeout(() => {
//             console.warn('WASM timeout - proceeding without WASM');
//             resolve(false);
//         }, 3000);

//         const check = () => {
//             if (window.Module && typeof window.Module.cwrap === 'function') {
//                 clearTimeout(timeout);
//                 resolve(true);
//             } else if (window.__vector2dWasmReady) {
//                 clearTimeout(timeout);
//                 resolve(true);
//             } else {
//                 setTimeout(check, 100);
//             }
//         };
//         check();
//     });

//     async function initUnderwater() {
//         console.log('🌊 Starting full-page underwater scene (v5 fixed)...');
//         const wasmReady = await waitWasm();

//         // JS fallbacks for math
//         const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
//         const noise2 = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };

//         // ─── Renderer / Scene / Camera ────────────────────────────────
//         const canvas = document.getElementById('threeThemeCanvas');
//         if (!canvas) {
//             console.error("Canvas #threeThemeCanvas not found");
//             return;
//         }

//         const renderer = new THREE.WebGLRenderer({
//             canvas,
//             alpha: true,
//             antialias: true,
//             powerPreference: 'high-performance'
//         });
//         renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
//         renderer.setSize(window.innerWidth, window.innerHeight);
//         renderer.outputColorSpace = THREE.SRGBColorSpace;

//         const scene = new THREE.Scene();
//         scene.fog = new THREE.FogExp2(0x1a3a52, 0.008);

//         // ─── Camera: orthographic-like setup using FOV + distance ────
//         // We use a perspective camera at z=0 looking at z=-1 world units.
//         // To make "world units" map cleanly to the screen we set up the
//         // frustum so that at z=0 the visible half-height = WORLD_H/2.
//         // We drive everything in WORLD_W × WORLD_H world units.
//         const WORLD_W = 200;   // world units wide
//         const WORLD_H = 100;   // world units tall
//         const CAM_Z = 100;   // camera sits at z=100, looks at z=0

//         const camera = new THREE.PerspectiveCamera(
//             2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI), // FOV derived from world height
//             window.innerWidth / window.innerHeight,
//             0.1,
//             3000
//         );
//         camera.position.set(0, 0, CAM_Z);

//         // ─── Lighting ────────────────────────────────────────────────
//         scene.add(new THREE.AmbientLight(0x6699cc, 0.8));

//         const sun = new THREE.DirectionalLight(0xffffff, 1.2);
//         sun.position.set(100, 200, 100);
//         scene.add(sun);

//         const light1 = new THREE.PointLight(0x66ccff, 0.5, 500);
//         light1.position.set(-80, 40, 20);
//         scene.add(light1);

//         const light2 = new THREE.PointLight(0x66ccff, 0.5, 500);
//         light2.position.set(80, 40, 20);
//         scene.add(light2);

//         // Fire glow for phoenix
//         const phoenixLight = new THREE.PointLight(0xff6600, 1.0, 80);
//         scene.add(phoenixLight);

//         // ─── Texture precaching ──────────────────────────────────────
//         const textureLoader = new THREE.TextureLoader();
//         const gltfLoader = new GLTFLoader();

//         function loadTex(url, timeout = 5000) {
//             return new Promise((resolve, reject) => {
//                 const timer = setTimeout(() => reject(new Error(`Texture timeout: ${url}`)), timeout);
//                 const tex = textureLoader.load(
//                     url,
//                     () => { clearTimeout(timer); resolve(tex); },
//                     undefined,
//                     (err) => { clearTimeout(timer); reject(err); }
//                 );
//             });
//         }

//         function makeFallbackFishTex(color) {
//             const c = document.createElement('canvas');
//             c.width = 128; c.height = 64;
//             const ctx = c.getContext('2d');
//             ctx.fillStyle = color;
//             ctx.beginPath();
//             ctx.ellipse(55, 32, 40, 18, 0, 0, Math.PI * 2);
//             ctx.fill();
//             ctx.beginPath();
//             ctx.moveTo(15, 32);
//             ctx.lineTo(0, 14);
//             ctx.lineTo(0, 50);
//             ctx.closePath();
//             ctx.fill();
//             ctx.fillStyle = '#000';
//             ctx.beginPath();
//             ctx.arc(80, 26, 4, 0, Math.PI * 2);
//             ctx.fill();
//             ctx.fillStyle = '#fff';
//             ctx.beginPath();
//             ctx.arc(81, 25, 1.5, 0, Math.PI * 2);
//             ctx.fill();
//             return new THREE.CanvasTexture(c);
//         }

//         function makeFallbackBubbleTex() {
//             const c = document.createElement('canvas');
//             c.width = c.height = 64;
//             const ctx = c.getContext('2d');
//             const g = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
//             g.addColorStop(0, 'rgba(255,255,255,0.9)');
//             g.addColorStop(0.5, 'rgba(200,230,255,0.6)');
//             g.addColorStop(1, 'rgba(150,200,255,0.1)');
//             ctx.fillStyle = g;
//             ctx.beginPath();
//             ctx.arc(32, 32, 30, 0, Math.PI * 2);
//             ctx.fill();
//             return new THREE.CanvasTexture(c);
//         }

//         console.log('⏳ Precaching textures...');
//         const [fishTex1, fishTex2, bubbleTex] = await Promise.all([
//             loadTex('/assets/no_skeleton_sprites/fish.webp').catch(() => makeFallbackFishTex('#ff8833')),
//             loadTex('/assets/no_skeleton_sprites/fish2.webp').catch(() => makeFallbackFishTex('#44aaff')),
//             // Use the confirmed bubble.png from /assets/sprites/
//             loadTex('/assets/sprites/bubble.webp').catch(() => makeFallbackBubbleTex()),
//         ]);
//         console.log('✅ All textures precached');

//         // ─── Water caustics overlay ──────────────────────────────────
//         const causticsGeo = new THREE.PlaneGeometry(WORLD_W * 2, WORLD_H * 2);
//         const causticsMat = new THREE.MeshBasicMaterial({
//             color: 0x88ccff,
//             transparent: true,
//             opacity: 0.12,
//             blending: THREE.AdditiveBlending,
//             depthWrite: false
//         });
//         const causticsPlane = new THREE.Mesh(causticsGeo, causticsMat);
//         causticsPlane.position.z = -30;
//         scene.add(causticsPlane);

//         // ─── Fish (instanced meshes) ─────────────────────────────────
//         // All positions now in WORLD units.
//         // Half-width visible at z=0 = WORLD_W/2 = 100, half-height = WORLD_H/2 = 50

//         const fishMat1 = new THREE.MeshBasicMaterial({
//             map: fishTex1, transparent: true, depthWrite: false, side: THREE.DoubleSide
//         });
//         const fishMat2 = new THREE.MeshBasicMaterial({
//             map: fishTex2, transparent: true, depthWrite: false, side: THREE.DoubleSide
//         });

//         // Fish size in world units — visible at this camera setup
//         const fishPlane = new THREE.PlaneGeometry(6, 3);
//         const half = Math.floor(FISH_COUNT / 2);
//         const fishInst1 = new THREE.InstancedMesh(fishPlane, fishMat1, half);
//         const fishInst2 = new THREE.InstancedMesh(fishPlane, fishMat2, FISH_COUNT - half);
//         fishInst1.frustumCulled = false;
//         fishInst2.frustumCulled = false;
//         scene.add(fishInst1, fishInst2);

//         // Fish state: [x, y, z, speed, baseY, phase, goingRight] per fish
//         const fishData = new Float32Array(FISH_COUNT * 7);
//         for (let i = 0; i < FISH_COUNT; i++) {
//             const base = i * 7;
//             const goingRight = Math.random() > 0.5 ? 1 : 0;
//             // speed in world-units per second
//             const speed = 8 + Math.random() * 16;
//             const baseY = (Math.random() - 0.5) * WORLD_H * 1.4;
//             // start off-screen left or right
//             const startX = goingRight
//                 ? (-WORLD_W / 2 - 10 - Math.random() * 40)
//                 : (WORLD_W / 2 + 10 + Math.random() * 40);
//             fishData[base] = startX;
//             fishData[base + 1] = baseY;
//             fishData[base + 2] = -10 + Math.random() * 20;  // z depth variation
//             fishData[base + 3] = speed;
//             fishData[base + 4] = baseY;
//             fishData[base + 5] = Math.random() * Math.PI * 2; // phase
//             fishData[base + 6] = goingRight;
//         }

//         // ─── Bubbles ─────────────────────────────────────────────────
//         const bubbleMat = new THREE.MeshBasicMaterial({
//             map: bubbleTex,
//             transparent: true,
//             opacity: 0.80,
//             blending: THREE.AdditiveBlending,
//             depthWrite: false
//         });

//         const bubblePlane = new THREE.PlaneGeometry(2, 2);
//         const bubblesInst = new THREE.InstancedMesh(bubblePlane, bubbleMat, BUBBLE_COUNT);
//         bubblesInst.frustumCulled = false;
//         scene.add(bubblesInst);

//         // Bubble state: [x, y, z, vy, vx, size, wiggle]
//         const bubbleData = new Float32Array(BUBBLE_COUNT * 7);
//         for (let i = 0; i < BUBBLE_COUNT; i++) {
//             const base = i * 7;
//             bubbleData[base] = (Math.random() - 0.5) * WORLD_W * 1.2;
//             bubbleData[base + 1] = -WORLD_H / 2 - Math.random() * 20;  // start below screen
//             bubbleData[base + 2] = -5 + Math.random() * 10;
//             bubbleData[base + 3] = 3 + Math.random() * 6;    // vy (world units/s)
//             bubbleData[base + 4] = (Math.random() - 0.5) * 1.5; // vx drift
//             bubbleData[base + 5] = 0.3 + Math.random() * 0.8;   // size scalar
//             bubbleData[base + 6] = Math.random() * Math.PI * 2;  // wiggle phase
//         }

//         // ─── Phoenix (CENTERED, facing user) ─────────────────────────
//         let phoenix = null;
//         let phoenixMixer = null;
//         let phoenixWings = [];

//         try {
//             const gltf = await new Promise((resolve, reject) => {
//                 const timer = setTimeout(() => reject(new Error('GLTF timeout')), 8000);
//                 gltfLoader.load(
//                     '/assets/sprites/phoenix_bird.glb',
//                     (g) => { clearTimeout(timer); resolve(g); },
//                     undefined,
//                     (e) => { clearTimeout(timer); reject(e); }
//                 );
//             });

//             phoenix = gltf.scene;

//             // ── Compute bounding box to auto-scale the GLB ──────────
//             const box = new THREE.Box3().setFromObject(phoenix);
//             const size = new THREE.Vector3();
//             box.getSize(size);
//             const maxDim = Math.max(size.x, size.y, size.z);
//             const targetSize = 50; // desired world-unit size — bigger than before
//             const scaleFactor = targetSize / (maxDim || 1);
//             phoenix.scale.setScalar(scaleFactor);

//             // Re-center the model at origin after scaling
//             const center = new THREE.Vector3();
//             box.getCenter(center).multiplyScalar(scaleFactor);
//             phoenix.position.sub(center);

//             // ── Make the phoenix face +Z (toward the camera) ─────────
//             // Most GLB models face +Y or -Z by default.
//             // Rotate 180° around Y so it faces toward the camera (+Z direction).
//             phoenix.rotation.y = Math.PI;

//             // Collect wing bones for flapping
//             phoenix.traverse((child) => {
//                 if (child.isMesh) {
//                     const n = (child.name || '').toLowerCase();
//                     if (n.includes('wing') || n.includes('feather')) {
//                         phoenixWings.push(child);
//                     }
//                     // Make materials emissive so they glow underwater
//                     if (child.material) {
//                         const mats = Array.isArray(child.material) ? child.material : [child.material];
//                         mats.forEach(m => {
//                             if (m.emissive !== undefined) {
//                                 m.emissive = new THREE.Color(0xff3300);
//                                 m.emissiveIntensity = 0.25;
//                             }
//                         });
//                     }
//                 }
//             });

//             if (gltf.animations && gltf.animations.length > 0) {
//                 phoenixMixer = new THREE.AnimationMixer(phoenix);
//                 gltf.animations.forEach((clip) => {
//                     phoenixMixer.clipAction(clip).play();
//                 });
//                 console.log('Phoenix animations loaded:', gltf.animations.length);
//             }

//             console.log('Phoenix GLB loaded and centered, scale:', scaleFactor);
//             scene.add(phoenix);

//         } catch (error) {
//             console.warn('Phoenix GLB failed, using fallback mesh:', error);

//             const pg = new THREE.Group();

//             const bodyMat = new THREE.MeshStandardMaterial({
//                 color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4
//             });
//             const body = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), bodyMat);
//             pg.add(body);

//             const wingMat = new THREE.MeshStandardMaterial({
//                 color: 0xff8833, emissive: 0xff4400, emissiveIntensity: 0.3,
//                 side: THREE.DoubleSide
//             });
//             const wingGeom = new THREE.ConeGeometry(3, 10, 8);

//             const lw = new THREE.Mesh(wingGeom, wingMat);
//             lw.rotation.z = Math.PI / 4;
//             lw.position.set(-7, 0, 0);
//             pg.add(lw);
//             phoenixWings.push(lw);

//             const rw = new THREE.Mesh(wingGeom, wingMat);
//             rw.rotation.z = -Math.PI / 4;
//             rw.position.set(7, 0, 0);
//             pg.add(rw);
//             phoenixWings.push(rw);

//             const tailMat = new THREE.MeshStandardMaterial({
//                 color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.3,
//                 side: THREE.DoubleSide
//             });
//             const tail = new THREE.Mesh(new THREE.ConeGeometry(2, 10, 6), tailMat);
//             tail.rotation.x = Math.PI / 2;
//             tail.position.set(0, -2, -5);
//             pg.add(tail);

//             // Head
//             const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), bodyMat);
//             head.position.set(0, 4, 4);
//             pg.add(head);

//             phoenix = pg;
//             scene.add(phoenix);
//         }

//         // ─── WASM math bindings (anim_lerp + anim_wave) ──────────────
//         let wasmLerp = null;
//         let wasmWave = null;
//         let wasmEase = null;

//         if (wasmReady && window.Module && typeof window.Module.cwrap === 'function') {
//             try {
//                 const has = (n) => typeof window.Module[`_${n}`] === 'function';
//                 if (has('anim_lerp'))
//                     wasmLerp = window.Module.cwrap('anim_lerp', 'number', ['number', 'number', 'number']);
//                 if (has('anim_wave'))
//                     wasmWave = window.Module.cwrap('anim_wave', 'number', ['number', 'number', 'number', 'number']);
//                 if (has('anim_ease_in_out_cubic'))
//                     wasmEase = window.Module.cwrap('anim_ease_in_out_cubic', 'number', ['number']);
//                 console.log('WASM math bindings: lerp=%s wave=%s ease=%s',
//                     !!wasmLerp, !!wasmWave, !!wasmEase);
//             } catch (e) {
//                 console.warn('WASM math bind failed:', e);
//             }
//         }

//         // JS fallbacks
//         const mathLerp = wasmLerp || ((a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t)));
//         const mathWave = wasmWave || ((t, freq, amp, phase) => Math.sin(t * freq + phase) * amp);
//         const mathEase = wasmEase || ((t) => { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; });

//         // ─── Phoenix waypoint system ──────────────────────────────────
//         // Waypoints in world space — a slow grand tour of the screen
//         const WAYPOINTS = [
//             new THREE.Vector3(0, 0, 0),   // center
//             new THREE.Vector3(35, 18, 0),   // top-right
//             new THREE.Vector3(40, -15, 0),   // right
//             new THREE.Vector3(0, -20, 0),   // bottom-center
//             new THREE.Vector3(-40, -15, 0),   // left
//             new THREE.Vector3(-35, 18, 0),   // top-left
//             new THREE.Vector3(0, 22, 0),   // top-center
//         ];
//         let wpFrom = 0;
//         let wpTo = 1;
//         let wpT = 0;       // 0→1 progress between waypoints
//         const WP_DUR = 3.5;     // seconds per segment

//         // ─── Animation loop ──────────────────────────────────────────
//         const clock = new THREE.Clock();
//         const dummy = new THREE.Object3D();

//         function animate() {
//             requestAnimationFrame(animate);

//             const dt = Math.min(clock.getDelta(), 0.033);
//             const t = clock.getElapsedTime();
//             const scrollY = window.scrollY || 0;

//             // Subtle camera drift with scroll
//             camera.position.y = -scrollY * 0.05;

//             // ── Fish ─────────────────────────────────────────────────
//             for (let i = 0; i < FISH_COUNT; i++) {
//                 const base = i * 7;
//                 let fx = fishData[base];
//                 const fz = fishData[base + 2];
//                 const fSpeed = fishData[base + 3];
//                 const fBaseY = fishData[base + 4];
//                 const fPhase = fishData[base + 5];
//                 const fRight = fishData[base + 6];

//                 const dir = fRight > 0.5 ? 1 : -1;
//                 fx += dir * fSpeed * dt;

//                 // Vertical undulation
//                 const bobFreq = 1.5 + (i % 5) * 0.2;
//                 const bobAmp = 1.5 + (i % 7) * 0.3;
//                 const fy = fBaseY + fastSin(t * bobFreq + fPhase) * bobAmp;

//                 // Wrap fish around screen edges (in world units)
//                 const wrapEdge = WORLD_W / 2 + 12;
//                 if (fRight > 0.5 && fx > wrapEdge) {
//                     fishData[base] = -wrapEdge;
//                     fishData[base + 4] = (Math.random() - 0.5) * WORLD_H * 1.3;
//                 } else if (fRight < 0.5 && fx < -wrapEdge) {
//                     fishData[base] = wrapEdge;
//                     fishData[base + 4] = (Math.random() - 0.5) * WORLD_H * 1.3;
//                 } else {
//                     fishData[base] = fx;
//                 }
//                 fishData[base + 1] = fy;

//                 dummy.position.set(fx, fy, fz);

//                 const bodyTilt = fastSin(t * bobFreq * 2 + fPhase) * 0.1;
//                 dummy.rotation.z = bodyTilt;

//                 const tailWiggle = 1 + fastSin(t * 8 + fPhase) * 0.08;
//                 // Fish texture faces LEFT by default.
//                 // Going right  → flip X (-1) so it faces the swim direction.
//                 // Going left   → keep X (+1), already faces left.
//                 const scaleX = fRight > 0.5 ? -1 : 1;
//                 dummy.scale.set(scaleX, tailWiggle, 1);
//                 dummy.updateMatrix();

//                 if (i < half) {
//                     fishInst1.setMatrixAt(i, dummy.matrix);
//                 } else {
//                     fishInst2.setMatrixAt(i - half, dummy.matrix);
//                 }
//             }

//             fishInst1.instanceMatrix.needsUpdate = true;
//             fishInst2.instanceMatrix.needsUpdate = true;

//             // ── Bubbles ───────────────────────────────────────────────
//             for (let i = 0; i < BUBBLE_COUNT; i++) {
//                 const base = i * 7;
//                 let bx = bubbleData[base];
//                 let by = bubbleData[base + 1];
//                 const bz = bubbleData[base + 2];
//                 const bvy = bubbleData[base + 3];
//                 const bSize = bubbleData[base + 5];
//                 const bWig = bubbleData[base + 6];

//                 by += bvy * dt;
//                 bx += fastSin(t * 1.5 + bWig) * 0.25 * dt * 60; // gentle horizontal drift

//                 const topEdge = WORLD_H / 2 + 5;
//                 if (by > topEdge) {
//                     by = -WORLD_H / 2 - Math.random() * 10;
//                     bx = (Math.random() - 0.5) * WORLD_W * 1.2;
//                 }

//                 bubbleData[base] = bx;
//                 bubbleData[base + 1] = by;

//                 dummy.position.set(bx, by, bz);
//                 dummy.rotation.z = 0;
//                 dummy.scale.setScalar(bSize * (1 + fastSin(t * 3 + i) * 0.1));
//                 dummy.updateMatrix();
//                 bubblesInst.setMatrixAt(i, dummy.matrix);
//             }
//             bubblesInst.instanceMatrix.needsUpdate = true;

//             // ── Caustics ──────────────────────────────────────────────
//             causticsMat.opacity = 0.08 + fastSin(t * 0.4) * 0.04;
//             causticsPlane.position.x = fastSin(t * 0.2) * 20;
//             causticsPlane.position.y = fastCos(t * 0.3) * 10 - scrollY * 0.05;

//             // ── Phoenix: WASM-driven waypoint movement ────────────────
//             if (phoenix) {
//                 // Advance waypoint timer
//                 wpT += dt / WP_DUR;
//                 if (wpT >= 1.0) {
//                     wpT = 0;
//                     wpFrom = wpTo;
//                     wpTo = (wpTo + 1) % WAYPOINTS.length;
//                 }

//                 // Eased progress 0→1 using WASM anim_ease_in_out_cubic (JS fallback ok)
//                 const easedT = mathEase(Math.max(0, Math.min(1, wpT)));

//                 const pFrom = WAYPOINTS[wpFrom];
//                 const pTo = WAYPOINTS[wpTo];

//                 // Use WASM anim_lerp for each axis (falls back to JS lerp if WASM unavailable)
//                 const px = mathLerp(pFrom.x, pTo.x, easedT);
//                 const py = mathLerp(pFrom.y, pTo.y, easedT) - scrollY * 0.05;
//                 const pz = mathLerp(pFrom.z, pTo.z, easedT);

//                 // Gentle hover bob on top of waypoint position (WASM anim_wave)
//                 const bobY = mathWave(t, Math.PI * 2 * 0.4, 1.2, 0);
//                 const bobX = mathWave(t, Math.PI * 2 * 0.27, 0.5, 1.1);

//                 phoenix.position.set(px + bobX, py + bobY, pz);

//                 // Face direction of travel: yaw toward movement vector
//                 const dx = pTo.x - pFrom.x;
//                 // Base faces camera (Math.PI). Add yaw based on horizontal travel direction.
//                 const travelYaw = dx !== 0 ? Math.sign(dx) * 0.25 : 0;
//                 const yawWobble = mathWave(t, Math.PI * 2 * 0.18, 0.12, 0);
//                 phoenix.rotation.y = Math.PI + travelYaw + yawWobble;

//                 // Gentle roll into turns + pitch bob
//                 phoenix.rotation.z = mathWave(t, Math.PI * 2 * 0.26, 0.06, 0.5);
//                 phoenix.rotation.x = mathWave(t, Math.PI * 2 * 0.22, 0.05, 0.8);

//                 // Wing flapping (fallback mesh wings only; GLB wings driven by mixer)
//                 if (phoenixWings.length > 0 && !phoenixMixer) {
//                     const flapAngle = fastSin(t * 7) * 0.55;
//                     phoenixWings.forEach((wing) => {
//                         if (wing.position.x < 0) {
//                             wing.rotation.z = Math.PI / 4 + flapAngle;
//                         } else {
//                             wing.rotation.z = -Math.PI / 4 - flapAngle;
//                         }
//                     });
//                 }

//                 // Pulsing fire glow follows phoenix
//                 phoenixLight.position.set(px + bobX, py + bobY, pz + 15);
//                 phoenixLight.intensity = 0.9 + fastSin(t * 3) * 0.35;

//                 phoenixMixer?.update(dt);
//             }

//             renderer.render(scene, camera);
//         }

//         animate();

//         // ─── Resize handler ───────────────────────────────────────────
//         window.addEventListener('resize', () => {
//             const w = window.innerWidth;
//             const h = window.innerHeight;
//             camera.aspect = w / h;
//             // Keep vertical FOV so WORLD_H stays fully visible
//             camera.fov = 2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI);
//             camera.updateProjectionMatrix();
//             renderer.setSize(w, h);
//         });

//         console.log('Underwater scene (v5 fixed) initialized — phoenix centered + facing user, fish/bubbles in world space');
//     }

//     initUnderwater().catch(err => console.error("Underwater init failed:", err));
// })();
// ============================================================================
// water_theme.js — FULL PAGE UNDERWATER IMMERSION (v6 — WASM MATH ONLY)
// All sin/cos/lerp/wave/ease sourced from C via WASM.
// No JS LUTs. No JS math fallbacks. Skips scene if WASM unavailable.
// ============================================================================

console.log('🔥 WATER THEME v2026-WASM LOADING 🔥');

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

console.log('✅ Three.js imported, revision:', THREE.REVISION);
if (!window.THREE) window.THREE = THREE;

(function () {
    'use strict';

    const FISH_COUNT = 2000;
    const BUBBLE_COUNT = 1000;

    // ─── WASM wait ─────────────────────────────────────────────────
    // Re-use the bridge from script.js if loaded first; otherwise poll.
    const waitWasm = () => {
        if (window.Wasm?.ready) return window.Wasm.ready;
        return new Promise((resolve) => {
            const timeout = setTimeout(() => { console.warn('WASM timeout — skipping water theme'); resolve(false); }, 3000);
            const check = () => {
                if (window.Module && typeof window.Module.cwrap === 'function') { clearTimeout(timeout); resolve(true); }
                else setTimeout(check, 100);
            };
            check();
        });
    };

    // ─── WASM math bindings (cached on W) ─────────────────────────
    // W.sin(a), W.cos(a)  → via vector2D_rotation_x/y(1, 0, angle) from C LUT
    // W.wave, W.lerp, W.ease, W.noise1 → direct C functions
    let W = null;

    const bindWasm = () => {
        if (!window.Module || typeof window.Module.cwrap !== 'function') return false;
        const w = window.Module.cwrap;
        const has = (n) => typeof window.Module[`_${n}`] === 'function';

        // Require the minimum set; bail if core functions missing
        if (!has('anim_wave') || !has('anim_lerp') || !has('vector2D_rotation_x')) return false;

        const rotX = w('vector2D_rotation_x', 'number', ['number', 'number', 'number']);
        const rotY = w('vector2D_rotation_y', 'number', ['number', 'number', 'number']);

        W = {
            // sin/cos go through the C LUT — zero Math.sin/Math.cos
            sin: (a) => rotY(1, 0, a),
            cos: (a) => rotX(1, 0, a),
            // anim functions
            wave: w('anim_wave', 'number', ['number', 'number', 'number', 'number']),
            lerp: w('anim_lerp', 'number', ['number', 'number', 'number']),
            ease: w('anim_ease_in_out_cubic', 'number', ['number']),
            noise1: has('anim_noise1') ? w('anim_noise1', 'number', ['number', 'number']) : null,
        };
        return true;
    };

    async function initUnderwater() {
        console.log('🌊 Starting underwater scene (v6 WASM math)...');

        const wasmReady = await waitWasm();
        if (!wasmReady || !bindWasm()) {
            console.warn('🚫 WASM not available — water theme skipped');
            return;
        }

        // ─── Renderer / Scene / Camera ────────────────────────────────
        const canvas = document.getElementById('threeThemeCanvas');
        if (!canvas) { console.error('Canvas #threeThemeCanvas not found'); return; }

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x1a3a52, 0.008);

        const WORLD_W = 200, WORLD_H = 100, CAM_Z = 100;
        const camera = new THREE.PerspectiveCamera(
            2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI),
            window.innerWidth / window.innerHeight,
            0.1, 3000
        );
        camera.position.set(0, 0, CAM_Z);

        // ─── Lighting ────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x6699cc, 0.8));
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(100, 200, 100); scene.add(sun);
        const light1 = new THREE.PointLight(0x66ccff, 0.5, 500); light1.position.set(-80, 40, 20); scene.add(light1);
        const light2 = new THREE.PointLight(0x66ccff, 0.5, 500); light2.position.set(80, 40, 20); scene.add(light2);
        const phoenixLight = new THREE.PointLight(0xff6600, 1.0, 80); scene.add(phoenixLight);

        // ─── Texture helpers ─────────────────────────────────────────
        const textureLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();

        const loadTex = (url, timeout = 5000) => new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Texture timeout: ${url}`)), timeout);
            const tex = textureLoader.load(url,
                () => { clearTimeout(timer); resolve(tex); },
                undefined,
                (err) => { clearTimeout(timer); reject(err); });
        });

        const makeFallbackFishTex = (color) => {
            const c = document.createElement('canvas'); c.width = 128; c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(55, 32, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(15, 32); ctx.lineTo(0, 14); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(80, 26, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(81, 25, 1.5, 0, Math.PI * 2); ctx.fill();
            return new THREE.CanvasTexture(c);
        };
        const makeFallbackBubbleTex = () => {
            const c = document.createElement('canvas'); c.width = c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
            g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(200,230,255,0.6)'); g.addColorStop(1, 'rgba(150,200,255,0.1)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
            return new THREE.CanvasTexture(c);
        };

        console.log('⏳ Precaching textures...');
        const [fishTex1, fishTex2, bubbleTex] = await Promise.all([
            loadTex('/assets/no_skeleton_sprites/fish.webp').catch(() => makeFallbackFishTex('#ff8833')),
            loadTex('/assets/no_skeleton_sprites/fish2.webp').catch(() => makeFallbackFishTex('#44aaff')),
            loadTex('/assets/sprites/bubble.webp').catch(() => makeFallbackBubbleTex()),
        ]);
        console.log('✅ Textures precached');

        // ─── Caustics overlay ────────────────────────────────────────
        const causticsMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
        const causticsPlane = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W * 2, WORLD_H * 2), causticsMat);
        causticsPlane.position.z = -30; scene.add(causticsPlane);

        // ─── Fish ────────────────────────────────────────────────────
        const fishMat1 = new THREE.MeshBasicMaterial({ map: fishTex1, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const fishMat2 = new THREE.MeshBasicMaterial({ map: fishTex2, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const fishPlane = new THREE.PlaneGeometry(6, 3);
        const half = Math.floor(FISH_COUNT / 2);
        const fishInst1 = new THREE.InstancedMesh(fishPlane, fishMat1, half);
        const fishInst2 = new THREE.InstancedMesh(fishPlane, fishMat2, FISH_COUNT - half);
        fishInst1.frustumCulled = fishInst2.frustumCulled = false;
        scene.add(fishInst1, fishInst2);

        // Fish state: [x, y, z, speed, baseY, phase, goingRight]
        // Use W.noise1 for deterministic spawn if available, otherwise uniform spread
        const fishData = new Float32Array(FISH_COUNT * 7);
        for (let i = 0; i < FISH_COUNT; i++) {
            const base = i * 7;
            const rng = (salt) => W.noise1 ? W.noise1(i * 13.37 + salt, 1) : (((i * 2654435761 + salt) >>> 0) / 0xFFFFFFFF);
            const goingRight = rng(0) > 0.5 ? 1 : 0;
            const speed = 8 + rng(1) * 16;
            const baseY = (rng(2) - 0.5) * WORLD_H * 1.4;
            const startX = goingRight
                ? (-WORLD_W / 2 - 10 - rng(3) * 40)
                : (WORLD_W / 2 + 10 + rng(3) * 40);
            fishData[base] = startX;
            fishData[base + 1] = baseY;
            fishData[base + 2] = -10 + rng(4) * 20;
            fishData[base + 3] = speed;
            fishData[base + 4] = baseY;
            fishData[base + 5] = rng(5) * Math.PI * 2;
            fishData[base + 6] = goingRight;
        }

        // ─── Bubbles ─────────────────────────────────────────────────
        const bubbleMat = new THREE.MeshBasicMaterial({ map: bubbleTex, transparent: true, opacity: 0.80, blending: THREE.AdditiveBlending, depthWrite: false });
        const bubblesInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), bubbleMat, BUBBLE_COUNT);
        bubblesInst.frustumCulled = false; scene.add(bubblesInst);

        const bubbleData = new Float32Array(BUBBLE_COUNT * 7);
        for (let i = 0; i < BUBBLE_COUNT; i++) {
            const base = i * 7;
            const rng = (salt) => W.noise1 ? W.noise1(i * 7.77 + salt, 2) : (((i * 1664525 + salt) >>> 0) / 0xFFFFFFFF);
            bubbleData[base] = (rng(0) - 0.5) * WORLD_W * 1.2;
            bubbleData[base + 1] = -WORLD_H / 2 - rng(1) * 20;
            bubbleData[base + 2] = -5 + rng(2) * 10;
            bubbleData[base + 3] = 3 + rng(3) * 6;           // vy
            bubbleData[base + 4] = (rng(4) - 0.5) * 1.5;     // vx drift
            bubbleData[base + 5] = 0.3 + rng(5) * 0.8;       // size scalar
            bubbleData[base + 6] = rng(6) * Math.PI * 2;      // wiggle phase
        }

        // ─── Phoenix ─────────────────────────────────────────────────
        let phoenix = null, phoenixMixer = null, phoenixWings = [];

        try {
            const gltf = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('GLTF timeout')), 8000);
                gltfLoader.load('/assets/sprites/phoenix_bird.glb',
                    (g) => { clearTimeout(timer); resolve(g); },
                    undefined,
                    (e) => { clearTimeout(timer); reject(e); });
            });
            phoenix = gltf.scene;
            const box = new THREE.Box3().setFromObject(phoenix);
            const size = new THREE.Vector3(); box.getSize(size);
            const scaleFactor = 50 / (Math.max(size.x, size.y, size.z) || 1);
            phoenix.scale.setScalar(scaleFactor);
            const center = new THREE.Vector3(); box.getCenter(center).multiplyScalar(scaleFactor);
            phoenix.position.sub(center);
            phoenix.rotation.y = Math.PI;

            phoenix.traverse((child) => {
                if (!child.isMesh) return;
                if ((child.name || '').toLowerCase().includes('wing') || (child.name || '').toLowerCase().includes('feather')) phoenixWings.push(child);
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(m => { if (m.emissive !== undefined) { m.emissive = new THREE.Color(0xff3300); m.emissiveIntensity = 0.25; } });
            });

            if (gltf.animations?.length > 0) {
                phoenixMixer = new THREE.AnimationMixer(phoenix);
                gltf.animations.forEach(clip => phoenixMixer.clipAction(clip).play());
            }
            scene.add(phoenix);
            console.log('Phoenix GLB loaded, scale:', scaleFactor);
        } catch (error) {
            console.warn('Phoenix GLB failed, using fallback mesh:', error);
            const pg = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4 });
            pg.add(new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), bodyMat));
            const wingMat = new THREE.MeshStandardMaterial({ color: 0xff8833, emissive: 0xff4400, emissiveIntensity: 0.3, side: THREE.DoubleSide });
            const lw = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 8), wingMat); lw.rotation.z = Math.PI / 4; lw.position.set(-7, 0, 0); pg.add(lw); phoenixWings.push(lw);
            const rw = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 8), wingMat); rw.rotation.z = -Math.PI / 4; rw.position.set(7, 0, 0); pg.add(rw); phoenixWings.push(rw);
            const tail = new THREE.Mesh(new THREE.ConeGeometry(2, 10, 6), new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
            tail.rotation.x = Math.PI / 2; tail.position.set(0, -2, -5); pg.add(tail);
            const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), bodyMat); head.position.set(0, 4, 4); pg.add(head);
            phoenix = pg; scene.add(phoenix);
        }

        // ─── Phoenix waypoints ────────────────────────────────────────
        const WAYPOINTS = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(35, 18, 0),
            new THREE.Vector3(40, -15, 0),
            new THREE.Vector3(0, -20, 0),
            new THREE.Vector3(-40, -15, 0),
            new THREE.Vector3(-35, 18, 0),
            new THREE.Vector3(0, 22, 0),
        ];
        let wpFrom = 0, wpTo = 1, wpT = 0;
        const WP_DUR = 3.5;
        const TWO_PI = Math.PI * 2;

        // ─── Animation loop ──────────────────────────────────────────
        const clock = new THREE.Clock();
        const dummy = new THREE.Object3D();

        function animate() {
            requestAnimationFrame(animate);

            const dt = Math.min(clock.getDelta(), 0.033);
            const t = clock.getElapsedTime();
            const scrollY = window.scrollY || 0;

            camera.position.y = -scrollY * 0.05;

            // ── Fish — all trig via W.sin/W.cos (C LUT) ─────────────
            for (let i = 0; i < FISH_COUNT; i++) {
                const base = i * 7;
                let fx = fishData[base];
                const fz = fishData[base + 2];
                const fSpeed = fishData[base + 3];
                const fBaseY = fishData[base + 4];
                const fPhase = fishData[base + 5];
                const fRight = fishData[base + 6];
                const dir = fRight > 0.5 ? 1 : -1;

                fx += dir * fSpeed * dt;

                // Vertical bob — W.wave calls C anim_wave → C LUT
                const bobFreq = 1.5 + (i % 5) * 0.2;
                const bobAmp = 1.5 + (i % 7) * 0.3;
                const fy = fBaseY + W.wave(t, bobFreq, bobAmp, fPhase);

                const wrapEdge = WORLD_W / 2 + 12;
                if (fRight > 0.5 && fx > wrapEdge) {
                    fishData[base] = -wrapEdge;
                    // deterministic new baseY relative to camera position
                    const noiseVal = W.noise1
                        ? W.noise1(i + (t | 0) * 7, 3)
                        : (((i ^ (t | 0)) * 2654435761 >>> 0) / 0xFFFFFFFF);
                    fishData[base + 4] = camera.position.y + (noiseVal - 0.5) * WORLD_H * 1.1;
                } else if (fRight < 0.5 && fx < -wrapEdge) {
                    fishData[base] = wrapEdge;
                    const noiseVal = W.noise1
                        ? W.noise1(i + (t | 0) * 7 + 1, 3)
                        : (((i ^ (t | 0) ^ 1) * 2654435761 >>> 0) / 0xFFFFFFFF);
                    fishData[base + 4] = camera.position.y + (noiseVal - 0.5) * WORLD_H * 1.1;
                } else {
                    fishData[base] = fx;
                }
                fishData[base + 1] = fy;

                dummy.position.set(fx, fy, fz);
                // body tilt: W.wave → C LUT sin
                dummy.rotation.z = W.wave(t, bobFreq * 2, 0.1, fPhase);
                // tail wiggle: W.wave → C LUT sin
                const tailWiggle = 1 + W.wave(t, 8, 0.08, fPhase);
                const scaleX = fRight > 0.5 ? -1 : 1;
                dummy.scale.set(scaleX, tailWiggle, 1);
                dummy.updateMatrix();

                if (i < half) fishInst1.setMatrixAt(i, dummy.matrix);
                else fishInst2.setMatrixAt(i - half, dummy.matrix);
            }
            fishInst1.instanceMatrix.needsUpdate = true;
            fishInst2.instanceMatrix.needsUpdate = true;

            // ── Bubbles — W.wave for drift and scale bob ─────────────
            for (let i = 0; i < BUBBLE_COUNT; i++) {
                const base = i * 7;
                let bx = bubbleData[base];
                let by = bubbleData[base + 1];
                const bz = bubbleData[base + 2];
                const bvy = bubbleData[base + 3];
                const bSize = bubbleData[base + 5];
                const bWig = bubbleData[base + 6];

                by += bvy * dt;
                // horizontal drift: W.wave → C LUT sin
                bx += W.wave(t, 1.5, 0.25, bWig) * dt * 60;

                if (by > camera.position.y + WORLD_H / 2 + 5) {
                    by = camera.position.y - WORLD_H / 2 - (W.noise1 ? W.noise1(i + (t | 0), 4) * 15 : 10);
                    bx = (W.noise1 ? (W.noise1(i + (t | 0) + 1, 5) - 0.5) : (Math.random() - 0.5)) * WORLD_W * 1.2;
                }

                bubbleData[base] = bx;
                bubbleData[base + 1] = by;

                dummy.position.set(bx, by, bz);
                dummy.rotation.z = 0;
                // scale bob: W.wave → C LUT sin
                dummy.scale.setScalar(bSize * (1 + W.wave(t, 3, 0.1, i)));
                dummy.updateMatrix();
                bubblesInst.setMatrixAt(i, dummy.matrix);
            }
            bubblesInst.instanceMatrix.needsUpdate = true;

            // ── Caustics — W.wave/W.sin for drift ────────────────────
            causticsMat.opacity = 0.08 + W.wave(t, 0.4, 0.04, 0);
            causticsPlane.position.x = W.wave(t, 0.2, 20, 0);
            causticsPlane.position.y = W.wave(t, 0.3, 10, Math.PI * 0.5) - scrollY * 0.05;

            // ── Phoenix — W.lerp + W.ease + W.wave (all C) ───────────
            if (phoenix) {
                wpT += dt / WP_DUR;
                if (wpT >= 1.0) { wpT = 0; wpFrom = wpTo; wpTo = (wpTo + 1) % WAYPOINTS.length; }

                const easedT = W.ease(Math.max(0, Math.min(1, wpT)));
                const pFrom = WAYPOINTS[wpFrom];
                const pTo = WAYPOINTS[wpTo];

                // W.lerp → C anim_lerp
                const px = W.lerp(pFrom.x, pTo.x, easedT);
                const py = W.lerp(pFrom.y, pTo.y, easedT) - scrollY * 0.05;
                const pz = W.lerp(pFrom.z, pTo.z, easedT);

                // W.wave → C anim_wave → C LUT sin
                const bobY = W.wave(t, TWO_PI * 0.4, 1.2, 0);
                const bobX = W.wave(t, TWO_PI * 0.27, 0.5, 1.1);

                phoenix.position.set(px + bobX, py + bobY, pz);

                const dx = pTo.x - pFrom.x;
                const travelYaw = dx !== 0 ? Math.sign(dx) * 0.25 : 0;
                const yawWobble = W.wave(t, TWO_PI * 0.18, 0.12, 0);
                phoenix.rotation.y = Math.PI + travelYaw + yawWobble;
                phoenix.rotation.z = W.wave(t, TWO_PI * 0.26, 0.06, 0.5);
                phoenix.rotation.x = W.wave(t, TWO_PI * 0.22, 0.05, 0.8);

                // Fallback wing flap (W.sin → C LUT)
                if (phoenixWings.length > 0 && !phoenixMixer) {
                    const flapAngle = W.sin(t * 7) * 0.55;
                    phoenixWings.forEach((wing) => {
                        wing.rotation.z = wing.position.x < 0 ? Math.PI / 4 + flapAngle : -Math.PI / 4 - flapAngle;
                    });
                }

                phoenixLight.position.set(px + bobX, py + bobY, pz + 15);
                phoenixLight.intensity = 0.9 + W.wave(t, 3, 0.35, 0);
                phoenixMixer?.update(dt);
            }

            renderer.render(scene, camera);
        }

        animate();

        window.addEventListener('resize', () => {
            const ww = window.innerWidth, hh = window.innerHeight;
            camera.aspect = ww / hh;
            camera.fov = 2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI);
            camera.updateProjectionMatrix();
            renderer.setSize(ww, hh);
        });

        console.log('🌊 Underwater scene (v6 WASM) initialized');
    }

    initUnderwater().catch(err => console.error('Underwater init failed:', err));
})();