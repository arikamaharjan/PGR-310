// // // ============================================================================
// // // water_theme.js — FULL PAGE UNDERWATER IMMERSION (v4 — CENTERED PHOENIX)
// // // Phoenix centered on screen, fish swim horizontally, precaching + precomputing
// // // ============================================================================

// // console.log('🔥 WATER THEME v2026-03-05-CENTERED LOADING 🔥');

// // import * as THREE from 'three';
// // import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// // console.log('✅ Three.js imported, revision:', THREE.REVISION);

// // if (!window.THREE) {
// //     window.THREE = THREE;
// // }

// // (function () {
// //     'use strict';

// //     const FISH_COUNT = 500;
// //     const BUBBLE_COUNT = 200;
// //     const LUT_SIZE = 1024;

// //     // ─── Precompute sin/cos lookup tables ──────────────────────────
// //     const sinLUT = new Float32Array(LUT_SIZE);
// //     const cosLUT = new Float32Array(LUT_SIZE);
// //     for (let i = 0; i < LUT_SIZE; i++) {
// //         const angle = (i / LUT_SIZE) * Math.PI * 2;
// //         sinLUT[i] = Math.sin(angle);
// //         cosLUT[i] = Math.cos(angle);
// //     }

// //     function fastSin(t) {
// //         const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
// //         return sinLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
// //     }
// //     function fastCos(t) {
// //         const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
// //         return cosLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
// //     }

// //     // ─── WASM wait ─────────────────────────────────────────────────
// //     const waitWasm = () => new Promise((resolve) => {
// //         const timeout = setTimeout(() => {
// //             console.warn('⚠️ WASM timeout - proceeding without WASM');
// //             resolve(false);
// //         }, 3000);

// //         const check = () => {
// //             if (window.Module && typeof window.Module.cwrap === 'function') {
// //                 clearTimeout(timeout);
// //                 resolve(true);
// //             } else if (window.__vector2dWasmReady) {
// //                 clearTimeout(timeout);
// //                 resolve(true);
// //             } else {
// //                 setTimeout(check, 100);
// //             }
// //         };
// //         check();
// //     });

// //     async function initUnderwater() {
// //         console.log('🌊 Starting full-page underwater scene (v4 centered)...');
// //         const wasmReady = await waitWasm();

// //         // WASM bindings
// //         let watersimInit, watersimStep, getFishPtr, getBubblePtr;
// //         let lerp, noise2, fbm2;

// //         if (wasmReady) {
// //             try {
// //                 const w = window.Module.cwrap;
// //                 watersimInit = w('watersim_init', null, ['number', 'number']);
// //                 watersimStep = w('watersim_step', null, ['number', 'number', 'number']);
// //                 getFishPtr = w('watersim_get_fish_buffer', 'number', []);
// //                 getBubblePtr = w('watersim_get_bubble_buffer', 'number', []);
// //                 lerp = w('anim_lerp', 'number', ['number', 'number', 'number']);
// //                 noise2 = w('anim_noise2', 'number', ['number', 'number']);
// //                 fbm2 = w('anim_fbm2', 'number', ['number', 'number', 'number']);
// //                 watersimInit(FISH_COUNT, BUBBLE_COUNT);
// //                 console.log('✅ WASM bindings initialized');
// //             } catch (e) {
// //                 console.warn('⚠️ WASM binding failed:', e);
// //             }
// //         }

// //         // JS fallbacks
// //         if (!lerp) lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
// //         if (!noise2) noise2 = (x, y) => {
// //             const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
// //             return n - Math.floor(n);
// //         };
// //         if (!fbm2) fbm2 = (x, y, octaves) => {
// //             let result = 0, amp = 1;
// //             for (let i = 0; i < octaves; i++) {
// //                 result += noise2(x, y) * amp;
// //                 x *= 2; y *= 2; amp *= 0.5;
// //             }
// //             return result;
// //         };

// //         // ─── Renderer / Scene / Camera ────────────────────────────────
// //         const canvas = document.getElementById('threeThemeCanvas');
// //         if (!canvas) {
// //             console.error("❌ Canvas #threeThemeCanvas not found");
// //             return;
// //         }

// //         const renderer = new THREE.WebGLRenderer({
// //             canvas,
// //             alpha: true,
// //             antialias: true,
// //             powerPreference: 'high-performance'
// //         });
// //         renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
// //         renderer.setSize(window.innerWidth, window.innerHeight);
// //         renderer.outputColorSpace = THREE.SRGBColorSpace;

// //         const scene = new THREE.Scene();
// //         scene.fog = new THREE.FogExp2(0x1a3a52, 0.006);

// //         const camera = new THREE.PerspectiveCamera(
// //             75,
// //             window.innerWidth / window.innerHeight,
// //             0.1,
// //             3000
// //         );
// //         camera.position.set(0, 0, 100);

// //         // ─── Lighting ────────────────────────────────────────────────
// //         scene.add(new THREE.AmbientLight(0x6699cc, 0.6));

// //         const sun = new THREE.DirectionalLight(0xffffff, 1.2);
// //         sun.position.set(100, 200, 100);
// //         scene.add(sun);

// //         const light1 = new THREE.PointLight(0x66ccff, 0.5, 500);
// //         light1.position.set(-200, 100, 50);
// //         scene.add(light1);

// //         const light2 = new THREE.PointLight(0x66ccff, 0.5, 500);
// //         light2.position.set(200, 100, 50);
// //         scene.add(light2);

// //         // Fire glow light for phoenix
// //         const phoenixLight = new THREE.PointLight(0xff6600, 0.8, 300);
// //         scene.add(phoenixLight);

// //         // ─── Texture precaching ──────────────────────────────────────
// //         const textureLoader = new THREE.TextureLoader();
// //         const gltfLoader = new GLTFLoader();

// //         function loadTex(url, timeout = 5000) {
// //             return new Promise((resolve, reject) => {
// //                 const timer = setTimeout(() => reject(new Error(`Texture timeout: ${url}`)), timeout);
// //                 const tex = textureLoader.load(
// //                     url,
// //                     () => { clearTimeout(timer); resolve(tex); },
// //                     undefined,
// //                     (err) => { clearTimeout(timer); reject(err); }
// //                 );
// //             });
// //         }

// //         function makeFallbackFishTex(color) {
// //             const c = document.createElement('canvas');
// //             c.width = 128; c.height = 64;
// //             const ctx = c.getContext('2d');
// //             // Draw a proper fish shape
// //             ctx.fillStyle = color;
// //             ctx.beginPath();
// //             // Body ellipse
// //             ctx.ellipse(55, 32, 40, 18, 0, 0, Math.PI * 2);
// //             ctx.fill();
// //             // Tail
// //             ctx.beginPath();
// //             ctx.moveTo(15, 32);
// //             ctx.lineTo(0, 14);
// //             ctx.lineTo(0, 50);
// //             ctx.closePath();
// //             ctx.fill();
// //             // Eye
// //             ctx.fillStyle = '#000';
// //             ctx.beginPath();
// //             ctx.arc(80, 26, 4, 0, Math.PI * 2);
// //             ctx.fill();
// //             ctx.fillStyle = '#fff';
// //             ctx.beginPath();
// //             ctx.arc(81, 25, 1.5, 0, Math.PI * 2);
// //             ctx.fill();
// //             return new THREE.CanvasTexture(c);
// //         }

// //         function makeFallbackBubbleTex() {
// //             const c = document.createElement('canvas');
// //             c.width = c.height = 64;
// //             const ctx = c.getContext('2d');
// //             const g = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
// //             g.addColorStop(0, 'rgba(255,255,255,0.9)');
// //             g.addColorStop(0.5, 'rgba(200,230,255,0.6)');
// //             g.addColorStop(1, 'rgba(150,200,255,0.1)');
// //             ctx.fillStyle = g;
// //             ctx.beginPath();
// //             ctx.arc(32, 32, 30, 0, Math.PI * 2);
// //             ctx.fill();
// //             return new THREE.CanvasTexture(c);
// //         }

// //         console.log('⏳ Precaching textures...');
// //         const [fishTex1, fishTex2, bubbleTex] = await Promise.all([
// //             loadTex('/assets/no_skeleton_sprites/fish.png').catch(() => makeFallbackFishTex('#ff8833')),
// //             loadTex('/assets/no_skeleton_sprites/fish2.png').catch(() => makeFallbackFishTex('#ffaa44')),
// //             loadTex('/assets/sprites/bubble.png').catch(() => makeFallbackBubbleTex()),
// //         ]);
// //         console.log('✅ All textures precached');

// //         // ─── Water caustics overlay ──────────────────────────────────
// //         const causticsGeo = new THREE.PlaneGeometry(window.innerWidth * 2, window.innerHeight * 2);
// //         const causticsMat = new THREE.MeshBasicMaterial({
// //             color: 0x88ccff,
// //             transparent: true,
// //             opacity: 0.15,
// //             blending: THREE.AdditiveBlending,
// //             depthWrite: false
// //         });
// //         const causticsPlane = new THREE.Mesh(causticsGeo, causticsMat);
// //         causticsPlane.position.z = -10;
// //         scene.add(causticsPlane);

// //         // ─── Fish (instanced meshes — TRUE SWIMMING) ─────────────────
// //         const fishMat1 = new THREE.MeshBasicMaterial({
// //             map: fishTex1, transparent: true, depthWrite: false, side: THREE.DoubleSide
// //         });
// //         const fishMat2 = new THREE.MeshBasicMaterial({
// //             map: fishTex2, transparent: true, depthWrite: false, side: THREE.DoubleSide
// //         });

// //         const fishPlane = new THREE.PlaneGeometry(8, 4.5);
// //         const half = Math.floor(FISH_COUNT / 2);
// //         const fishInst1 = new THREE.InstancedMesh(fishPlane, fishMat1, half);
// //         const fishInst2 = new THREE.InstancedMesh(fishPlane, fishMat2, FISH_COUNT - half);
// //         scene.add(fishInst1, fishInst2);

// //         const vw = window.innerWidth;
// //         const vh = window.innerHeight;

// //         // Fish state: [x, y, z, speed, baseY, phase, goingRight] = 7 floats per fish
// //         const fishData = new Float32Array(FISH_COUNT * 7);
// //         for (let i = 0; i < FISH_COUNT; i++) {
// //             const base = i * 7;
// //             const goingRight = Math.random() > 0.5 ? 1 : 0;
// //             const speed = 20 + Math.random() * 40; // pixels per second
// //             const baseY = (Math.random() - 0.5) * vh * 1.5;
// //             fishData[base] = goingRight ? (-vw - Math.random() * 200) : (vw + Math.random() * 200); // x
// //             fishData[base + 1] = baseY;                          // y
// //             fishData[base + 2] = -50 + Math.random() * 100;     // z (depth)
// //             fishData[base + 3] = speed;                          // speed
// //             fishData[base + 4] = baseY;                          // baseY (for undulation)
// //             fishData[base + 5] = Math.random() * Math.PI * 2;   // phase
// //             fishData[base + 6] = goingRight;                     // direction
// //         }

// //         // ─── Bubbles ─────────────────────────────────────────────────
// //         const bubbleMat = new THREE.MeshBasicMaterial({
// //             map: bubbleTex,
// //             transparent: true,
// //             opacity: 0.75,
// //             blending: THREE.AdditiveBlending,
// //             depthWrite: false
// //         });

// //         const bubblePlane = new THREE.PlaneGeometry(3, 3);
// //         const bubblesInst = new THREE.InstancedMesh(bubblePlane, bubbleMat, BUBBLE_COUNT);
// //         scene.add(bubblesInst);

// //         const bubbleData = new Float32Array(BUBBLE_COUNT * 7);
// //         for (let i = 0; i < BUBBLE_COUNT; i++) {
// //             const base = i * 7;
// //             bubbleData[base] = (Math.random() - 0.5) * vw * 1.5;
// //             bubbleData[base + 1] = -vh - Math.random() * 200;
// //             bubbleData[base + 2] = -30 + Math.random() * 60;
// //             bubbleData[base + 3] = 20 + Math.random() * 30;   // vy
// //             bubbleData[base + 4] = (Math.random() - 0.5) * 10; // vx
// //             bubbleData[base + 5] = 0.5 + Math.random() * 1.5;  // size
// //             bubbleData[base + 6] = Math.random() * Math.PI * 2; // wiggle
// //         }

// //         // ─── Phoenix (CENTERED on screen) ────────────────────────────
// //         let phoenix = null;
// //         let phoenixMixer = null;
// //         let phoenixWings = [];

// //         try {
// //             const gltf = await new Promise((resolve, reject) => {
// //                 const timer = setTimeout(() => reject(new Error('GLTF timeout')), 8000);
// //                 gltfLoader.load(
// //                     '/assets/sprites/phoenix_bird.glb',
// //                     (g) => { clearTimeout(timer); resolve(g); },
// //                     undefined,
// //                     (e) => { clearTimeout(timer); reject(e); }
// //                 );
// //             });

// //             phoenix = gltf.scene;
// //             phoenix.scale.setScalar(6);
// //             scene.add(phoenix);

// //             phoenix.traverse((child) => {
// //                 if (child.isMesh && (child.name.toLowerCase().includes('wing') ||
// //                     child.name.toLowerCase().includes('feather'))) {
// //                     phoenixWings.push(child);
// //                 }
// //             });

// //             if (gltf.animations && gltf.animations.length > 0) {
// //                 phoenixMixer = new THREE.AnimationMixer(phoenix);
// //                 gltf.animations.forEach((clip) => {
// //                     phoenixMixer.clipAction(clip).play();
// //                 });
// //                 console.log('✅ Phoenix animations loaded');
// //             }
// //         } catch (error) {
// //             console.warn('Phoenix GLB failed, creating fallback:', error);
// //             const pg = new THREE.Group();

// //             const bodyMat = new THREE.MeshStandardMaterial({
// //                 color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.3
// //             });
// //             const body = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), bodyMat);
// //             pg.add(body);

// //             const wingMat = new THREE.MeshStandardMaterial({
// //                 color: 0xff8833, emissive: 0xff4400, emissiveIntensity: 0.3
// //             });
// //             const wingGeom = new THREE.ConeGeometry(3, 10, 8);

// //             const lw = new THREE.Mesh(wingGeom, wingMat);
// //             lw.rotation.z = Math.PI / 4;
// //             lw.position.set(-6, 0, 0);
// //             pg.add(lw); phoenixWings.push(lw);

// //             const rw = new THREE.Mesh(wingGeom, wingMat);
// //             rw.rotation.z = -Math.PI / 4;
// //             rw.position.set(6, 0, 0);
// //             pg.add(rw); phoenixWings.push(rw);

// //             const tail = new THREE.Mesh(new THREE.ConeGeometry(2, 12, 6), wingMat);
// //             tail.rotation.x = Math.PI / 2;
// //             tail.position.set(0, -2, -6);
// //             pg.add(tail);

// //             phoenix = pg;
// //             scene.add(phoenix);
// //         }

// //         console.log('✅ Phoenix loaded — centered on screen');

// //         // ─── Animation loop ─────────────────────────────────────────
// //         const clock = new THREE.Clock();
// //         const dummy = new THREE.Object3D();

// //         function animate() {
// //             requestAnimationFrame(animate);

// //             const dt = Math.min(clock.getDelta(), 0.033);
// //             const t = clock.getElapsedTime();
// //             const scrollY = window.scrollY || 0;

// //             camera.position.y = -scrollY * 0.3;

// //             // ── Fish: REAL SWIMMING (horizontal movement + undulation) ──
// //             for (let i = 0; i < FISH_COUNT; i++) {
// //                 const base = i * 7;
// //                 let fx = fishData[base];
// //                 let fy = fishData[base + 1];
// //                 const fz = fishData[base + 2];
// //                 const fSpeed = fishData[base + 3];
// //                 const fBaseY = fishData[base + 4];
// //                 const fPhase = fishData[base + 5];
// //                 const fRight = fishData[base + 6];

// //                 // Horizontal swimming — steady forward movement
// //                 const dir = fRight > 0.5 ? 1 : -1;
// //                 fx += dir * fSpeed * dt;

// //                 // Vertical undulation — gentle sine wave bobbing (like a real fish)
// //                 const bobFreq = 1.5 + (i % 5) * 0.2;
// //                 const bobAmp = 3 + (i % 7) * 0.8;
// //                 fy = fBaseY + fastSin(t * bobFreq + fPhase) * bobAmp;

// //                 // Wrap around screen edges
// //                 if (fRight > 0.5 && fx > vw + 100) {
// //                     fx = -vw - 100;
// //                     // Randomize Y position on reset for variety
// //                     fishData[base + 4] = (Math.random() - 0.5) * vh * 1.5;
// //                 } else if (fRight < 0.5 && fx < -vw - 100) {
// //                     fx = vw + 100;
// //                     fishData[base + 4] = (Math.random() - 0.5) * vh * 1.5;
// //                 }

// //                 fishData[base] = fx;
// //                 fishData[base + 1] = fy;

// //                 // Instance matrix
// //                 dummy.position.set(fx, fy, fz);

// //                 // Fish faces swimming direction, with slight body rotation from undulation
// //                 const bodyTilt = fastSin(t * bobFreq * 2 + fPhase) * 0.12;
// //                 dummy.rotation.z = bodyTilt;

// //                 // Tail wiggle — scale Y oscillation for swimming effect
// //                 const tailWiggle = 1 + fastSin(t * 8 + fPhase) * 0.08;
// //                 const scaleX = fRight > 0.5 ? 1 : -1; // flip fish to face direction
// //                 dummy.scale.set(scaleX, tailWiggle, 1);
// //                 dummy.updateMatrix();

// //                 if (i < half) {
// //                     fishInst1.setMatrixAt(i, dummy.matrix);
// //                 } else {
// //                     fishInst2.setMatrixAt(i - half, dummy.matrix);
// //                 }
// //             }

// //             fishInst1.instanceMatrix.needsUpdate = true;
// //             fishInst2.instanceMatrix.needsUpdate = true;

// //             // ── Bubbles ────────────────────────────────────────────────
// //             for (let i = 0; i < BUBBLE_COUNT; i++) {
// //                 const base = i * 7;
// //                 let bx = bubbleData[base];
// //                 let by = bubbleData[base + 1];
// //                 const bz = bubbleData[base + 2];
// //                 const bvy = bubbleData[base + 3];
// //                 const bSize = bubbleData[base + 5];
// //                 const bWiggle = bubbleData[base + 6];

// //                 by += bvy * dt;
// //                 bx += fastSin(t * 2 + bWiggle) * 0.5;

// //                 if (by > vh + 100) {
// //                     by = -vh - Math.random() * 200;
// //                     bx = (Math.random() - 0.5) * vw * 1.5;
// //                 }

// //                 bubbleData[base] = bx;
// //                 bubbleData[base + 1] = by;

// //                 dummy.position.set(bx, by, bz);
// //                 dummy.rotation.z = 0;
// //                 dummy.scale.setScalar(bSize * (1 + fastSin(t * 4 + i) * 0.15));
// //                 dummy.updateMatrix();
// //                 bubblesInst.setMatrixAt(i, dummy.matrix);
// //             }
// //             bubblesInst.instanceMatrix.needsUpdate = true;

// //             // ── Caustics ───────────────────────────────────────────────
// //             causticsMat.opacity = 0.1 + fastSin(t * 0.5) * 0.05;
// //             causticsPlane.position.x = fastSin(t * 0.3) * 50;
// //             causticsPlane.position.y = -scrollY * 0.3 + fastCos(t * 0.4) * 30;

// //             // ── Phoenix: CENTERED with gentle orbit ────────────────────
// //             if (phoenix) {
// //                 // Small gentle orbit around center of screen
// //                 const orbitRadiusX = 120;
// //                 const orbitRadiusY = 40;
// //                 const orbitSpeed = 0.15; // slow orbit

// //                 phoenix.position.x = fastSin(t * orbitSpeed) * orbitRadiusX;
// //                 phoenix.position.y = fastCos(t * orbitSpeed * 1.3) * orbitRadiusY - scrollY * 0.3;
// //                 phoenix.position.z = -20;

// //                 // Face movement direction
// //                 const vx = fastCos(t * orbitSpeed) * orbitSpeed * orbitRadiusX;
// //                 const targetRotY = Math.atan2(0, vx) * 0.3;
// //                 phoenix.rotation.y = THREE.MathUtils.lerp(phoenix.rotation.y, targetRotY, 0.05);

// //                 // Gentle banking into turns
// //                 phoenix.rotation.z = -fastCos(t * orbitSpeed) * 0.08;

// //                 // Pitch (nose up/down with vertical movement)
// //                 phoenix.rotation.x = fastSin(t * orbitSpeed * 1.3) * 0.06;

// //                 // Wing flapping
// //                 if (phoenixWings.length > 0) {
// //                     const flapAngle = fastSin(t * 8) * 0.6;
// //                     phoenixWings.forEach((wing) => {
// //                         if (wing.position.x < 0) {
// //                             wing.rotation.z = Math.PI / 4 + flapAngle;
// //                         } else {
// //                             wing.rotation.z = -Math.PI / 4 - flapAngle;
// //                         }
// //                     });
// //                 }

// //                 // Phoenix glow follows
// //                 phoenixLight.position.copy(phoenix.position);
// //                 phoenixLight.position.z += 20;

// //                 phoenixMixer?.update(dt);
// //             }

// //             renderer.render(scene, camera);
// //         }

// //         animate();

// //         window.addEventListener('resize', () => {
// //             camera.aspect = window.innerWidth / window.innerHeight;
// //             camera.updateProjectionMatrix();
// //             renderer.setSize(window.innerWidth, window.innerHeight);
// //         });

// //         console.log('✅ Full-page underwater scene (v4 centered) initialized');
// //     }

// //     initUnderwater().catch(err => console.error("❌ Underwater init failed:", err));
// // })();
// // ============================================================================
// // water_theme.js — FULL PAGE UNDERWATER IMMERSION (v5 — FIXED)
// // Phoenix centered + facing user, fish/bubbles in correct world-space coords
// // ============================================================================

// console.log('🔥 WATER THEME v2026-03-05-FIXED LOADING 🔥');

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
//             console.warn('⚠️ WASM timeout - proceeding without WASM');
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
//             console.error("❌ Canvas #threeThemeCanvas not found");
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
//             loadTex('/assets/no_skeleton_sprites/fish.png').catch(() => makeFallbackFishTex('#ff8833')),
//             loadTex('/assets/no_skeleton_sprites/fish2.png').catch(() => makeFallbackFishTex('#44aaff')),
//             // Use the confirmed bubble.png from /assets/sprites/
//             loadTex('/assets/sprites/bubble.png').catch(() => makeFallbackBubbleTex()),
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
//             const targetSize = 12; // desired world-unit size
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

//             scene.add(phoenix);

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
//                 console.log('✅ Phoenix animations loaded:', gltf.animations.length);
//             }

//             console.log('✅ Phoenix GLB loaded and centered, scale:', scaleFactor);

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
//                 const scaleX = fRight > 0.5 ? 1 : -1;
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

//             // ── Phoenix: gentle hover at center, facing camera ────────
//             if (phoenix) {
//                 // Gentle figure-8 orbit around screen center (small radius)
//                 const orbitX = fastSin(t * 0.18) * 8;
//                 const orbitY = fastSin(t * 0.26) * 3;

//                 phoenix.position.x = orbitX;
//                 phoenix.position.y = orbitY - scrollY * 0.05;
//                 phoenix.position.z = 0;   // at z=0, centered in front of camera

//                 // Very slight yaw so it feels alive, but mostly faces the camera (+Z)
//                 // Base rotation is Math.PI (set at load time), add small oscillation
//                 const yawWobble = fastSin(t * 0.18) * 0.15;
//                 phoenix.rotation.y = Math.PI + yawWobble;

//                 // Gentle roll and pitch
//                 phoenix.rotation.z = fastSin(t * 0.26) * 0.05;
//                 phoenix.rotation.x = fastCos(t * 0.22) * 0.04;

//                 // Wing flapping (fallback wings only; GLB wings driven by mixer)
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

//                 // Glow pulses subtly
//                 phoenixLight.position.copy(phoenix.position);
//                 phoenixLight.position.z += 15;
//                 phoenixLight.intensity = 0.8 + fastSin(t * 3) * 0.3;

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

//         console.log('✅ Underwater scene (v5 fixed) initialized — phoenix centered + facing user, fish/bubbles in world space');
//     }

//     initUnderwater().catch(err => console.error("❌ Underwater init failed:", err));
// })();
// ============================================================================
// water_theme.js — FULL PAGE UNDERWATER IMMERSION (v5 — FIXED)
// Phoenix centered + facing user, fish/bubbles in correct world-space coords
// ============================================================================

console.log('🔥 WATER THEME v2026-03-05-V6 LOADING 🔥');

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

console.log('✅ Three.js imported, revision:', THREE.REVISION);

if (!window.THREE) {
    window.THREE = THREE;
}

(function () {
    'use strict';

    const FISH_COUNT = 500;
    const BUBBLE_COUNT = 200;
    const LUT_SIZE = 1024;

    // ─── Precompute sin/cos lookup tables ──────────────────────────
    const sinLUT = new Float32Array(LUT_SIZE);
    const cosLUT = new Float32Array(LUT_SIZE);
    for (let i = 0; i < LUT_SIZE; i++) {
        const angle = (i / LUT_SIZE) * Math.PI * 2;
        sinLUT[i] = Math.sin(angle);
        cosLUT[i] = Math.cos(angle);
    }

    function fastSin(t) {
        const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        return sinLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
    }
    function fastCos(t) {
        const idx = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        return cosLUT[Math.floor((idx / (Math.PI * 2)) * LUT_SIZE) % LUT_SIZE];
    }

    // ─── WASM wait ─────────────────────────────────────────────────
    const waitWasm = () => new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.warn('⚠️ WASM timeout - proceeding without WASM');
            resolve(false);
        }, 3000);

        const check = () => {
            if (window.Module && typeof window.Module.cwrap === 'function') {
                clearTimeout(timeout);
                resolve(true);
            } else if (window.__vector2dWasmReady) {
                clearTimeout(timeout);
                resolve(true);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });

    async function initUnderwater() {
        console.log('🌊 Starting full-page underwater scene (v5 fixed)...');
        const wasmReady = await waitWasm();

        // JS fallbacks for math
        const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
        const noise2 = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };

        // ─── Renderer / Scene / Camera ────────────────────────────────
        const canvas = document.getElementById('threeThemeCanvas');
        if (!canvas) {
            console.error("❌ Canvas #threeThemeCanvas not found");
            return;
        }

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x1a3a52, 0.008);

        // ─── Camera: orthographic-like setup using FOV + distance ────
        // We use a perspective camera at z=0 looking at z=-1 world units.
        // To make "world units" map cleanly to the screen we set up the
        // frustum so that at z=0 the visible half-height = WORLD_H/2.
        // We drive everything in WORLD_W × WORLD_H world units.
        const WORLD_W = 200;   // world units wide
        const WORLD_H = 100;   // world units tall
        const CAM_Z = 100;   // camera sits at z=100, looks at z=0

        const camera = new THREE.PerspectiveCamera(
            2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI), // FOV derived from world height
            window.innerWidth / window.innerHeight,
            0.1,
            3000
        );
        camera.position.set(0, 0, CAM_Z);

        // ─── Lighting ────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x6699cc, 0.8));

        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(100, 200, 100);
        scene.add(sun);

        const light1 = new THREE.PointLight(0x66ccff, 0.5, 500);
        light1.position.set(-80, 40, 20);
        scene.add(light1);

        const light2 = new THREE.PointLight(0x66ccff, 0.5, 500);
        light2.position.set(80, 40, 20);
        scene.add(light2);

        // Fire glow for phoenix
        const phoenixLight = new THREE.PointLight(0xff6600, 1.0, 80);
        scene.add(phoenixLight);

        // ─── Texture precaching ──────────────────────────────────────
        const textureLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();

        function loadTex(url, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error(`Texture timeout: ${url}`)), timeout);
                const tex = textureLoader.load(
                    url,
                    () => { clearTimeout(timer); resolve(tex); },
                    undefined,
                    (err) => { clearTimeout(timer); reject(err); }
                );
            });
        }

        function makeFallbackFishTex(color) {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(55, 32, 40, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(15, 32);
            ctx.lineTo(0, 14);
            ctx.lineTo(0, 50);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(80, 26, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(81, 25, 1.5, 0, Math.PI * 2);
            ctx.fill();
            return new THREE.CanvasTexture(c);
        }

        function makeFallbackBubbleTex() {
            const c = document.createElement('canvas');
            c.width = c.height = 64;
            const ctx = c.getContext('2d');
            const g = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
            g.addColorStop(0, 'rgba(255,255,255,0.9)');
            g.addColorStop(0.5, 'rgba(200,230,255,0.6)');
            g.addColorStop(1, 'rgba(150,200,255,0.1)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();
            return new THREE.CanvasTexture(c);
        }

        console.log('⏳ Precaching textures...');
        const [fishTex1, fishTex2, bubbleTex] = await Promise.all([
            loadTex('/assets/no_skeleton_sprites/fish.png').catch(() => makeFallbackFishTex('#ff8833')),
            loadTex('/assets/no_skeleton_sprites/fish2.png').catch(() => makeFallbackFishTex('#44aaff')),
            // Use the confirmed bubble.png from /assets/sprites/
            loadTex('/assets/sprites/bubble.png').catch(() => makeFallbackBubbleTex()),
        ]);
        console.log('✅ All textures precached');

        // ─── Water caustics overlay ──────────────────────────────────
        const causticsGeo = new THREE.PlaneGeometry(WORLD_W * 2, WORLD_H * 2);
        const causticsMat = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const causticsPlane = new THREE.Mesh(causticsGeo, causticsMat);
        causticsPlane.position.z = -30;
        scene.add(causticsPlane);

        // ─── Fish (instanced meshes) ─────────────────────────────────
        // All positions now in WORLD units.
        // Half-width visible at z=0 = WORLD_W/2 = 100, half-height = WORLD_H/2 = 50

        const fishMat1 = new THREE.MeshBasicMaterial({
            map: fishTex1, transparent: true, depthWrite: false, side: THREE.DoubleSide
        });
        const fishMat2 = new THREE.MeshBasicMaterial({
            map: fishTex2, transparent: true, depthWrite: false, side: THREE.DoubleSide
        });

        // Fish size in world units — visible at this camera setup
        const fishPlane = new THREE.PlaneGeometry(6, 3);
        const half = Math.floor(FISH_COUNT / 2);
        const fishInst1 = new THREE.InstancedMesh(fishPlane, fishMat1, half);
        const fishInst2 = new THREE.InstancedMesh(fishPlane, fishMat2, FISH_COUNT - half);
        fishInst1.frustumCulled = false;
        fishInst2.frustumCulled = false;
        scene.add(fishInst1, fishInst2);

        // Fish state: [x, y, z, speed, baseY, phase, goingRight] per fish
        const fishData = new Float32Array(FISH_COUNT * 7);
        for (let i = 0; i < FISH_COUNT; i++) {
            const base = i * 7;
            const goingRight = Math.random() > 0.5 ? 1 : 0;
            // speed in world-units per second
            const speed = 8 + Math.random() * 16;
            const baseY = (Math.random() - 0.5) * WORLD_H * 1.4;
            // start off-screen left or right
            const startX = goingRight
                ? (-WORLD_W / 2 - 10 - Math.random() * 40)
                : (WORLD_W / 2 + 10 + Math.random() * 40);
            fishData[base] = startX;
            fishData[base + 1] = baseY;
            fishData[base + 2] = -10 + Math.random() * 20;  // z depth variation
            fishData[base + 3] = speed;
            fishData[base + 4] = baseY;
            fishData[base + 5] = Math.random() * Math.PI * 2; // phase
            fishData[base + 6] = goingRight;
        }

        // ─── Bubbles ─────────────────────────────────────────────────
        const bubbleMat = new THREE.MeshBasicMaterial({
            map: bubbleTex,
            transparent: true,
            opacity: 0.80,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const bubblePlane = new THREE.PlaneGeometry(2, 2);
        const bubblesInst = new THREE.InstancedMesh(bubblePlane, bubbleMat, BUBBLE_COUNT);
        bubblesInst.frustumCulled = false;
        scene.add(bubblesInst);

        // Bubble state: [x, y, z, vy, vx, size, wiggle]
        const bubbleData = new Float32Array(BUBBLE_COUNT * 7);
        for (let i = 0; i < BUBBLE_COUNT; i++) {
            const base = i * 7;
            bubbleData[base] = (Math.random() - 0.5) * WORLD_W * 1.2;
            bubbleData[base + 1] = -WORLD_H / 2 - Math.random() * 20;  // start below screen
            bubbleData[base + 2] = -5 + Math.random() * 10;
            bubbleData[base + 3] = 3 + Math.random() * 6;    // vy (world units/s)
            bubbleData[base + 4] = (Math.random() - 0.5) * 1.5; // vx drift
            bubbleData[base + 5] = 0.3 + Math.random() * 0.8;   // size scalar
            bubbleData[base + 6] = Math.random() * Math.PI * 2;  // wiggle phase
        }

        // ─── Phoenix (CENTERED, facing user) ─────────────────────────
        let phoenix = null;
        let phoenixMixer = null;
        let phoenixWings = [];

        try {
            const gltf = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('GLTF timeout')), 8000);
                gltfLoader.load(
                    '/assets/sprites/phoenix_bird.glb',
                    (g) => { clearTimeout(timer); resolve(g); },
                    undefined,
                    (e) => { clearTimeout(timer); reject(e); }
                );
            });

            phoenix = gltf.scene;

            // ── Compute bounding box to auto-scale the GLB ──────────
            const box = new THREE.Box3().setFromObject(phoenix);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50; // desired world-unit size — bigger than before
            const scaleFactor = targetSize / (maxDim || 1);
            phoenix.scale.setScalar(scaleFactor);

            // Re-center the model at origin after scaling
            const center = new THREE.Vector3();
            box.getCenter(center).multiplyScalar(scaleFactor);
            phoenix.position.sub(center);

            // ── Make the phoenix face +Z (toward the camera) ─────────
            // Most GLB models face +Y or -Z by default.
            // Rotate 180° around Y so it faces toward the camera (+Z direction).
            phoenix.rotation.y = Math.PI;

            // Collect wing bones for flapping
            phoenix.traverse((child) => {
                if (child.isMesh) {
                    const n = (child.name || '').toLowerCase();
                    if (n.includes('wing') || n.includes('feather')) {
                        phoenixWings.push(child);
                    }
                    // Make materials emissive so they glow underwater
                    if (child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => {
                            if (m.emissive !== undefined) {
                                m.emissive = new THREE.Color(0xff3300);
                                m.emissiveIntensity = 0.25;
                            }
                        });
                    }
                }
            });

            if (gltf.animations && gltf.animations.length > 0) {
                phoenixMixer = new THREE.AnimationMixer(phoenix);
                gltf.animations.forEach((clip) => {
                    phoenixMixer.clipAction(clip).play();
                });
                console.log('✅ Phoenix animations loaded:', gltf.animations.length);
            }

            console.log('✅ Phoenix GLB loaded and centered, scale:', scaleFactor);
            scene.add(phoenix);

        } catch (error) {
            console.warn('Phoenix GLB failed, using fallback mesh:', error);

            const pg = new THREE.Group();

            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4
            });
            const body = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), bodyMat);
            pg.add(body);

            const wingMat = new THREE.MeshStandardMaterial({
                color: 0xff8833, emissive: 0xff4400, emissiveIntensity: 0.3,
                side: THREE.DoubleSide
            });
            const wingGeom = new THREE.ConeGeometry(3, 10, 8);

            const lw = new THREE.Mesh(wingGeom, wingMat);
            lw.rotation.z = Math.PI / 4;
            lw.position.set(-7, 0, 0);
            pg.add(lw);
            phoenixWings.push(lw);

            const rw = new THREE.Mesh(wingGeom, wingMat);
            rw.rotation.z = -Math.PI / 4;
            rw.position.set(7, 0, 0);
            pg.add(rw);
            phoenixWings.push(rw);

            const tailMat = new THREE.MeshStandardMaterial({
                color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.3,
                side: THREE.DoubleSide
            });
            const tail = new THREE.Mesh(new THREE.ConeGeometry(2, 10, 6), tailMat);
            tail.rotation.x = Math.PI / 2;
            tail.position.set(0, -2, -5);
            pg.add(tail);

            // Head
            const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), bodyMat);
            head.position.set(0, 4, 4);
            pg.add(head);

            phoenix = pg;
            scene.add(phoenix);
        }

        // ─── WASM math bindings (anim_lerp + anim_wave) ──────────────
        let wasmLerp = null;
        let wasmWave = null;
        let wasmEase = null;

        if (wasmReady && window.Module && typeof window.Module.cwrap === 'function') {
            try {
                const has = (n) => typeof window.Module[`_${n}`] === 'function';
                if (has('anim_lerp'))
                    wasmLerp = window.Module.cwrap('anim_lerp', 'number', ['number', 'number', 'number']);
                if (has('anim_wave'))
                    wasmWave = window.Module.cwrap('anim_wave', 'number', ['number', 'number', 'number', 'number']);
                if (has('anim_ease_in_out_cubic'))
                    wasmEase = window.Module.cwrap('anim_ease_in_out_cubic', 'number', ['number']);
                console.log('✅ WASM math bindings: lerp=%s wave=%s ease=%s',
                    !!wasmLerp, !!wasmWave, !!wasmEase);
            } catch (e) {
                console.warn('⚠️ WASM math bind failed:', e);
            }
        }

        // JS fallbacks
        const mathLerp = wasmLerp || ((a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t)));
        const mathWave = wasmWave || ((t, freq, amp, phase) => Math.sin(t * freq + phase) * amp);
        const mathEase = wasmEase || ((t) => { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; });

        // ─── Phoenix waypoint system ──────────────────────────────────
        // Waypoints in world space — a slow grand tour of the screen
        const WAYPOINTS = [
            new THREE.Vector3(0, 0, 0),   // center
            new THREE.Vector3(35, 18, 0),   // top-right
            new THREE.Vector3(40, -15, 0),   // right
            new THREE.Vector3(0, -20, 0),   // bottom-center
            new THREE.Vector3(-40, -15, 0),   // left
            new THREE.Vector3(-35, 18, 0),   // top-left
            new THREE.Vector3(0, 22, 0),   // top-center
        ];
        let wpFrom = 0;
        let wpTo = 1;
        let wpT = 0;       // 0→1 progress between waypoints
        const WP_DUR = 3.5;     // seconds per segment

        // ─── Animation loop ──────────────────────────────────────────
        const clock = new THREE.Clock();
        const dummy = new THREE.Object3D();

        function animate() {
            requestAnimationFrame(animate);

            const dt = Math.min(clock.getDelta(), 0.033);
            const t = clock.getElapsedTime();
            const scrollY = window.scrollY || 0;

            // Subtle camera drift with scroll
            camera.position.y = -scrollY * 0.05;

            // ── Fish ─────────────────────────────────────────────────
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

                // Vertical undulation
                const bobFreq = 1.5 + (i % 5) * 0.2;
                const bobAmp = 1.5 + (i % 7) * 0.3;
                const fy = fBaseY + fastSin(t * bobFreq + fPhase) * bobAmp;

                // Wrap fish around screen edges (in world units)
                const wrapEdge = WORLD_W / 2 + 12;
                if (fRight > 0.5 && fx > wrapEdge) {
                    fishData[base] = -wrapEdge;
                    fishData[base + 4] = (Math.random() - 0.5) * WORLD_H * 1.3;
                } else if (fRight < 0.5 && fx < -wrapEdge) {
                    fishData[base] = wrapEdge;
                    fishData[base + 4] = (Math.random() - 0.5) * WORLD_H * 1.3;
                } else {
                    fishData[base] = fx;
                }
                fishData[base + 1] = fy;

                dummy.position.set(fx, fy, fz);

                const bodyTilt = fastSin(t * bobFreq * 2 + fPhase) * 0.1;
                dummy.rotation.z = bodyTilt;

                const tailWiggle = 1 + fastSin(t * 8 + fPhase) * 0.08;
                // Fish texture faces LEFT by default.
                // Going right  → flip X (-1) so it faces the swim direction.
                // Going left   → keep X (+1), already faces left.
                const scaleX = fRight > 0.5 ? -1 : 1;
                dummy.scale.set(scaleX, tailWiggle, 1);
                dummy.updateMatrix();

                if (i < half) {
                    fishInst1.setMatrixAt(i, dummy.matrix);
                } else {
                    fishInst2.setMatrixAt(i - half, dummy.matrix);
                }
            }

            fishInst1.instanceMatrix.needsUpdate = true;
            fishInst2.instanceMatrix.needsUpdate = true;

            // ── Bubbles ───────────────────────────────────────────────
            for (let i = 0; i < BUBBLE_COUNT; i++) {
                const base = i * 7;
                let bx = bubbleData[base];
                let by = bubbleData[base + 1];
                const bz = bubbleData[base + 2];
                const bvy = bubbleData[base + 3];
                const bSize = bubbleData[base + 5];
                const bWig = bubbleData[base + 6];

                by += bvy * dt;
                bx += fastSin(t * 1.5 + bWig) * 0.25 * dt * 60; // gentle horizontal drift

                const topEdge = WORLD_H / 2 + 5;
                if (by > topEdge) {
                    by = -WORLD_H / 2 - Math.random() * 10;
                    bx = (Math.random() - 0.5) * WORLD_W * 1.2;
                }

                bubbleData[base] = bx;
                bubbleData[base + 1] = by;

                dummy.position.set(bx, by, bz);
                dummy.rotation.z = 0;
                dummy.scale.setScalar(bSize * (1 + fastSin(t * 3 + i) * 0.1));
                dummy.updateMatrix();
                bubblesInst.setMatrixAt(i, dummy.matrix);
            }
            bubblesInst.instanceMatrix.needsUpdate = true;

            // ── Caustics ──────────────────────────────────────────────
            causticsMat.opacity = 0.08 + fastSin(t * 0.4) * 0.04;
            causticsPlane.position.x = fastSin(t * 0.2) * 20;
            causticsPlane.position.y = fastCos(t * 0.3) * 10 - scrollY * 0.05;

            // ── Phoenix: WASM-driven waypoint movement ────────────────
            if (phoenix) {
                // Advance waypoint timer
                wpT += dt / WP_DUR;
                if (wpT >= 1.0) {
                    wpT = 0;
                    wpFrom = wpTo;
                    wpTo = (wpTo + 1) % WAYPOINTS.length;
                }

                // Eased progress 0→1 using WASM anim_ease_in_out_cubic (JS fallback ok)
                const easedT = mathEase(Math.max(0, Math.min(1, wpT)));

                const pFrom = WAYPOINTS[wpFrom];
                const pTo = WAYPOINTS[wpTo];

                // Use WASM anim_lerp for each axis (falls back to JS lerp if WASM unavailable)
                const px = mathLerp(pFrom.x, pTo.x, easedT);
                const py = mathLerp(pFrom.y, pTo.y, easedT) - scrollY * 0.05;
                const pz = mathLerp(pFrom.z, pTo.z, easedT);

                // Gentle hover bob on top of waypoint position (WASM anim_wave)
                const bobY = mathWave(t, Math.PI * 2 * 0.4, 1.2, 0);
                const bobX = mathWave(t, Math.PI * 2 * 0.27, 0.5, 1.1);

                phoenix.position.set(px + bobX, py + bobY, pz);

                // Face direction of travel: yaw toward movement vector
                const dx = pTo.x - pFrom.x;
                // Base faces camera (Math.PI). Add yaw based on horizontal travel direction.
                const travelYaw = dx !== 0 ? Math.sign(dx) * 0.25 : 0;
                const yawWobble = mathWave(t, Math.PI * 2 * 0.18, 0.12, 0);
                phoenix.rotation.y = Math.PI + travelYaw + yawWobble;

                // Gentle roll into turns + pitch bob
                phoenix.rotation.z = mathWave(t, Math.PI * 2 * 0.26, 0.06, 0.5);
                phoenix.rotation.x = mathWave(t, Math.PI * 2 * 0.22, 0.05, 0.8);

                // Wing flapping (fallback mesh wings only; GLB wings driven by mixer)
                if (phoenixWings.length > 0 && !phoenixMixer) {
                    const flapAngle = fastSin(t * 7) * 0.55;
                    phoenixWings.forEach((wing) => {
                        if (wing.position.x < 0) {
                            wing.rotation.z = Math.PI / 4 + flapAngle;
                        } else {
                            wing.rotation.z = -Math.PI / 4 - flapAngle;
                        }
                    });
                }

                // Pulsing fire glow follows phoenix
                phoenixLight.position.set(px + bobX, py + bobY, pz + 15);
                phoenixLight.intensity = 0.9 + fastSin(t * 3) * 0.35;

                phoenixMixer?.update(dt);
            }

            renderer.render(scene, camera);
        }

        animate();

        // ─── Resize handler ───────────────────────────────────────────
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            // Keep vertical FOV so WORLD_H stays fully visible
            camera.fov = 2 * Math.atan(WORLD_H / 2 / CAM_Z) * (180 / Math.PI);
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });

        console.log('✅ Underwater scene (v5 fixed) initialized — phoenix centered + facing user, fish/bubbles in world space');
    }

    initUnderwater().catch(err => console.error("❌ Underwater init failed:", err));
})();