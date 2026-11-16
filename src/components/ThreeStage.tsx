import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SectionId, WishLantern } from '../types';
import { buildCakeRig, buildEnvelopeRig, createLanternMesh } from '../utils/threeBuilders';

interface ThreeStageProps {
  activeSection: SectionId;
  candlesLit: boolean[];
  isCut: boolean;
  envelopeOpen: boolean;
  lanterns: WishLantern[];
  fireworkPulse: number;
  skyTapFireworks: boolean;
  onCandleClick: (id: number) => void;
  onCakeSwipeSlice: () => void;
  onEnvelopeClick: () => void;
  onSkyFirework: () => void;
}

interface ActiveParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
}

interface ActiveLantern {
  id: string;
  mesh: THREE.Group;
  speed: number;
  swayPhase: number;
  baseX: number;
}

export const ThreeStage: React.FC<ThreeStageProps> = ({
  activeSection,
  candlesLit,
  isCut,
  envelopeOpen,
  lanterns,
  fireworkPulse,
  skyTapFireworks,
  onCandleClick,
  onCakeSwipeSlice,
  onEnvelopeClick,
  onSkyFirework,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Latest props ref so the 60fps loop always reads fresh state without re-mounting WebGL
  const stateRef = useRef({
    activeSection,
    candlesLit,
    isCut,
    envelopeOpen,
    skyTapFireworks,
    onCandleClick,
    onCakeSwipeSlice,
    onEnvelopeClick,
    onSkyFirework,
  });
  stateRef.current = {
    activeSection,
    candlesLit,
    isCut,
    envelopeOpen,
    skyTapFireworks,
    onCandleClick,
    onCakeSwipeSlice,
    onEnvelopeClick,
    onSkyFirework,
  };

  const spawnBurstRef = useRef<((origin?: THREE.Vector3, count?: number) => void) | null>(null);
  const spawnSmokeRef = useRef<((origin: THREE.Vector3) => void) | null>(null);
  const spawnedLanternIds = useRef<Set<string>>(new Set());
  const addLanternRef = useRef<((l: WishLantern) => void) | null>(null);

  // Trigger celebratory fireworks when fireworkPulse increments
  useEffect(() => {
    if (fireworkPulse > 0 && spawnBurstRef.current) {
      spawnBurstRef.current(
        new THREE.Vector3((Math.random() - 0.5) * 4.5, 2.8 + Math.random() * 1.8, -1.5 - Math.random() * 2),
        48
      );
      setTimeout(() => {
        spawnBurstRef.current?.(
          new THREE.Vector3((Math.random() - 0.5) * 5, 3.2 + Math.random() * 1.5, -2.5),
          42
        );
      }, 220);
    }
  }, [fireworkPulse]);

  // Spawn newly added wish lanterns into 3D sky
  useEffect(() => {
    for (const l of lanterns) {
      if (!spawnedLanternIds.current.has(l.id)) {
        spawnedLanternIds.current.add(l.id);
        addLanternRef.current?.(l);
      }
    }
  }, [lanterns]);

  // Spawn smoke wisps whenever candles are extinguished
  const prevCandlesRef = useRef<boolean[]>(candlesLit);
  useEffect(() => {
    const prev = prevCandlesRef.current;
    candlesLit.forEach((lit, idx) => {
      if (prev[idx] && !lit && spawnSmokeRef.current) {
        const angle = 0.85 + ((idx + 1) / 6) * (Math.PI * 1.3);
        spawnSmokeRef.current(new THREE.Vector3(Math.sin(angle) * 0.43, 2.5, Math.cos(angle) * 0.43));
      }
    });
    prevCandlesRef.current = candlesLit;
  }, [candlesLit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobilePerf = width < 768 || navigator.maxTouchPoints > 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060e);
    scene.fog = new THREE.FogExp2(0x04060e, 0.038);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.set(0, 2.8, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobilePerf,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobilePerf ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Full bloom post-processing on desktop; direct single-pass rendering on mobile for silky 60fps
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isMobilePerf) {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.48, 0.4, 0.74);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    // Studio & Cosmic Lighting (pure obsidian-sapphire + champagne gold + cyan, no red/pink cast)
    const ambient = new THREE.AmbientLight(0xc7d2fe, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.15);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);

    const rimCyan = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimCyan.position.set(-5, 4, -4);
    scene.add(rimCyan);

    const rimIndigo = new THREE.PointLight(0x6366f1, 1.8, 16);
    rimIndigo.position.set(4, 2.5, -2.5);
    scene.add(rimIndigo);

    // Reflective obsidian pedestal stage & rotating holographic orbital rings
    const stageGroup = new THREE.Group();
    const stageDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.8, 0.16, 64),
      new THREE.MeshStandardMaterial({ color: 0x0a0d1a, roughness: 0.18, metalness: 0.78 })
    );
    stageDisk.position.y = -0.22;
    stageGroup.add(stageDisk);

    const ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(3.55, 0.018, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.55 })
    );
    ringOuter.rotation.x = Math.PI / 2;
    ringOuter.position.y = -0.13;
    stageGroup.add(ringOuter);

    const ringInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.014, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0xf6c96f, transparent: true, opacity: 0.6 })
    );
    ringInner.rotation.x = Math.PI / 2;
    ringInner.position.y = -0.12;
    stageGroup.add(ringInner);
    scene.add(stageGroup);

    // Deep 3D Starfield + Clean Obsidian-Sapphire Cosmic Glow (no red/pink spot)
    const nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = 256;
    nebulaCanvas.height = 256;
    const nCtx = nebulaCanvas.getContext('2d')!;
    const nGrad = nCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    nGrad.addColorStop(0, 'rgba(30, 58, 138, 0.22)');
    nGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.1)');
    nGrad.addColorStop(1, 'rgba(4, 6, 14, 0)');
    nCtx.fillStyle = nGrad;
    nCtx.fillRect(0, 0, 256, 256);
    const nebulaTex = new THREE.CanvasTexture(nebulaCanvas);
    nebulaTex.colorSpace = THREE.SRGBColorSpace;
    const nebulaBackdrop = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: nebulaTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    nebulaBackdrop.position.set(0, 3.2, -11);
    nebulaBackdrop.scale.set(24, 16, 1);
    scene.add(nebulaBackdrop);

    const starCount = isMobilePerf ? 800 : 1400;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const palette = [new THREE.Color(0xffffff), new THREE.Color(0xa5f3fc), new THREE.Color(0xfde68a), new THREE.Color(0xc7d2fe)];
    for (let i = 0; i < starCount; i++) {
      const r = 14 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) - 2;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[i % palette.length];
      starCol[i * 3] = c.r;
      starCol[i * 3 + 1] = c.g;
      starCol[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.88 })
    );
    scene.add(stars);

    // Build 3D Cake & 3D Envelope
    const cakeRig = buildCakeRig();
    scene.add(cakeRig.root);

    const envRig = buildEnvelopeRig();
    envRig.root.position.set(0, 1.35, 0);
    envRig.root.visible = false;
    scene.add(envRig.root);

    // Dynamic Particles (Fireworks + Smoke) & Lanterns
    const particles: ActiveParticle[] = [];
    const activeLanterns: ActiveLantern[] = [];
    const sparkGeo = new THREE.SphereGeometry(0.045, 6, 6);

    spawnBurstRef.current = (origin = new THREE.Vector3(0, 3.6, -1.5), count = 44) => {
      const colors = [0xf6c96f, 0x5eead4, 0xf472b6, 0x93c5fd, 0xffffff];
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? 0xffffff : baseColor,
          transparent: true,
          opacity: 1,
        });
        const m = new THREE.Mesh(sparkGeo, mat);
        m.position.copy(origin);
        const speed = 1.6 + Math.random() * 2.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const vel = new THREE.Vector3(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.cos(phi) + 0.6,
          speed * Math.sin(phi) * Math.sin(theta)
        );
        scene.add(m);
        particles.push({ mesh: m, vel, life: 0, maxLife: 1.2 + Math.random() * 0.6, gravity: 2.2 });
      }
    };

    spawnSmokeRef.current = (origin: THREE.Vector3) => {
      for (let i = 0; i < 8; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.45 });
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), mat);
        m.position.copy(origin);
        scene.add(m);
        particles.push({
          mesh: m,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.7 + Math.random() * 0.45, (Math.random() - 0.5) * 0.25),
          life: 0,
          maxLife: 1.1,
          gravity: -0.25,
        });
      }
    };

    addLanternRef.current = (l: WishLantern) => {
      const mesh = createLanternMesh(l.color);
      const startX = (Math.random() - 0.5) * 4.2;
      mesh.position.set(startX, 0.4, -2.5 - Math.random() * 4);
      scene.add(mesh);
      activeLanterns.push({
        id: l.id,
        mesh,
        speed: 0.55 + Math.random() * 0.35,
        swayPhase: Math.random() * Math.PI * 2,
        baseX: startX,
      });
    };

    // Interactive Pointer / Touch Handling (Orbit + Raycasting + Cake Swipe)
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let totalDragDist = 0;
    let orbitYaw = 0;
    let targetOrbitYaw = 0;
    let orbitPitch = 0;
    let targetOrbitPitch = 0;
    let swipeTriggered = false;

    const updateNDC = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      totalDragDist = 0;
      swipeTriggered = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      totalDragDist += Math.hypot(dx, dy);

      // In cake mode before cutting, a swift swipe across the center slices the cake!
      if (stateRef.current.activeSection === 'cake' && !stateRef.current.isCut && !swipeTriggered && totalDragDist > 68) {
        updateNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObject(cakeRig.root, true);
        if (hits.length > 0) {
          swipeTriggered = true;
          stateRef.current.onCakeSwipeSlice();
        }
      }

      targetOrbitYaw = THREE.MathUtils.clamp(targetOrbitYaw + dx * 0.0045, -1.1, 1.1);
      targetOrbitPitch = THREE.MathUtils.clamp(targetOrbitPitch + dy * 0.0025, -0.25, 0.35);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;

      // Tap / Click detection
      if (totalDragDist < 12) {
        updateNDC(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNDC, camera);

        if (stateRef.current.activeSection === 'cake' || stateRef.current.activeSection === 'overview') {
          const candleHits = raycaster.intersectObjects(
            cakeRig.candles.map((c) => c.hitMesh),
            false
          );
          if (candleHits.length > 0) {
            const cId = candleHits[0].object.userData.candleId as number;
            stateRef.current.onCandleClick(cId);
            return;
          }
        }

        if (stateRef.current.activeSection === 'envelope') {
          const envHits = raycaster.intersectObject(envRig.hitMesh, false);
          if (envHits.length > 0) {
            stateRef.current.onEnvelopeClick();
            return;
          }
        }

        if (stateRef.current.activeSection === 'activities' && stateRef.current.skyTapFireworks) {
          const dir = new THREE.Vector3(pointerNDC.x, pointerNDC.y, 0.5).unproject(camera).sub(camera.position).normalize();
          const dist = 8.5;
          const pos = camera.position.clone().add(dir.multiplyScalar(dist));
          pos.y = Math.max(pos.y, 1.8);
          spawnBurstRef.current?.(pos, 46);
          stateRef.current.onSkyFirework();
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize Observer for 100% responsive mobile + desktop scaling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      // Widen FOV slightly on narrow portrait screens so 3D cake & envelope fit inside viewport comfortably
      camera.fov = camera.aspect < 0.75 ? 54 : camera.aspect < 1.0 ? 49 : 43;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer && bloomPass) {
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Animation loop state
    let sliceAnim = 0;
    let envAnim = 0;
    let knifeAnim = 0;
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const st = stateRef.current;

      // Smooth orbit damping
      if (!isDragging && st.activeSection !== 'cake' && st.activeSection !== 'envelope') {
        targetOrbitYaw = Math.sin(elapsed * 0.25) * 0.22;
      }
      orbitYaw = THREE.MathUtils.lerp(orbitYaw, targetOrbitYaw, dt * 4.5);
      orbitPitch = THREE.MathUtils.lerp(orbitPitch, targetOrbitPitch, dt * 4.5);

      // Responsive Camera Positioning per section & screen aspect
      const isPortrait = camera.aspect < 0.85;
      const distBoost = isPortrait ? 2.6 : 0;
      const basePos = new THREE.Vector3(0, 2.75, 6.2 + distBoost);
      // Lowering lookTarget.y on portrait pushes the 3D subject cleanly upward above bottom UI cards
      const lookTarget = new THREE.Vector3(0, isPortrait ? 0.35 : 1.25, 0);

      if (st.activeSection === 'cake') {
        basePos.set(0.45, 2.85, 5.45 + distBoost);
        lookTarget.set(0, isPortrait ? 0.45 : 1.25, 0);
      } else if (st.activeSection === 'envelope') {
        basePos.set(0, 1.7, 5.15 + distBoost);
        lookTarget.set(0, isPortrait ? 0.55 : 1.35, 0);
      } else if (st.activeSection === 'activities') {
        basePos.set(0, 2.5, 7.6 + distBoost);
        lookTarget.set(0, 2.1, -1);
      } else if (st.activeSection === 'games') {
        basePos.set(0, 3.2, 8.8 + distBoost);
        lookTarget.set(0, 1.5, 0);
      }

      // Apply orbit rotation around Y and X
      const offset = basePos.clone().sub(lookTarget);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta += orbitYaw;
      sph.phi = THREE.MathUtils.clamp(sph.phi + orbitPitch, 0.55, 1.48);
      offset.setFromSpherical(sph);

      camera.position.lerp(lookTarget.clone().add(offset), dt * 4);
      camera.lookAt(lookTarget);

      // Visibility & transitions between Cake and Envelope
      const showCake = st.activeSection === 'overview' || st.activeSection === 'cake';
      const showEnv = st.activeSection === 'envelope';
      cakeRig.root.visible = showCake;
      envRig.root.visible = showEnv;
      stageGroup.visible = st.activeSection !== 'envelope';

      // Animate Stage rings
      ringOuter.rotation.z = elapsed * 0.16;
      ringInner.rotation.z = -elapsed * 0.24;
      stars.rotation.y = elapsed * 0.012;

      // Animate Cake Candles, Orbiting Shards & Topper
      let litCount = 0;
      cakeRig.candles.forEach((c, idx) => {
        const isLit = st.candlesLit[idx] ?? false;
        if (isLit) litCount++;
        c.flameOuter.visible = isLit;
        c.flameInner.visible = isLit;
        c.halo.visible = isLit;
        if (isLit) {
          const flicker = 0.9 + Math.sin(elapsed * 14 + c.phase) * 0.14 + Math.cos(elapsed * 23 + c.phase) * 0.08;
          c.flameOuter.scale.set(0.95, flicker, 0.95);
          c.flameOuter.rotation.z = Math.sin(elapsed * 9 + c.phase) * 0.12;
          c.flameInner.scale.set(0.95, flicker * 0.95, 0.95);
          c.halo.scale.setScalar(0.48 * flicker);
        }
      });
      cakeRig.candleLight.intensity = THREE.MathUtils.lerp(cakeRig.candleLight.intensity, litCount * 1.05, dt * 6);

      cakeRig.orbitMotes.rotation.y = elapsed * 0.35;
      cakeRig.orbitMotes.position.y = Math.sin(elapsed * 1.4) * 0.08;

      cakeRig.topperGroup.position.y = 2.98 + Math.sin(elapsed * 2) * 0.07;
      cakeRig.topperGroup.lookAt(camera.position.x, cakeRig.topperGroup.position.y, camera.position.z);

      // Animate Cake Cutting & Slice Slide
      if (st.isCut) {
        knifeAnim = Math.min(knifeAnim + dt * 2.4, 1);
        cakeRig.knifeGroup.visible = knifeAnim < 0.95;
        cakeRig.knifeGroup.position.y = THREE.MathUtils.lerp(2.9, 0.55, Math.sin(knifeAnim * Math.PI * 0.5));
        cakeRig.knifeGroup.rotation.x = THREE.MathUtils.lerp(-0.4, 0.08, knifeAnim);

        if (knifeAnim > 0.45) {
          sliceAnim = THREE.MathUtils.lerp(sliceAnim, 1, dt * 3.4);
          cakeRig.sliceTray.visible = true;
        }
      } else {
        knifeAnim = 0;
        cakeRig.knifeGroup.visible = false;
        cakeRig.sliceTray.visible = false;
        sliceAnim = THREE.MathUtils.lerp(sliceAnim, 0, dt * 6);
      }

      // Slice glides out along bisector angle (sliceStart = -0.15, sliceAngle = PI/3 => mid = -0.15 + PI/6)
      const sliceBisector = -0.15 + Math.PI / 6;
      const slideDist = sliceAnim * 1.15;
      cakeRig.sliceGroup.position.set(
        Math.sin(sliceBisector) * slideDist,
        sliceAnim * 0.16,
        Math.cos(sliceBisector) * slideDist
      );

      // Animate 3D Envelope Open & Card Slide (flap hinges backward in +X so card stays 100% unobstructed in front)
      envAnim = THREE.MathUtils.lerp(envAnim, st.envelopeOpen ? 1 : 0, dt * 4);
      envRig.root.position.y = 1.35 + Math.sin(elapsed * 1.6) * 0.05;
      envRig.root.rotation.y = Math.sin(elapsed * 0.7) * 0.05;
      envRig.auraRing.rotation.z = elapsed * 0.35;

      // Positive rotation.x swings the downward flap backward (-Z) and up behind the card
      envRig.flapHinge.rotation.x = envAnim * Math.PI * 0.92;
      envRig.flapHinge.position.z = 0.09 - envAnim * 0.16;
      envRig.waxSeal.scale.setScalar(Math.max(0.01, 1 - envAnim * 1.5));
      envRig.waxSeal.visible = envAnim < 0.65;

      // Card glides cleanly upward & slightly forward in front of the open flap
      const cardLift = THREE.MathUtils.clamp((envAnim - 0.32) / 0.68, 0, 1);
      envRig.cardMesh.position.y = cardLift * 1.15;
      envRig.cardMesh.position.z = 0.03 + cardLift * 0.36;
      envRig.cardMesh.rotation.x = -cardLift * 0.08;

      // Update Rising Wish Lanterns
      for (let i = activeLanterns.length - 1; i >= 0; i--) {
        const l = activeLanterns[i];
        l.mesh.position.y += l.speed * dt;
        l.mesh.position.x = l.baseX + Math.sin(elapsed * 0.8 + l.swayPhase) * 0.35;
        l.mesh.rotation.y += dt * 0.35;
        if (l.mesh.position.y > 18) {
          l.mesh.position.y = -0.5;
        }
      }

      // Update Firework & Smoke Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          (p.mesh.material as THREE.Material).dispose();
          particles.splice(i, 1);
          continue;
        }
        p.vel.y -= p.gravity * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        const alpha = 1 - p.life / p.maxLife;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
        p.mesh.scale.setScalar(Math.max(0.2, alpha));
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      composer?.dispose();
      renderer.dispose();
      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="three-stage"
      aria-label="Interactive 3D birthday celebration stage for Ayat"
    />
  );
};
