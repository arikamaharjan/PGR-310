// ============================================================================
// water_theme.js — FULL PAGE UNDERWATER IMMERSION (v7 — FIXED FISH + WAVES)
// Fish at FIXED world positions (no scroll-lock). Sine wave water surface.
// All sin/cos/lerp/wave/ease sourced from C via WASM.
// ============================================================================

console.log('🔥 WATER THEME v7 LOADING 🔥');

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

console.log('✅ Three.js imported, revision:', THREE.REVISION);
if (!window.THREE) window.THREE = THREE;

(function () {
    'use strict';

    // keep counts under the C kernel limits (MAX_FISH=256, MAX_BUBBLES=128)
    const FISH_COUNT = 240;
    const BUBBLE_COUNT = 120;
    const WAVE_SEGMENTS = 128;      // sine wave resolution
    const WAVE_AMPLITUDE = 1.2;     // wave height
    const WAVE_FREQUENCY = 0.08;    // spatial frequency
    const WAVE_SPEED = 1.5;         // animation speed

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

    let wasmSim = null;
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
            loadTex(assetUrl('../assets/no_skeleton_sprites/fish.webp')).catch(() => makeFallbackFishTex('#ff8833')),
            loadTex(assetUrl('../assets/no_skeleton_sprites/fish2.webp')).catch(() => makeFallbackFishTex('#44aaff')),
            loadTex(assetUrl('../assets/sprites/bubble.webp')).catch(() => makeFallbackBubbleTex()),
        ]);
        console.log('✅ Textures precached');

        // ─── Caustics overlay ────────────────────────────────────────
        const causticsMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
        const causticsPlane = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W * 2, WORLD_H * 2), causticsMat);
        causticsPlane.position.z = -30; scene.add(causticsPlane);

        // ─── Sine Wave Water Surface ─────────────────────────────────
        const waveGeo = new THREE.BufferGeometry();
        const waveVerts = new Float32Array((WAVE_SEGMENTS + 1) * 2 * 3);  // top + bottom strip
        const waveIndices = [];
        for (let i = 0; i <= WAVE_SEGMENTS; i++) {
            const ti = i * 2;      // top vertex index
            const bi = i * 2 + 1;  // bottom vertex index
            // positions will be updated each frame
            waveVerts[ti * 3] = 0; waveVerts[ti * 3 + 1] = 0; waveVerts[ti * 3 + 2] = 0;
            waveVerts[bi * 3] = 0; waveVerts[bi * 3 + 1] = 0; waveVerts[bi * 3 + 2] = 0;
            if (i < WAVE_SEGMENTS) {
                const nti = (i + 1) * 2;
                const nbi = (i + 1) * 2 + 1;
                waveIndices.push(ti, nti, bi, bi, nti, nbi);
            }
        }
        waveGeo.setAttribute('position', new THREE.BufferAttribute(waveVerts, 3));
        waveGeo.setIndex(waveIndices);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0x60cfe8,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.position.z = 5;  // in front of fish
        scene.add(waveMesh);

        // Second wave layer (slightly offset for depth)
        const waveGeo2 = waveGeo.clone();
        const waveMat2 = new THREE.MeshBasicMaterial({
            color: 0x88ddf8,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const waveMesh2 = new THREE.Mesh(waveGeo2, waveMat2);
        waveMesh2.position.z = 8;
        scene.add(waveMesh2);

        // ─── Fish ────────────────────────────────────────────────────
        const fishMat1 = new THREE.MeshBasicMaterial({ map: fishTex1, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const fishMat2 = new THREE.MeshBasicMaterial({ map: fishTex2, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const fishPlane = new THREE.PlaneGeometry(6, 3);
        const half = Math.floor(FISH_COUNT / 2);
        const fishInst1 = new THREE.InstancedMesh(fishPlane, fishMat1, half);
        const fishInst2 = new THREE.InstancedMesh(fishPlane, fishMat2, FISH_COUNT - half);
        fishInst1.frustumCulled = fishInst2.frustumCulled = false;
        scene.add(fishInst1, fishInst2);

        // We'll drive fish positions from WASM outputs. Keep a small z-distribution
        // for visual depth (WASM only provides x/y/rot/scaleX).
        const fishZ = new Float32Array(FISH_COUNT);
        for (let i = 0; i < FISH_COUNT; i++) {
            fishZ[i] = -10 + ((W.noise1 ? W.noise1(i * 7.13, 4) : Math.random()) * 20);
        }

        // ─── Bubbles ─────────────────────────────────────────────────
        const bubbleMat = new THREE.MeshBasicMaterial({ map: bubbleTex, transparent: true, opacity: 0.80, blending: THREE.AdditiveBlending, depthWrite: false });
        const bubblesInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), bubbleMat, BUBBLE_COUNT);
        bubblesInst.frustumCulled = false; scene.add(bubblesInst);

        // Bubbles are produced by WASM; no JS bootstrap required.

        // ─── Phoenix ─────────────────────────────────────────────────
        let phoenix = null, phoenixMixer = null, phoenixWings = [];

        try {
            const gltf = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('GLTF timeout')), 8000);
                gltfLoader.load(assetUrl('../assets/sprites/phoenix_bird.glb'),
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
        const CULL_MARGIN = WORLD_H * 0.8;  // skip fish far outside camera view

        function animate() {
            requestAnimationFrame(animate);

            const dt = Math.min(clock.getDelta(), 0.033);
            const t = clock.getElapsedTime();
            const scrollY = window.scrollY || 0;
            const scrollWorld = scrollY * SCROLL_TO_WORLD;

            // Camera tracks scroll (parallax world)
            camera.position.y = -scrollWorld;

            // Current waterline in world coords (derived from CSS sky band)
            const wl = waterlineWorldY();
            const camY = camera.position.y;
            const viewTop = camY + WORLD_H / 2;
            const viewBot = camY - WORLD_H / 2;

            // ── Sine Wave Surface — update geometry positions (WASM-backed when available)
            const wavePos = waveMesh.geometry.attributes.position.array;
            const wavePos2 = waveMesh2.geometry.attributes.position.array;

            if (window.Module && typeof window.Module.cwrap === 'function') {
                try {
                    if (!wasmSim) {
                        const cwrap = window.Module.cwrap;
                        wasmSim = {
                            init: cwrap('watersim_init', 'void', ['number', 'number']),
                            step: cwrap('watersim_step', 'void', ['number', 'number', 'number']),
                            getWavePtr: cwrap('watersim_get_wave_buffer', 'number', ['number']),
                            getFishPtr: cwrap('watersim_get_fish_buffer', 'number', []),
                            getBubblePtr: cwrap('watersim_get_bubble_buffer', 'number', []),
                        };
                        try { wasmSim.init(FISH_COUNT | 0, BUBBLE_COUNT | 0); } catch (e) { }
                    }

                    const dt16 = (dt * 65536) | 0;
                    const totalTime16 = (t * 65536) | 0;
                    const scrollMax = getMaxScrollWorld() || 1;
                    const scrollNorm = Math.max(0, Math.min(1, scrollWorld / scrollMax));
                    const scrollNorm16 = (scrollNorm * 65536) | 0;

                    wasmSim.step(dt16, totalTime16, scrollNorm16);

                    // Wave samples (C provides WAVE_SAMPLE_COUNT = 16)
                    const wavePtr = wasmSim.getWavePtr(totalTime16) | 0;
                    const { heap: waveHeap, base: waveBase } = window.Wasm.getHeapI32AndBase(wavePtr);
                    const SAMPLES = 16;
                    for (let i = 0; i <= WAVE_SEGMENTS; i++) {
                        const frac = i / WAVE_SEGMENTS;
                        const x = (frac - 0.5) * WORLD_W * 1.3;
                        const samplePos = frac * (SAMPLES - 1);
                        const s0 = Math.floor(samplePos);
                        const s1 = Math.min(s0 + 1, SAMPLES - 1);
                        const tS = samplePos - s0;
                        const w0 = (waveHeap[waveBase + s0] || 0) / 65536.0;
                        const w1 = (waveHeap[waveBase + s1] || 0) / 65536.0;
                        const wy = wl + (w0 * (1 - tS) + w1 * tS);
                        const wyb = wy - 3.0;
                        const ti = i * 2; const bi = i * 2 + 1;
                        wavePos[ti * 3] = x; wavePos[ti * 3 + 1] = wy; wavePos[ti * 3 + 2] = 0;
                        wavePos[bi * 3] = x; wavePos[bi * 3 + 1] = wyb; wavePos[bi * 3 + 2] = 0;
                        const wy2 = wl + (wy - wl) * 0.7; const wy2b = wy2 - 2.0;
                        wavePos2[ti * 3] = x; wavePos2[ti * 3 + 1] = wy2; wavePos2[ti * 3 + 2] = 0;
                        wavePos2[bi * 3] = x; wavePos2[bi * 3 + 1] = wy2b; wavePos2[bi * 3 + 2] = 0;
                    }
                    waveMesh.geometry.attributes.position.needsUpdate = true;
                    waveMesh2.geometry.attributes.position.needsUpdate = true;

                    // Fish (FishData: x,y,rot,scaleX)
                    const fishPtr = wasmSim.getFishPtr() | 0;
                    const { heap: fHeap, base: fBase } = window.Wasm.getHeapI32AndBase(fishPtr);
                    for (let i = 0; i < FISH_COUNT; i++) {
                        const off = fBase + i * 4;
                        const fx = (fHeap[off] || 0) / 65536.0;
                        const fy = (fHeap[off + 1] || 0) / 65536.0;
                        const frot = (fHeap[off + 2] || 0) / 65536.0;
                        const fscaleX = (fHeap[off + 3] || 0) / 65536.0;
                        const fz = fishZ[i] || -10;
                        if (fy < viewBot - CULL_MARGIN || fy > viewTop + CULL_MARGIN) {
                            dummy.position.set(0, -9999, 0); dummy.scale.set(0, 0, 0);
                        } else {
                            dummy.position.set(fx, fy, fz); dummy.rotation.z = frot;
                            const tailWiggle = 1 + Math.abs(frot) * 0.8;
                            dummy.scale.set(fscaleX < 0 ? -1 : 1, tailWiggle, 1);
                        }
                        dummy.updateMatrix();
                        if (i < half) fishInst1.setMatrixAt(i, dummy.matrix); else fishInst2.setMatrixAt(i - half, dummy.matrix);
                    }
                    fishInst1.instanceMatrix.needsUpdate = true; fishInst2.instanceMatrix.needsUpdate = true;

                    // Bubbles (BubbleData: x,y,size,opacity)
                    const bubblePtr = wasmSim.getBubblePtr() | 0;
                    const { heap: bHeap, base: bBase } = window.Wasm.getHeapI32AndBase(bubblePtr);
                    for (let i = 0; i < BUBBLE_COUNT; i++) {
                        const off = bBase + i * 4;
                        const bx = (bHeap[off] || 0) / 65536.0;
                        const by = (bHeap[off + 1] || 0) / 65536.0;
                        const bz = -8 + (i % 7) * 2;
                        const bSize = (bHeap[off + 2] || 0) / 65536.0;
                        if (by < viewBot - CULL_MARGIN || by > viewTop + CULL_MARGIN) { dummy.position.set(0, -9999, 0); dummy.scale.set(0, 0, 0); }
                        else { dummy.position.set(bx, by, bz); dummy.rotation.z = 0; dummy.scale.setScalar(bSize * (1 + W.wave(t, 3, 0.1, i))); }
                        dummy.updateMatrix(); bubblesInst.setMatrixAt(i, dummy.matrix);
                    }
                    bubblesInst.instanceMatrix.needsUpdate = true;
                } catch (err) {
                    console.warn('WASM sim failure, falling back to JS:', err);
                }
            } else {
                // fallback to original JS computations
                for (let i = 0; i <= WAVE_SEGMENTS; i++) {
                    const frac = i / WAVE_SEGMENTS;
                    const x = (frac - 0.5) * WORLD_W * 1.3;
                    const y1 = wl + W.wave(t * WAVE_SPEED + x * WAVE_FREQUENCY, 1.0, WAVE_AMPLITUDE, 0)
                        + W.wave(t * WAVE_SPEED * 0.7 + x * WAVE_FREQUENCY * 1.6, 1.0, WAVE_AMPLITUDE * 0.4, 2.1);
                    const y1b = y1 - 3.0;
                    const ti = i * 2; const bi = i * 2 + 1;
                    wavePos[ti * 3] = x; wavePos[ti * 3 + 1] = y1; wavePos[ti * 3 + 2] = 0;
                    wavePos[bi * 3] = x; wavePos[bi * 3 + 1] = y1b; wavePos[bi * 3 + 2] = 0;
                    const y2 = wl + W.wave(t * WAVE_SPEED * 1.2 + x * WAVE_FREQUENCY * 0.8, 1.0, WAVE_AMPLITUDE * 0.7, 1.5)
                        + W.wave(t * WAVE_SPEED * 0.5 + x * WAVE_FREQUENCY * 2.0, 1.0, WAVE_AMPLITUDE * 0.25, 3.8);
                    const y2b = y2 - 2.0;
                    wavePos2[ti * 3] = x; wavePos2[ti * 3 + 1] = y2; wavePos2[ti * 3 + 2] = 0;
                    wavePos2[bi * 3] = x; wavePos2[bi * 3 + 1] = y2b; wavePos2[bi * 3 + 2] = 0;
                }
                waveMesh.geometry.attributes.position.needsUpdate = true; waveMesh2.geometry.attributes.position.needsUpdate = true;
                for (let i = 0; i < FISH_COUNT; i++) { dummy.position.set(0, -9999, 0); dummy.scale.set(0,0,0); dummy.updateMatrix(); if (i < half) fishInst1.setMatrixAt(i, dummy.matrix); else fishInst2.setMatrixAt(i - half, dummy.matrix); }
                fishInst1.instanceMatrix.needsUpdate = true; fishInst2.instanceMatrix.needsUpdate = true;
                for (let i = 0; i < BUBBLE_COUNT; i++) { dummy.position.set(0, -9999, 0); dummy.scale.set(0,0,0); dummy.updateMatrix(); bubblesInst.setMatrixAt(i, dummy.matrix); }
                bubblesInst.instanceMatrix.needsUpdate = true;
            }

            // ── Caustics — follow camera ─────────────────────────────
            causticsMat.opacity = 0.08 + W.wave(t, 0.4, 0.04, 0);
            causticsPlane.position.x = W.wave(t, 0.2, 20, 0);
            causticsPlane.position.y = camY + W.wave(t, 0.3, 10, Math.PI * 0.5);

            // ── Phoenix — W.lerp + W.ease + W.wave (all C) ───────────
            if (phoenix) {
                // If the sky band is turned off (scroll past hero), hide the phoenix.
                const skyOff = document.body.classList.contains('sky-off');
                phoenix.visible = !skyOff;
                phoenixLight.visible = !skyOff;

                wpT += dt / WP_DUR;
                if (wpT >= 1.0) { wpT = 0; wpFrom = wpTo; wpTo = (wpTo + 1) % WAYPOINTS.length; }

                const easedT = W.ease(Math.max(0, Math.min(1, wpT)));
                const pFrom = WAYPOINTS[wpFrom];
                const pTo = WAYPOINTS[wpTo];

                // W.lerp → C anim_lerp
                const px = W.lerp(pFrom.x, pTo.x, easedT);
                // Don't cancel camera scroll (prevents phoenix from feeling “locked”)
                const py = W.lerp(pFrom.y, pTo.y, easedT);
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

        console.log('🌊 Underwater scene (v7 FIXED FISH + WAVES) initialized');
    }

    initUnderwater().catch(err => console.error('Underwater init failed:', err));
})();