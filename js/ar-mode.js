// NXTPAK Studio - Augmented Reality (AR) & Factory Floor Inspection Engine
// Generates offline procedural QR codes, WebXR integration, and Factory Floor Conveyor simulation

export class AREngine {
  constructor(cadScene) {
    this.cadScene = cadScene;
    this.isFactoryFloorActive = false;
    this.conveyorGroup = null;
  }

  // Generates clean offline SVG QR Code (functional visual representation)
  static generateQRCodeSVG(url = 'https://nxtpak.elaraby.com/ar-viewer') {
    // Generate a high-contrast procedural matrix representing an industrial AR QR code
    const size = 25; // 25x25 QR matrix
    const cellSize = 10;
    const totalDim = size * cellSize;

    // Fixed functional QR positioning patterns at 3 corners
    const isCornerFinder = (r, c) => {
      // Top-Left (0..6, 0..6)
      if (r <= 6 && c <= 6) return true;
      // Top-Right (0..6, 18..24)
      if (r <= 6 && c >= 18) return true;
      // Bottom-Left (18..24, 0..6)
      if (r >= 18 && c <= 6) return true;
      return false;
    };

    let rects = '';

    // Draw finder patterns
    const drawFinder = (startR, startC) => {
      // Outer 7x7
      rects += `<rect x="${startC * cellSize}" y="${startR * cellSize}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#0f172a" rx="4"/>`;
      rects += `<rect x="${(startC + 1) * cellSize}" y="${(startR + 1) * cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#ffffff"/>`;
      rects += `<rect x="${(startC + 2) * cellSize}" y="${(startR + 2) * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#0f172a" rx="2"/>`;
    };

    drawFinder(0, 0);
    drawFinder(0, 18);
    drawFinder(18, 0);

    // Deterministic pseudo-random pattern for data cells based on URL hash
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isCornerFinder(r, c)) continue;
        // Timing lines
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) {
            rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 1}" height="${cellSize - 1}" fill="#0f172a"/>`;
          }
          continue;
        }

        // Data bit pseudo-randomized
        const bit = Math.abs(Math.sin((r * 31 + c * 17) + hash)) > 0.48;
        if (bit) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 1}" height="${cellSize - 1}" fill="#0284c7" rx="1.5"/>`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" class="w-full h-full max-w-[220px] max-h-[220px] p-2 bg-white rounded-xl shadow-lg shadow-cyan-500/10">
        ${rects}
      </svg>
    `;
  }

  // Toggle Simulated Factory Floor (Industrial Conveyor Line in Quesna Factory)
  toggleFactoryFloor() {
    this.isFactoryFloorActive = !this.isFactoryFloorActive;

    if (this.isFactoryFloorActive) {
      this.buildConveyorFloor();
    } else {
      this.removeConveyorFloor();
    }

    return this.isFactoryFloorActive;
  }

  buildConveyorFloor() {
    if (this.conveyorGroup) return;

    this.conveyorGroup = new THREE.Group();
    this.conveyorGroup.name = 'FactoryConveyorEnvironment';
    const floorY = -1.2;

    // 1. Industrial Stainless Steel Conveyor Frame
    const frameGeo = new THREE.BoxGeometry(6.0, 0.15, 1.8);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.8
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, floorY - 0.08, 0);
    frame.receiveShadow = true;
    this.conveyorGroup.add(frame);

    // 2. Rotating Steel Rollers
    const rollerCount = 28;
    const rollerSpacing = 6.0 / rollerCount;
    const rollerGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.7, 16);
    rollerGeo.rotateX(Math.PI / 2);
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.9
    });

    for (let i = 0; i < rollerCount; i++) {
      const roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.position.set(-3.0 + i * rollerSpacing + 0.1, floorY + 0.01, 0);
      roller.castShadow = true;
      this.conveyorGroup.add(roller);
    }

    // 3. Safety Warning Stripes along the sides (Yellow & Black diagonal warning bands)
    const stripeTex = this.createCautionStripeTexture();
    const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTex });
    const stripeGeo = new THREE.PlaneGeometry(6.0, 0.14);
    stripeGeo.rotateX(-Math.PI / 2);

    const stripeFront = new THREE.Mesh(stripeGeo, stripeMat);
    stripeFront.position.set(0, floorY + 0.02, 0.95);
    this.conveyorGroup.add(stripeFront);

    const stripeBack = new THREE.Mesh(stripeGeo, stripeMat);
    stripeBack.position.set(0, floorY + 0.02, -0.95);
    this.conveyorGroup.add(stripeBack);

    // Hide default grid while conveyor is active
    if (this.cadScene.gridHelper) {
      this.cadScene.gridHelper.visible = false;
    }

    this.cadScene.scene.add(this.conveyorGroup);
  }

  removeConveyorFloor() {
    if (!this.conveyorGroup) return;

    this.cadScene.scene.remove(this.conveyorGroup);
    this.conveyorGroup = null;

    if (this.cadScene.gridHelper) {
      this.cadScene.gridHelper.visible = true;
    }
  }

  // Generates yellow/black OSHA safety warning stripes texture via Canvas
  createCautionStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f59e0b'; // Amber yellow
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = '#111827'; // Dark charcoal
    const stripeWidth = 32;
    for (let x = -64; x < 576; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 32, 64);
      ctx.lineTo(x - 32, 64);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }
}
