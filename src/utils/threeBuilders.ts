import * as THREE from 'three';

export interface CandleRef {
  id: number;
  group: THREE.Group;
  flameOuter: THREE.Mesh;
  flameInner: THREE.Mesh;
  halo: THREE.Sprite;
  hitMesh: THREE.Mesh;
  lit: boolean;
  phase: number;
}

export interface CakeRig {
  root: THREE.Group;
  mainCake: THREE.Group;
  sliceGroup: THREE.Group;
  sliceTray: THREE.Mesh;
  knifeGroup: THREE.Group;
  topperGroup: THREE.Group;
  orbitMotes: THREE.Group;
  candles: CandleRef[];
  candleLight: THREE.PointLight;
}

export interface EnvelopeRig {
  root: THREE.Group;
  flapHinge: THREE.Group;
  waxSeal: THREE.Group;
  cardMesh: THREE.Mesh;
  auraRing: THREE.Mesh;
  hitMesh: THREE.Mesh;
}

function createRadialGlowTexture(innerColor: string, midColor: string, outerColor = 'rgba(0,0,0,0)'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.38, midColor);
  grad.addColorStop(1, outerColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCakeOuterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#321942');
  grad.addColorStop(0.45, '#1d102c');
  grad.addColorStop(1, '#12091e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Rose-gold & champagne silk ribbons
  for (let i = 0; i < 28; i++) {
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(246, 201, 111, 0.28)' : 'rgba(244, 114, 182, 0.2)';
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    const y0 = Math.random() * 512;
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(170, y0 + (Math.random() - 0.5) * 95, 340, y0 + (Math.random() - 0.5) * 95, 512, y0 + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }

  // Edible gold dust speckles
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(255, 228, 165, ${0.18 + Math.random() * 0.55})`;
    const r = 0.8 + Math.random() * 2.4;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCakeSliceCrossSectionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const layers = [
    { h: 0.13, color: '#f6dfb8' }, // champagne mirror glaze
    { h: 0.21, color: '#4d261d' }, // cocoa velvet sponge
    { h: 0.12, color: '#fff2dc' }, // vanilla mascarpone cream
    { h: 0.22, color: '#5e2e23' }, // cocoa velvet sponge
    { h: 0.11, color: '#c43e71' }, // rose-berry compote
    { h: 0.21, color: '#472119' }, // base sponge
  ];

  let y = 0;
  for (const layer of layers) {
    const pxH = layer.h * 256;
    ctx.fillStyle = layer.color;
    ctx.fillRect(0, y, 256, pxH + 1);
    for (let i = 0; i < 110; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(Math.random() * 256, y + Math.random() * pxH, 2, 2);
    }
    y += pxH;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTopperBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 256);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(246, 196, 108, 0.95)';
  ctx.shadowBlur = 28;

  ctx.font = '800 90px "Syne", sans-serif';
  const goldGrad = ctx.createLinearGradient(110, 40, 400, 140);
  goldGrad.addColorStop(0, '#fff7df');
  goldGrad.addColorStop(0.5, '#f6c96f');
  goldGrad.addColorStop(1, '#ff9ec7');
  ctx.fillStyle = goldGrad;
  ctx.fillText('AYAT', 256, 98);

  ctx.shadowColor = 'rgba(94, 234, 212, 0.85)';
  ctx.shadowBlur = 14;
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#a5f3fc';
  ctx.fillText('18 NOVEMBER • CELESTIAL EDITION', 256, 174);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWaxSealTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, '#f472b6');
  grad.addColorStop(0.65, '#be185d');
  grad.addColorStop(1, '#831843');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.font = '700 40px "Cormorant Garamond", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCardFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 512, 360);
  bg.addColorStop(0, '#121528');
  bg.addColorStop(0.5, '#221536');
  bg.addColorStop(1, '#0c0f1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 360);

  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 360, 1 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#f6c96f';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 328);
  ctx.strokeStyle = 'rgba(246, 201, 111, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, 460, 308);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5eead4';
  ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ROYAL CELESTIAL DISPATCH • 18.11', 256, 76);

  ctx.fillStyle = '#fde6b3';
  ctx.font = '700 46px "Cormorant Garamond", serif';
  ctx.fillText('Happy Birthday', 256, 144);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Syne", sans-serif';
  ctx.fillText('AYAT', 256, 214);

  ctx.fillStyle = 'rgba(255, 224, 178, 0.9)';
  ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Tap to read your starlight letter', 256, 286);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildTierSection(
  radius: number,
  height: number,
  yPos: number,
  thetaStart: number,
  thetaLength: number,
  outerMat: THREE.Material,
  topMat: THREE.Material,
  insideMat: THREE.Material,
  goldMat: THREE.Material,
  creamMat: THREE.Material,
  isSlice: boolean
): THREE.Group {
  const g = new THREE.Group();
  g.position.y = yPos;

  const cylGeo = new THREE.CylinderGeometry(radius, radius, height, 36, 1, false, thetaStart, thetaLength);
  const cyl = new THREE.Mesh(cylGeo, [outerMat, topMat, outerMat]);
  g.add(cyl);

  // Gold metallic base trim ring
  const trimGeo = new THREE.TorusGeometry(radius + 0.015, 0.025, 8, 36, thetaLength);
  const trim = new THREE.Mesh(trimGeo, goldMat);
  trim.rotation.x = Math.PI / 2;
  trim.rotation.z = -thetaStart + Math.PI / 2;
  trim.position.y = -height / 2 + 0.02;
  g.add(trim);

  // Top satin cream frosting lip
  const creamRing = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.02, 0.032, 8, 36, thetaLength), creamMat);
  creamRing.rotation.x = Math.PI / 2;
  creamRing.rotation.z = -thetaStart + Math.PI / 2;
  creamRing.position.y = height / 2;
  g.add(creamRing);

  // Two radial cut planes so both the main cake cavity and the cut slice are solid
  const wallGeo = new THREE.PlaneGeometry(radius, height);
  const angles = [thetaStart, thetaStart + thetaLength];
  angles.forEach((ang, idx) => {
    const wall = new THREE.Mesh(wallGeo, insideMat);
    const dirX = Math.sin(ang);
    const dirZ = Math.cos(ang);
    wall.position.set((dirX * radius) / 2, 0, (dirZ * radius) / 2);
    const normalFlip = isSlice ? (idx === 0 ? -1 : 1) : (idx === 0 ? 1 : -1);
    wall.rotation.y = ang + (normalFlip > 0 ? -Math.PI / 2 : Math.PI / 2);
    g.add(wall);
  });

  return g;
}

export function buildCakeRig(): CakeRig {
  const root = new THREE.Group();
  const mainCake = new THREE.Group();
  const sliceGroup = new THREE.Group();

  const outerTex = createCakeOuterTexture();
  const insideTex = createCakeSliceCrossSectionTexture();
  const glowTex = createRadialGlowTexture('rgba(255, 250, 220, 1)', 'rgba(255, 145, 50, 0.5)');

  const outerMat = new THREE.MeshStandardMaterial({
    map: outerTex,
    roughness: 0.28,
    metalness: 0.22,
  });

  const topMat = new THREE.MeshStandardMaterial({
    color: 0x3f1e4e,
    roughness: 0.22,
    metalness: 0.28,
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xfef0d8,
    roughness: 0.35,
    metalness: 0.08,
  });

  const insideMat = new THREE.MeshStandardMaterial({
    map: insideTex,
    roughness: 0.62,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf6c96f,
    roughness: 0.18,
    metalness: 0.9,
    emissive: 0x523508,
    emissiveIntensity: 0.4,
  });

  const roseGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf9a8d4,
    roughness: 0.22,
    metalness: 0.72,
    emissive: 0x4c102f,
    emissiveIntensity: 0.3,
  });

  const crystalPlateMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.55,
  });

  // Luxury pedestal platter with illuminated trim
  const platterBase = new THREE.Mesh(new THREE.CylinderGeometry(1.96, 2.1, 0.14, 40), goldMat);
  platterBase.position.y = -0.07;
  root.add(platterBase);

  const platterGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.88, 0.05, 40), crystalPlateMat);
  platterGlass.position.y = 0.025;
  root.add(platterGlass);

  const sliceAngle = Math.PI / 3;
  const sliceStart = -0.15;
  const mainStart = sliceStart + sliceAngle;
  const mainLen = Math.PI * 2 - sliceAngle;

  const tiers = [
    { r: 1.48, h: 0.72, y: 0.41 },
    { r: 1.08, h: 0.64, y: 1.09 },
    { r: 0.7, h: 0.56, y: 1.69 },
  ];

  tiers.forEach((t) => {
    mainCake.add(buildTierSection(t.r, t.h, t.y, mainStart, mainLen, outerMat, topMat, insideMat, goldMat, creamMat, false));
    sliceGroup.add(buildTierSection(t.r, t.h, t.y, sliceStart, sliceAngle, outerMat, topMat, insideMat, goldMat, creamMat, true));
  });

  // Decorative gold pearls & rose-gold berries around each tier
  const pearlGeo = new THREE.SphereGeometry(0.038, 12, 12);
  const berryGeo = new THREE.SphereGeometry(0.055, 14, 14);
  tiers.forEach((t, tIdx) => {
    const count = Math.round(t.r * 18);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const inSlice = ang >= sliceStart && ang <= sliceStart + sliceAngle;
      const pearl = new THREE.Mesh(pearlGeo, i % 3 === 0 ? roseGoldMat : goldMat);
      pearl.position.set(Math.sin(ang) * (t.r + 0.01), t.y + t.h / 2 + 0.015, Math.cos(ang) * (t.r + 0.01));
      if (inSlice) sliceGroup.add(pearl);
      else mainCake.add(pearl);

      // Gourmet truffles / macarons along tier ledges
      if (tIdx < 2 && i % 4 === 0) {
        const berry = new THREE.Mesh(berryGeo, i % 8 === 0 ? goldMat : roseGoldMat);
        berry.scale.set(1, 0.72, 1);
        berry.position.set(Math.sin(ang) * (t.r - 0.14), t.y + t.h / 2 + 0.04, Math.cos(ang) * (t.r - 0.14));
        if (inSlice) sliceGroup.add(berry);
        else mainCake.add(berry);
      }
    }
  });

  // Hovering crystal serving tray tucked under the slice (fades in as slice glides out)
  const sliceTray = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.04, 32), crystalPlateMat);
  sliceTray.position.set(0.55, 0.02, 0.9);
  sliceTray.visible = false;
  sliceGroup.add(sliceTray);

  root.add(mainCake);
  root.add(sliceGroup);

  // 5 Realistic 3D Candles with dual-core flames
  const candles: CandleRef[] = [];
  const candleStickMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e6,
    roughness: 0.3,
    metalness: 0.12,
  });
  const flameOuterGeo = new THREE.ConeGeometry(0.046, 0.18, 16);
  const flameInnerGeo = new THREE.ConeGeometry(0.022, 0.1, 12);
  const hitGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.68, 10);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const candleCount = 5;
  for (let i = 0; i < candleCount; i++) {
    const tFrac = (i + 1) / (candleCount + 1);
    const ang = mainStart + 0.35 + tFrac * (mainLen - 0.7);
    const rad = 0.43;
    const cx = Math.sin(ang) * rad;
    const cz = Math.cos(ang) * rad;

    const cGroup = new THREE.Group();
    cGroup.position.set(cx, 1.97, cz);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.42, 16), candleStickMat);
    stick.position.y = 0.21;
    cGroup.add(stick);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 16), goldMat);
    collar.position.y = 0.02;
    cGroup.add(collar);

    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.06, 8),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    wick.position.y = 0.44;
    cGroup.add(wick);

    const flameOuter = new THREE.Mesh(
      flameOuterGeo,
      new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.92 })
    );
    flameOuter.position.y = 0.54;
    cGroup.add(flameOuter);

    const flameInner = new THREE.Mesh(
      flameInnerGeo,
      new THREE.MeshBasicMaterial({ color: 0xfff8dc })
    );
    flameInner.position.y = 0.51;
    cGroup.add(flameInner);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffb347,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.set(0.5, 0.5, 0.5);
    halo.position.y = 0.54;
    cGroup.add(halo);

    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.y = 0.34;
    hitMesh.userData = { candleId: i };
    cGroup.add(hitMesh);

    mainCake.add(cGroup);
    candles.push({
      id: i,
      group: cGroup,
      flameOuter,
      flameInner,
      halo,
      hitMesh,
      lit: true,
      phase: i * 1.37,
    });
  }

  const candleLight = new THREE.PointLight(0xffb454, 4.8, 9, 1.4);
  candleLight.position.set(0, 2.75, 0);
  root.add(candleLight);

  // Floating holographic AYAT topper
  const topperGroup = new THREE.Group();
  topperGroup.position.set(0, 2.98, 0);

  const badgeTex = createTopperBadgeTexture();
  const badgePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.1),
    new THREE.MeshBasicMaterial({
      map: badgeTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  topperGroup.add(badgePlane);

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.012, 12, 64),
    new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.68 })
  );
  haloRing.rotation.x = Math.PI / 2.2;
  haloRing.position.y = -0.34;
  topperGroup.add(haloRing);
  root.add(topperGroup);

  // Orbiting crystal diamond motes around the cake
  const orbitMotes = new THREE.Group();
  const shardGeo = new THREE.OctahedronGeometry(0.055, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rad = 1.95 + (i % 3) * 0.28;
    const shard = new THREE.Mesh(
      shardGeo,
      i % 2 === 0
        ? goldMat
        : new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 })
    );
    shard.position.set(Math.cos(a) * rad, 0.4 + (i % 4) * 0.55, Math.sin(a) * rad);
    orbitMotes.add(shard);
  }
  root.add(orbitMotes);

  // Futuristic Laser-Crystal Cake Knife
  const knifeGroup = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.9,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.18, 1.75), bladeMat);
  blade.position.z = 0.7;
  knifeGroup.add(blade);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.65, 16), goldMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 1.85;
  knifeGroup.add(handle);

  knifeGroup.visible = false;
  knifeGroup.position.set(0, 2.6, 0.2);
  root.add(knifeGroup);

  return {
    root,
    mainCake,
    sliceGroup,
    sliceTray,
    knifeGroup,
    topperGroup,
    orbitMotes,
    candles,
    candleLight,
  };
}

export function buildEnvelopeRig(): EnvelopeRig {
  const root = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x17132b,
    roughness: 0.32,
    metalness: 0.42,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xf2c872,
    roughness: 0.18,
    metalness: 0.9,
    emissive: 0x452d05,
    emissiveIntensity: 0.32,
  });

  const w = 3.1;
  const h = 2.05;
  const d = 0.14;

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  root.add(body);

  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.045, d + 0.02), trimMat);
  frameTop.position.y = h / 2;
  const frameBot = frameTop.clone();
  frameBot.position.y = -h / 2;
  const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.045, h + 0.05, d + 0.02), trimMat);
  frameL.position.x = -w / 2;
  const frameR = frameL.clone();
  frameR.position.x = w / 2;
  root.add(frameTop, frameBot, frameL, frameR);

  const seamShape = new THREE.Shape();
  seamShape.moveTo(-w / 2, -h / 2);
  seamShape.lineTo(0, 0.2);
  seamShape.lineTo(w / 2, -h / 2);
  seamShape.lineTo(-w / 2, -h / 2);

  const lowerPocket = new THREE.Mesh(
    new THREE.ShapeGeometry(seamShape),
    new THREE.MeshStandardMaterial({ color: 0x221b3c, roughness: 0.38, metalness: 0.35 })
  );
  lowerPocket.position.z = d / 2 + 0.01;
  root.add(lowerPocket);

  // Hinged top triangular flap
  const flapHinge = new THREE.Group();
  flapHinge.position.set(0, h / 2, d / 2 + 0.02);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-w / 2, 0);
  flapShape.lineTo(0, -h * 0.62);
  flapShape.lineTo(w / 2, 0);
  flapShape.lineTo(-w / 2, 0);

  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  const flapMesh = new THREE.Mesh(
    flapGeo,
    new THREE.MeshStandardMaterial({ color: 0x271e46, roughness: 0.28, metalness: 0.42 })
  );
  flapHinge.add(flapMesh);

  // Embossed Wax Seal with "A" monogram
  const waxSeal = new THREE.Group();
  waxSeal.position.set(0, -h * 0.56, 0.048);

  const sealTex = createWaxSealTexture();
  const sealDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.06, 32),
    [
      new THREE.MeshStandardMaterial({ color: 0x9d174d, roughness: 0.3, metalness: 0.45 }),
      new THREE.MeshStandardMaterial({ map: sealTex, roughness: 0.25, metalness: 0.35 }),
      new THREE.MeshStandardMaterial({ color: 0x9d174d, roughness: 0.3, metalness: 0.45 }),
    ]
  );
  sealDisc.rotation.x = Math.PI / 2;
  waxSeal.add(sealDisc);

  const sealRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.018, 12, 32), trimMat);
  sealRing.position.z = 0.025;
  waxSeal.add(sealRing);

  flapHinge.add(waxSeal);
  root.add(flapHinge);

  // Sliding invitation card inside envelope
  const cardTex = createCardFaceTexture();
  const cardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.88, h * 0.85, 0.03),
    [
      trimMat,
      trimMat,
      trimMat,
      trimMat,
      new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.26, metalness: 0.22 }),
      trimMat,
    ]
  );
  cardMesh.position.set(0, 0, 0.01);
  root.add(cardMesh);

  // Cosmic aura ring behind the envelope
  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.016, 12, 72),
    new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.45 })
  );
  auraRing.position.set(0, 0.1, -0.35);
  root.add(auraRing);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.6, h + 0.9, 0.7),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.userData = { envelopeHit: true };
  root.add(hitMesh);

  return {
    root,
    flapHinge,
    waxSeal,
    cardMesh,
    auraRing,
    hitMesh,
  };
}

export function createLanternMesh(colorKey: 'gold' | 'rose' | 'cyan'): THREE.Group {
  const palette = {
    gold: { body: 0xffc864, emissive: 0xff9e2c },
    rose: { body: 0xff7eb6, emissive: 0xe6397f },
    cyan: { body: 0x67e8f9, emissive: 0x0ea5e9 },
  }[colorKey];

  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.16, 0.46, 8),
    new THREE.MeshStandardMaterial({
      color: palette.body,
      emissive: palette.emissive,
      emissiveIntensity: 1.6,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    })
  );
  g.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.015, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xf6c96f, metalness: 0.85, roughness: 0.25 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.23;
  g.add(rim);

  return g;
}
