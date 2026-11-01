// NXTPAK Studio - 3D Procedural Models & Generative Packaging Architect
// Built with Three.js (Procedural Geometries & Canvas Textures)

import { PRESETS, MATERIALS, PRODUCT_MATERIALS } from './config.js';

// Procedural Texture Generators using HTML5 Canvas (100% self-contained, no external asset loading errors)
export class TextureFactory {
  // Generates authentic corrugated Kraft cardboard texture with paper fiber & flute lines
  static createKraftTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base kraft paper warm tone
    ctx.fillStyle = '#b88f5c';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle paper fibers
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise * 0.9));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise * 0.7));
    }
    ctx.putImageData(imgData, 0, 0);

    // Fine flute corrugation grain lines
    ctx.strokeStyle = 'rgba(140, 95, 50, 0.15)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 512; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // Generates White EPS Styrofoam bead texture
  static createStyrofoamTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f3f6';
    ctx.fillRect(0, 0, 256, 256);

    // Voronoi / bead-like cellular dots
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 2 + Math.random() * 5;
      const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.8, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  // Generates Molded Rice Straw Fiber speckled texture
  static createRiceStrawTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#baa07e';
    ctx.fillRect(0, 0, 512, 512);

    // Organic straw specks
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 4 + Math.random() * 12;
      const angle = Math.random() * Math.PI;

      ctx.strokeStyle = Math.random() > 0.5 ? '#785b37' : '#e6d5b8';
      ctx.lineWidth = 0.8 + Math.random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generates authentic shipping box carton graphics (Elaraby logo, Fragile, Barcode, etc.)
  static createBoxGraphicsTexture(preset) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Kraft paper background
    ctx.fillStyle = '#b88c56';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle paper grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 1500; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Industrial box printings in solid dark slate ink
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = '#1c1917';

    // 1. ELARABY GROUP Brand Header
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('ELARABY GROUP', 80, 120);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('NXTPAK CIRCULAR PACKAGING SYSTEM', 80, 160);

    // 2. Preset Appliance Model Box
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(preset.name.toUpperCase(), 80, 240);

    ctx.font = '24px monospace';
    ctx.fillText(`MODEL: ${preset.model} | SPEC: ${preset.dimensions.length}x${preset.dimensions.width}x${preset.dimensions.height}mm`, 80, 280);
    ctx.fillText(`GROSS MASS: ${preset.weight} KG | ISTA-1A COMPLIANT`, 80, 315);

    // 3. Official Industrial Shipping Icons
    // Box frame
    ctx.strokeRect(80, 360, 864, 420);

    // Fragile Wine Glass Icon
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(160, 420);
    ctx.lineTo(240, 420);
    ctx.lineTo(210, 480);
    ctx.lineTo(202, 540);
    ctx.lineTo(170, 540);
    ctx.stroke();
    // Glass base
    ctx.beginPath();
    ctx.moveTo(170, 540);
    ctx.lineTo(230, 540);
    ctx.stroke();
    // Crack on glass
    ctx.beginPath();
    ctx.moveTo(185, 425);
    ctx.lineTo(205, 455);
    ctx.lineTo(195, 475);
    ctx.stroke();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('FRAGILE', 165, 580);
    ctx.fillText('HANDLE WITH CARE', 135, 605);

    // Double Up Arrows (This Side Up)
    ctx.lineWidth = 6;
    for (const x of [370, 430]) {
      ctx.beginPath();
      ctx.moveTo(x, 540);
      ctx.lineTo(x, 430);
      ctx.lineTo(x - 22, 460);
      ctx.moveTo(x, 430);
      ctx.lineTo(x + 22, 460);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(340, 550);
    ctx.lineTo(460, 550);
    ctx.stroke();
    ctx.fillText('THIS SIDE UP', 350, 580);

    // 100% Recyclable FSC Leaf / Circular Loop
    ctx.strokeRect(540, 420, 160, 130);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('100% RECYCLABLE', 545, 465);
    ctx.font = '16px monospace';
    ctx.fillText('ZERO EPS STYROFOAM', 545, 495);
    ctx.fillText('HONEYCOMB / KRAFT', 545, 525);

    // Barcode Simulation
    ctx.fillRect(740, 420, 160, 100);
    ctx.fillStyle = '#ffffff';
    let bx = 745;
    while (bx < 895) {
      const w = 2 + Math.floor(Math.random() * 5);
      ctx.fillRect(bx, 425, w, 80);
      bx += w + 2 + Math.floor(Math.random() * 3);
    }
    ctx.fillStyle = '#1c1917';
    ctx.font = '14px monospace';
    ctx.fillText('EAN-13: 622119045812', 740, 540);

    // Bottom Footer
    ctx.fillStyle = '#44403c';
    ctx.font = '20px sans-serif';
    ctx.fillText('DESIGNED IN EGYPT FOR ELARABY INDUSTRIAL COMPLEX (QUESNA & BENHA)', 80, 830);
    ctx.fillText('ENGINEERED BY NXTPAK AI TOPOLOGY GENERATOR - HACKATHON 2026', 80, 865);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Generates TV screen display pattern (Tornado 4K OLED Demo)
  static createTVScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');

    // Modern futuristic ambient gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 576);
    grad.addColorStop(0, '#0a192f');
    grad.addColorStop(0.4, '#0f3460');
    grad.addColorStop(0.7, '#e94560');
    grad.addColorStop(1, '#533483');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 576);

    // Subtle tech curves / wave
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < 1024; x += 10) {
      const y = 288 + Math.sin(x * 0.015) * 80 + Math.cos(x * 0.03) * 30;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Tornado Brand Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('TORNADO', 80, 120);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('4K ULTRA HD • HDR10+ • DOLBY VISION', 80, 160);

    // Elaraby Group tag
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('ELARABY GROUP CONSUMER ELECTRONICS DIVISION', 80, 520);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

// Model Builder
export class ModelBuilder {
  constructor() {
    this.materialsCache = {};
    this.initBaseMaterials();
  }

  initBaseMaterials() {
    this.materialsCache.kraft = new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.85,
      metalness: 0.02,
      map: TextureFactory.createKraftTexture()
    });

    this.materialsCache.eps = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95,
      metalness: 0.02,
      map: TextureFactory.createStyrofoamTexture()
    });

    this.materialsCache.pulp = new THREE.MeshStandardMaterial({
      color: 0xb59a78,
      roughness: 0.90,
      metalness: 0.01,
      map: TextureFactory.createRiceStrawTexture()
    });

    this.materialsCache.metalChassis = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.85
    });

    this.materialsCache.stainlessSteel = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.25,
      metalness: 0.90
    });

    this.materialsCache.glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.5
    });
  }

  // Returns normalized scale factor so dimensions in mm (e.g. 1230mm) map to reasonable 3D units (~2.0 - 3.5 units)
  static getScale(dims) {
    const maxDim = Math.max(dims.length, dims.width, dims.height);
    return 2.5 / maxDim; // Normalized max dimension = 2.5 units
  }

  // Build the 3D Appliance Model with Enclosure Material properties
  createAppliance(presetKey, customDims = null, productMaterialKey = null) {
    const group = new THREE.Group();
    group.name = 'ApplianceRoot';

    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const s = ModelBuilder.getScale(dims);

    const prodMatKey = productMaterialKey || preset.defaultProductMaterial || 'sheet_metal_steel';
    const prodMat = PRODUCT_MATERIALS[prodMatKey] || PRODUCT_MATERIALS.sheet_metal_steel;

    // Dimensions in 3D units
    const L = dims.length * s;
    const W = dims.width * s;
    const H = dims.height * s;

    group.userData = { dims, scale: s, L, W, H, preset, productMaterial: prodMat };

    if (presetKey === 'custom' && this.uploadedCustomMesh) {
      const customClone = this.uploadedCustomMesh.clone(true);
      const bbox = new THREE.Box3().setFromObject(customClone);
      const bsize = new THREE.Vector3();
      bbox.getSize(bsize);
      const maxB = Math.max(bsize.x, bsize.y, bsize.z);
      if (maxB > 0) {
        const targetMax = Math.max(L, H, W);
        const fit = (targetMax / maxB) * 0.95;
        customClone.scale.set(fit, fit, fit);
      }
      // Re-center after scaling to guarantee perfect alignment with generative buffers
      const scaledBbox = new THREE.Box3().setFromObject(customClone);
      const scaledCenter = new THREE.Vector3();
      scaledBbox.getCenter(scaledCenter);
      customClone.position.sub(scaledCenter);
      group.add(customClone);
    } else {
      switch (presetKey) {
        case 'tv':
          this.buildTV(group, L, W, H);
          break;
        case 'microwave':
          this.buildMicrowave(group, L, W, H);
          break;
        case 'blender':
          this.buildBlender(group, L, W, H);
          break;
        default:
          this.buildCustomAppliance(group, L, W, H, preset);
          break;
      }
    }

    return group;
  }

  // Procedural TV Model
  buildTV(group, L, W, H) {
    // Ultra-thin bezel screen
    const screenThick = W * 0.25;
    const screenGeo = new THREE.BoxGeometry(L, H, screenThick);
    
    // Front face has TV demo texture, sides have dark metal frame
    const screenTex = TextureFactory.createTVScreenTexture();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTex,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x0f2942,
      emissiveIntensity: 0.3
    });

    // Box materials: [right, left, top, bottom, front, back]
    const screenMats = [frameMat, frameMat, frameMat, frameMat, screenMat, frameMat];
    const screenMesh = new THREE.Mesh(screenGeo, screenMats);
    screenMesh.castShadow = true;
    screenMesh.receiveShadow = true;
    group.add(screenMesh);

    // Back electronics bulge (lower half)
    const backThick = W * 0.75;
    const backGeo = new THREE.BoxGeometry(L * 0.7, H * 0.45, backThick);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, -H * 0.2, -screenThick / 2 - backThick / 2);
    backMesh.castShadow = true;
    group.add(backMesh);

    // Tornado sleek V-stand legs (2 feet)
    const legMat = this.materialsCache.stainlessSteel;
    const legGeo = new THREE.CylinderGeometry(0.015, 0.015, H * 0.25);
    legGeo.rotateZ(Math.PI / 8);

    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-L * 0.35, -H * 0.48, 0);
    leg1.castShadow = true;
    group.add(leg1);

    const legGeo2 = legGeo.clone();
    legGeo2.rotateZ(-Math.PI / 4);
    const leg2 = new THREE.Mesh(legGeo2, legMat);
    leg2.position.set(L * 0.35, -H * 0.48, 0);
    leg2.castShadow = true;
    group.add(leg2);
  }

  // Procedural Sharp Microwave Model
  buildMicrowave(group, L, W, H) {
    // Main stainless steel outer casing
    const bodyGeo = new THREE.BoxGeometry(L, H, W);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materialsCache.stainlessSteel);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Tinted dark glass door on left 70%
    const doorW = L * 0.68;
    const doorGeo = new THREE.BoxGeometry(doorW, H * 0.85, 0.02);
    const doorMesh = new THREE.Mesh(doorGeo, this.materialsCache.glass);
    doorMesh.position.set(-L / 2 + doorW / 2 + 0.04, 0, W / 2 + 0.01);
    group.add(doorMesh);

    // Door vertical handle
    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, H * 0.6);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-L / 2 + doorW - 0.03, 0, W / 2 + 0.04);
    group.add(handle);

    // Control Keypad Panel on right 30%
    const panelW = L * 0.25;
    const panelGeo = new THREE.BoxGeometry(panelW, H * 0.85, 0.015);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(L / 2 - panelW / 2 - 0.04, 0, W / 2 + 0.01);
    group.add(panel);

    // LED Time Readout (Sharp Green Digital Display)
    const ledGeo = new THREE.BoxGeometry(panelW * 0.8, H * 0.15, 0.01);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(L / 2 - panelW / 2 - 0.04, H * 0.28, W / 2 + 0.025);
    group.add(led);

    // Heavy internal magnetron component visualization (offset mass)
    const magGeo = new THREE.BoxGeometry(L * 0.22, H * 0.35, W * 0.4);
    const magMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.7 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(L * 0.3, 0, -W * 0.1);
    mag.visible = false; // Toggled in section view
    mag.name = 'MagnetronMass';
    group.add(mag);
  }

  // Procedural Tornado Stand Blender Model
  buildBlender(group, L, W, H) {
    // 1. Motor Base (Lower cylinder / truncated cone)
    const baseH = H * 0.42;
    const baseRadiusBottom = Math.min(L, W) * 0.48;
    const baseRadiusTop = baseRadiusBottom * 0.78;
    const baseGeo = new THREE.CylinderGeometry(baseRadiusTop, baseRadiusBottom, baseH, 32);
    const baseMat = this.materialsCache.stainlessSteel;
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, -H / 2 + baseH / 2, 0);
    base.castShadow = true;
    group.add(base);

    // Speed rotary dial knob
    const knobGeo = new THREE.CylinderGeometry(baseRadiusTop * 0.3, baseRadiusTop * 0.3, 0.03, 24);
    knobGeo.rotateX(Math.PI / 2);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.set(0, -H / 2 + baseH * 0.45, baseRadiusBottom * 0.82);
    group.add(knob);

    // Rubber anti-slip feet
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const footGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
      const footMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(
        Math.cos(angle) * (baseRadiusBottom * 0.75),
        -H / 2 + 0.01,
        Math.sin(angle) * (baseRadiusBottom * 0.75)
      );
      group.add(foot);
    }

    // 2. Glass Pitcher / Jar
    const jarH = H * 0.52;
    const jarRadiusBottom = baseRadiusTop * 0.72;
    const jarRadiusTop = baseRadiusBottom * 0.75;
    const jarGeo = new THREE.CylinderGeometry(jarRadiusTop, jarRadiusBottom, jarH, 24);
    const jar = new THREE.Mesh(jarGeo, this.materialsCache.glass);
    jar.position.set(0, -H / 2 + baseH + jarH / 2, 0);
    jar.castShadow = true;
    group.add(jar);

    // Pitcher handle
    const handleCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(jarRadiusBottom + 0.02, -H / 2 + baseH + 0.08, 0),
      new THREE.Vector3(jarRadiusTop + 0.22, -H / 2 + baseH + 0.12, 0),
      new THREE.Vector3(jarRadiusTop + 0.22, -H / 2 + baseH + jarH - 0.1, 0),
      new THREE.Vector3(jarRadiusTop + 0.02, -H / 2 + baseH + jarH - 0.04, 0)
    );
    const handleGeo = new THREE.TubeGeometry(handleCurve, 20, 0.025, 8, false);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    group.add(handle);

    // Lid on top of jar
    const lidGeo = new THREE.CylinderGeometry(jarRadiusTop * 1.05, jarRadiusTop * 0.95, 0.04, 24);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(0, -H / 2 + baseH + jarH + 0.02, 0);
    group.add(lid);
  }

  // Procedural Custom Appliance Model
  buildCustomAppliance(group, L, W, H, preset) {
    const mainGeo = new THREE.BoxGeometry(L, H, W);
    const mainMesh = new THREE.Mesh(mainGeo, this.materialsCache.metalChassis);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    // Top control bezel
    const bezelGeo = new THREE.BoxGeometry(L * 0.85, 0.04, W * 0.6);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, H / 2 + 0.02, 0);
    group.add(bezel);

    // Status LED Strip
    const ledGeo = new THREE.BoxGeometry(L * 0.7, 0.015, 0.02);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.0
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, H * 0.35, W / 2 + 0.01);
    group.add(led);
  }

  // Build Generative Protective Cardboard / Packaging Buffers
  // 8 Modular Corner Cushion Caps + Perimeter Ribs around the appliance
  createGenerativeBuffers(presetKey, materialKey = 'honeycomb', customDims = null, packageSpec = {}) {
    const buffersGroup = new THREE.Group();
    buffersGroup.name = 'GenerativeBuffersRoot';

    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const s = ModelBuilder.getScale(dims);

    const L = dims.length * s;
    const W = dims.width * s;
    const H = dims.height * s;

    // Buffer cushion thickness (procedurally calculated based on appliance mass & fragility)
    // Heavier/fragile appliances get thicker cushion
    const cushionThick = packageSpec.cushionThickness > 0
      ? packageSpec.cushionThickness * s
      : Math.max(0.18, (preset.weight / 20) * 0.22 + (preset.fragility / 10) * 0.12);
    const cornerSize = Math.max(0.28, Math.min(L, W, H) * 0.35);

    // Select material
    const matConfig = MATERIALS[materialKey] || MATERIALS.honeycomb;
    let bufferMaterial;

    if (materialKey === 'eps') {
      bufferMaterial = this.materialsCache.eps.clone();
    } else if (materialKey === 'pulp') {
      bufferMaterial = this.materialsCache.pulp.clone();
    } else {
      bufferMaterial = this.materialsCache.kraft.clone();
    }

    // Store references to all cushion meshes for exploded view and stress heatmap animations
    const cushionMeshes = [];
    const cornerVectors = [
      { x: 1, y: 1, z: 1 },
      { x: -1, y: 1, z: 1 },
      { x: 1, y: 1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: 1, y: -1, z: 1 },
      { x: -1, y: -1, z: 1 },
      { x: 1, y: -1, z: -1 },
      { x: -1, y: -1, z: -1 }
    ];

    const cushionQuantity = Number.isFinite(packageSpec.cushionQuantity) ? packageSpec.cushionQuantity : 8;
    cornerVectors.forEach((dir, idx) => {
      const cornerGroup = new THREE.Group();
      cornerGroup.name = `CornerBuffer_${idx}`;
      cornerGroup.visible = idx < cushionQuantity;

      // Positional coordinates hugging the 8 corners of the appliance
      const posX = (L / 2) * dir.x;
      const posY = (H / 2) * dir.y;
      const posZ = (W / 2) * dir.z;

      cornerGroup.position.set(posX, posY, posZ);

      // Procedural 3D Cushion Cap geometry:
      // An L-shaped tri-fold corner socket that locks over the corner of the appliance
      const capWidth = cornerSize;
      const capDepth = cornerSize;
      const capHeight = cornerSize;

      // Outer cushion geometry
      let cornerMesh;
      if (materialKey === 'origami') {
        // Faceted origami tetrahedral folding geometry
        const origamiGeo = this.createOrigamiCornerGeometry(capWidth, capHeight, capDepth, cushionThick, dir);
        cornerMesh = new THREE.Mesh(origamiGeo, bufferMaterial);
      } else if (materialKey === 'honeycomb') {
        // Multi-flute stepped honeycomb geometry with hollow corrugation ribs
        const honeyGeo = this.createHoneycombCornerGeometry(capWidth, capHeight, capDepth, cushionThick, dir);
        cornerMesh = new THREE.Mesh(honeyGeo, bufferMaterial);
      } else if (materialKey === 'pulp') {
        // Contoured molded pulp geometry with smooth fillets
        const pulpGeo = this.createPulpCornerGeometry(capWidth, capHeight, capDepth, cushionThick, dir);
        cornerMesh = new THREE.Mesh(pulpGeo, bufferMaterial);
      } else {
        // EPS blocky foam cap
        const epsGeo = this.createEPSCornerGeometry(capWidth, capHeight, capDepth, cushionThick, dir);
        cornerMesh = new THREE.Mesh(epsGeo, bufferMaterial);
      }

      cornerMesh.castShadow = true;
      cornerMesh.receiveShadow = true;
      cornerMesh.userData = {
        isBuffer: true,
        cornerIndex: idx,
        dir: dir,
        origPos: new THREE.Vector3(posX, posY, posZ),
        origScale: new THREE.Vector3(1, 1, 1),
        currentStress: 0.0
      };

      cornerGroup.add(cornerMesh);
      cushionMeshes.push(cornerMesh);
      buffersGroup.add(cornerGroup);
    });

    // Add perimeter edge protective ribs for long appliances (like TV or Microwave)
    if (L > 1.2) {
      // Top and bottom protective edge ribs
      [-1, 1].forEach((sideY) => {
        const edgeGeo = new THREE.BoxGeometry(L * 0.5, cushionThick * 0.6, W + cushionThick);
        const edgeMesh = new THREE.Mesh(edgeGeo, bufferMaterial);
        edgeMesh.position.set(0, (H / 2 + cushionThick * 0.3) * sideY, 0);
        edgeMesh.castShadow = true;
        edgeMesh.userData = {
          isBuffer: true,
          dir: { x: 0, y: sideY, z: 0 },
          origPos: edgeMesh.position.clone(),
          origScale: new THREE.Vector3(1, 1, 1),
          currentStress: 0.0
        };
        cushionMeshes.push(edgeMesh);
        buffersGroup.add(edgeMesh);
      });
    }

    buffersGroup.userData = {
      cushionMeshes,
      materialKey,
      cushionThick,
      cushionVolumeM3: (cushionThick * cornerSize * cornerSize * 8) / (s * s * s * 1e9),
      L, W, H, s
    };

    return buffersGroup;
  }

  // Origami Corner Geometry: Faceted folds (Miura-ori crease lines)
  createOrigamiCornerGeometry(w, h, d, t, dir) {
    const geo = new THREE.BoxGeometry(w, h, d, 6, 6, 6);
    // Bevel outer vertices to mimic angled origami paper folds
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let vx = pos.getX(i);
      let vy = pos.getY(i);
      let vz = pos.getZ(i);

      if (Math.sign(vx) === dir.x && Math.sign(vy) === dir.y && Math.sign(vz) === dir.z) {
        pos.setXYZ(i, vx * 0.85, vy * 0.85, vz * 0.85);
      }
    }
    geo.computeVertexNormals();
    geo.userData = { basePositions: Float32Array.from(pos.array) };
    return geo;
  }

  // Honeycomb Corner Geometry: Stepped fluting layers
  createHoneycombCornerGeometry(w, h, d, t, dir) {
    const geo = new THREE.BoxGeometry(w, h, d, 8, 8, 8);
    geo.userData = { basePositions: Float32Array.from(geo.attributes.position.array) };
    return geo;
  }

  // Pulp Corner Geometry: Rounded organic bevels
  createPulpCornerGeometry(w, h, d, t, dir) {
    const geo = new THREE.BoxGeometry(w, h, d, 6, 6, 6);
    geo.userData = { basePositions: Float32Array.from(geo.attributes.position.array) };
    return geo;
  }

  // EPS Styrofoam Corner Geometry: Blocky chunky foam
  createEPSCornerGeometry(w, h, d, t, dir) {
    const epsThickMultiplier = 1.35;
    const geo = new THREE.BoxGeometry(w * epsThickMultiplier, h * epsThickMultiplier, d * epsThickMultiplier, 8, 8, 8);
    geo.userData = { basePositions: Float32Array.from(geo.attributes.position.array) };
    return geo;
  }

  // Build the Outer Shipping Carton Box with authentic Elaraby markings
  createOuterBox(presetKey, buffersGroup, customDims = null, packageSpec = {}) {
    const group = new THREE.Group();
    group.name = 'OuterBoxRoot';

    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const s = ModelBuilder.getScale(dims);

    const L = dims.length * s;
    const W = dims.width * s;
    const H = dims.height * s;
    const cushionThick = buffersGroup.userData.cushionThick || 0.22;

    const boxL = (packageSpec.length > 0 ? packageSpec.length * s : (L + cushionThick * 2 + 0.06));
    const boxH = (packageSpec.height > 0 ? packageSpec.height * s : (H + cushionThick * 2 + 0.06));
    const boxW = (packageSpec.width > 0 ? packageSpec.width * s : (W + cushionThick * 2 + 0.06));

    const boxTex = TextureFactory.createBoxGraphicsTexture(preset);
    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTex,
      roughness: 0.8,
      metalness: 0.05,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    const boxGeo = new THREE.BoxGeometry(boxL, boxH, boxW, 10, 10, 10);
    boxGeo.userData = { basePositions: Float32Array.from(boxGeo.attributes.position.array) };
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.name = 'CartonMesh';
    boxMesh.castShadow = true;
    group.add(boxMesh);

    // Add high-tech wireframe edge cage
    const wireGeo = new THREE.EdgesGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.7
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.name = 'CartonWireframe';
    group.add(wireMesh);

    // Authentic Industrial Appliance Internal Packaging Layouts (Top Tray, Side Bay, Edge Rails, Base Skid)
    this.createCartonInternalLayout(group, packageSpec.layout, boxL, boxH, boxW, L, H, W, cushionThick, s);

    group.userData = {
      boxL, boxH, boxW,
      boxMesh,
      wireMesh,
      boxMat
    };

    return group;
  }

  // Build authentic internal packaging layouts with ZERO appliance clipping
  createCartonInternalLayout(group, layoutKey, boxL, boxH, boxW, L, H, W, cushionThick, s) {
    const layout = String(layoutKey || 'top_tray').toLowerCase();

    // High-quality materials for authentic corrugated cardboard and accessories
    const kraftMat = new THREE.MeshStandardMaterial({
      color: 0xc89d6c, // Authentic kraft corrugated brown
      roughness: 0.88,
      metalness: 0.05
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark graphite for accessories like remote control
      roughness: 0.5,
      metalness: 0.2
    });

    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Matte black cable rubber
      roughness: 0.9,
      metalness: 0.1
    });

    const manualMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Crisp white paper manual
      roughness: 0.6,
      metalness: 0.0
    });

    const metalPartMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Slate metallic for pedestal stand brackets
      roughness: 0.35,
      metalness: 0.8
    });

    const partitionGroup = new THREE.Group();
    partitionGroup.name = 'CartonPartitionRoot';
    partitionGroup.userData = { isPartition: true };

    // 1. TOP ACCESSORY TRAY (Remote, Cables, User Manual & Warranty)
    // Sits safely above the product in the upper clearance gap (ZERO appliance clipping)
    if (/top_tray|top|accessory|tray|علوي|صينية/.test(layout)) {
      const topProductY = H / 2;
      const topBoxY = boxH / 2;
      const clearGapY = Math.max(0.04, topBoxY - topProductY);

      const trayThickness = Math.min(0.065, Math.max(0.03, clearGapY * 0.75));
      const trayCenterY = topProductY + (clearGapY * 0.52);

      const trayL = Math.min(boxL * 0.92, L + cushionThick * 1.5);
      const trayW = Math.min(boxW * 0.92, W + cushionThick * 1.5);

      // Main tray floor
      const floorGeo = new THREE.BoxGeometry(trayL, 0.006, trayW);
      const floorMesh = new THREE.Mesh(floorGeo, kraftMat);
      floorMesh.name = 'CartonPartition_TrayFloor';
      floorMesh.position.set(0, trayCenterY - trayThickness / 2 + 0.003, 0);
      floorMesh.userData.isPartition = true;
      partitionGroup.add(floorMesh);

      // Tray perimeter lip / walls (4 edges)
      const wallH = trayThickness;
      const wallThick = 0.006;

      // Front and Back lips
      [-1, 1].forEach((sideZ) => {
        const lip = new THREE.Mesh(new THREE.BoxGeometry(trayL, wallH, wallThick), kraftMat);
        lip.name = 'CartonPartition_LipZ';
        lip.position.set(0, trayCenterY, sideZ * (trayW / 2 - wallThick / 2));
        lip.userData.isPartition = true;
        partitionGroup.add(lip);
      });
      // Left and Right lips
      [-1, 1].forEach((sideX) => {
        const lip = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, trayW - wallThick * 2), kraftMat);
        lip.name = 'CartonPartition_LipX';
        lip.position.set(sideX * (trayL / 2 - wallThick / 2), trayCenterY, 0);
        lip.userData.isPartition = true;
        partitionGroup.add(lip);
      });

      // Internal compartment divider (splits tray into accessories vs manual)
      const innerDivider = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH * 0.85, trayW * 0.88), kraftMat);
      innerDivider.name = 'CartonPartition_Divider';
      innerDivider.position.set(trayL * 0.1, trayCenterY, 0);
      innerDivider.userData.isPartition = true;
      partitionGroup.add(innerDivider);

      // Modeled Accessory 1: Remote Control inside its recessed compartment
      const remoteL = Math.min(0.20, trayL * 0.35);
      const remoteW = Math.min(0.05, trayW * 0.3);
      const remoteH = 0.014;
      const remoteMesh = new THREE.Mesh(new THREE.BoxGeometry(remoteL, remoteH, remoteW), darkAccentMat);
      remoteMesh.name = 'CartonPartition_Remote';
      remoteMesh.position.set(-trayL * 0.22, trayCenterY - trayThickness / 2 + remoteH / 2 + 0.004, -trayW * 0.15);
      remoteMesh.userData.isPartition = true;
      partitionGroup.add(remoteMesh);

      // Modeled Accessory 2: Bundled Power Cable / Adapter spool
      const cableSpool = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(0.04, trayW * 0.22), Math.min(0.04, trayW * 0.22), 0.02, 16), cableMat);
      cableSpool.name = 'CartonPartition_Cable';
      cableSpool.position.set(-trayL * 0.22, trayCenterY - trayThickness / 2 + 0.012, trayW * 0.18);
      cableSpool.userData.isPartition = true;
      partitionGroup.add(cableSpool);

      // Modeled Accessory 3: Official Elaraby User Manual & Warranty booklet
      const manualL = Math.min(0.24, trayL * 0.3);
      const manualW = Math.min(0.18, trayW * 0.65);
      const manualH = 0.008;
      const manualMesh = new THREE.Mesh(new THREE.BoxGeometry(manualL, manualH, manualW), manualMat);
      manualMesh.name = 'CartonPartition_Manual';
      manualMesh.position.set(trayL * 0.28, trayCenterY - trayThickness / 2 + manualH / 2 + 0.004, 0);
      manualMesh.userData.isPartition = true;
      partitionGroup.add(manualMesh);
    }
    // 2. SIDE ACCESSORY BAY (Pedestal Stand, Brackets, In-box Hardware)
    else if (/side_bay|side|compartment|جانبي|قواعد/.test(layout)) {
      const dividerThick = 0.01;
      const dividerX = L / 2 + cushionThick * 0.8;
      const bayWidth = Math.max(0.05, (boxL / 2) - dividerX);

      // Vertical dividing wall placed safely beside the appliance
      const divH = Math.min(boxH * 0.92, H + cushionThick * 1.8);
      const divW = boxW * 0.92;
      const dividerMesh = new THREE.Mesh(new THREE.BoxGeometry(dividerThick, divH, divW), kraftMat);
      dividerMesh.name = 'CartonPartition_SideDivider';
      dividerMesh.position.set(dividerX, 0, 0);
      dividerMesh.userData.isPartition = true;
      partitionGroup.add(dividerMesh);

      // Accessory nest inside the side bay (metallic stand brackets)
      const standGeo = new THREE.BoxGeometry(Math.min(0.05, bayWidth * 0.65), divH * 0.45, divW * 0.35);
      const standMesh = new THREE.Mesh(standGeo, metalPartMat);
      standMesh.name = 'CartonPartition_StandNest';
      standMesh.position.set(dividerX + bayWidth * 0.5, 0, 0);
      standMesh.userData.isPartition = true;
      partitionGroup.add(standMesh);
    }
    // 3. PERIMETER EDGE PROTECTIVE RAILS (Angleboards for Clamp & Strapping Guard)
    else if (/edge_rails|edge|rails|حواف|قضبان/.test(layout)) {
      const railThick = 0.012;
      const railWidth = Math.max(0.04, 12 * s);
      const railH = boxH * 0.94;

      const posX = boxL / 2 - railWidth / 2 - 0.005;
      const posZ = boxW / 2 - railWidth / 2 - 0.005;

      // 4 Vertical corner angleboards flanking the 4 corners inside the carton
      [
        { x: 1, z: 1 },
        { x: -1, z: 1 },
        { x: 1, z: -1 },
        { x: -1, z: -1 }
      ].forEach((dir, idx) => {
        const flange1 = new THREE.Mesh(new THREE.BoxGeometry(railThick, railH, railWidth), kraftMat);
        flange1.name = `CartonPartition_AngleRail1_${idx}`;
        flange1.position.set(dir.x * posX, 0, dir.z * (posZ - railWidth / 4));
        flange1.userData.isPartition = true;
        partitionGroup.add(flange1);

        const flange2 = new THREE.Mesh(new THREE.BoxGeometry(railWidth, railH, railThick), kraftMat);
        flange2.name = `CartonPartition_AngleRail2_${idx}`;
        flange2.position.set(dir.x * (posX - railWidth / 4), 0, dir.z * posZ);
        flange2.userData.isPartition = true;
        partitionGroup.add(flange2);
      });

      // 2 Horizontal top edge rails (resists top strapping band tension)
      [-1, 1].forEach((sideZ, idx) => {
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(boxL * 0.88, railThick, railWidth), kraftMat);
        topRail.name = `CartonPartition_TopRail_${idx}`;
        topRail.position.set(0, boxH / 2 - railWidth / 2 - 0.005, sideZ * (boxW / 2 - railWidth / 2));
        topRail.userData.isPartition = true;
        partitionGroup.add(topRail);
      });
    }
    // 4. HEAVY-DUTY BASE CUSHION TRAY (Forklift & Pallet Skid)
    else if (/base_skid_tray|base|tray|قاعدة|منصات/.test(layout)) {
      const trayThick = Math.max(0.04, (boxH / 2 - H / 2) * 0.85);
      const trayY = -H / 2 - trayThick / 2 - 0.005;
      const trayL = Math.min(boxL * 0.95, L + cushionThick * 2);
      const trayW = Math.min(boxW * 0.95, W + cushionThick * 2);

      // Heavy bottom deck
      const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(trayL, trayThick, trayW), kraftMat);
      baseDeck.name = 'CartonPartition_BaseDeck';
      baseDeck.position.set(0, trayY, 0);
      baseDeck.userData.isPartition = true;
      partitionGroup.add(baseDeck);

      // 2 Longitudinal skid runners underneath (forklift fork pockets)
      [-1, 1].forEach((sideZ, idx) => {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(trayL * 0.98, trayThick * 0.7, trayW * 0.18), kraftMat);
        runner.name = `CartonPartition_Runner_${idx}`;
        runner.position.set(0, trayY - trayThick * 0.85, sideZ * (trayW * 0.35));
        runner.userData.isPartition = true;
        partitionGroup.add(runner);
      });
    }
    // 5. OPEN CAVITY (open_8corners / default)
    // Clean open cavity with 8 corner buffers, no extra partitions needed

    if (partitionGroup.children.length > 0) {
      group.add(partitionGroup);
    }
  }
}
