// NXTPAK Studio - 3D Scene Controller & Industrial CAD Viewport
// Manages Three.js WebGL renderer, studio lighting, camera presets, grid floor, and calipers

export class CADScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`CADScene container #${containerId} not found`);
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gridHelper = null;
    this.dimensionGroup = null;
    this.scanLaserMesh = null;
    this.shadowPlane = null;
    this.lights = {};
    this.impactFlashLight = null;

    this.isScanning = false;
    this.scanProgress = 0;

    // Realistic Camera Shake
    this.cameraShakeIntensity = 0;
    this.cameraShakeOffset = new THREE.Vector3(0, 0, 0);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth * 0.6;
    const height = this.container.clientHeight || window.innerHeight * 0.7;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f18); // Deep industrial navy / CAD slate
    this.scene.fog = new THREE.FogExp2(0x0a0f18, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.setCameraPreset('isometric');

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 14.0;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Studio Lighting Setup
    this.setupLighting();

    // 6. CAD Environment Floor & Grid
    this.setupCADFloor();

    // 7. Generative Scan Laser (for AI generation animation)
    this.setupScanLaser();

    // 8. Dimension Calipers Group
    this.dimensionGroup = new THREE.Group();
    this.dimensionGroup.name = 'DimensionCalipers';
    this.scene.add(this.dimensionGroup);

    // 9. Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());

    // 10. Start Animation Render Loop
    this.render();
  }

  setupLighting() {
    // Ambient light with cool industrial cyan/slate tint
    const ambient = new THREE.AmbientLight(0xdbeafe, 0.65);
    this.scene.add(ambient);
    this.lights.ambient = ambient;

    // Key directional light casting soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    const d = 4.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    this.scene.add(keyLight);
    this.lights.keyLight = keyLight;

    // Cyan rim light for high-tech CAD edge illumination
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-6, 3, -5);
    this.scene.add(rimLight);
    this.lights.rimLight = rimLight;

    // Warm bounce light from bottom
    const bounceLight = new THREE.DirectionalLight(0xd97706, 0.35);
    bounceLight.position.set(0, -3, 2);
    this.scene.add(bounceLight);
    this.lights.bounceLight = bounceLight;
  }

  setupCADFloor() {
    // 1. High-tech dual-layer grid
    // Large primary grid (10m x 10m, cyan axes)
    const grid = new THREE.GridHelper(12, 48, 0x0284c7, 0x1e293b);
    grid.position.y = -1.2;
    grid.material.opacity = 0.55;
    grid.material.transparent = true;
    this.scene.add(grid);
    this.gridHelper = grid;

    // 2. High-precision circular measurement reticle
    const reticleGeo = new THREE.RingGeometry(0.5, 0.52, 64);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.y = -1.19;
    this.scene.add(reticle);

    const reticle2 = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.52, 64).rotateX(-Math.PI / 2),
      reticleMat
    );
    reticle2.position.y = -1.19;
    this.scene.add(reticle2);

    // 3. Ground shadow receiver plane
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.45
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.position.y = -1.195;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // 4. Drop-test dual concentric shockwave ripple rings (activated on impact)
    const ringGeo = new THREE.RingGeometry(0.05, 0.14, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.impactShockRing = new THREE.Mesh(ringGeo, ringMat);
    this.impactShockRing.position.y = -1.18;
    this.scene.add(this.impactShockRing);

    // Outer supersonic shockwave ring
    const ringGeoOuter = new THREE.RingGeometry(0.15, 0.22, 64);
    ringGeoOuter.rotateX(-Math.PI / 2);
    const ringMatOuter = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.impactShockRingOuter = new THREE.Mesh(ringGeoOuter, ringMatOuter);
    this.impactShockRingOuter.position.y = -1.182;
    this.scene.add(this.impactShockRingOuter);
  }

  // Laser sweep plane for Generative AI animation
  setupScanLaser() {
    const laserGeo = new THREE.PlaneGeometry(4, 0.03);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.scanLaserMesh = new THREE.Mesh(laserGeo, laserMat);
    this.scanLaserMesh.rotation.x = Math.PI / 2;
    this.scene.add(this.scanLaserMesh);
  }

  triggerScanAnimation(callback) {
    this.isScanning = true;
    this.scanProgress = 0;
    this.scanLaserMesh.material.opacity = 0.9;
    this.scanLaserMesh.position.y = 1.5;

    const duration = 1200; // ms
    const startTime = performance.now();

    const animateScan = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      this.scanProgress = t;

      // Move laser down from 1.5 to -1.2
      this.scanLaserMesh.position.y = 1.5 - t * 2.7;

      if (t < 1.0) {
        requestAnimationFrame(animateScan);
      } else {
        this.isScanning = false;
        this.scanLaserMesh.material.opacity = 0;
        if (callback) callback();
      }
    };

    requestAnimationFrame(animateScan);
  }

  // Trigger physical camera shake proportional to G-force
  triggerCameraShake(intensity = 0.16, duration = 480) {
    this.cameraShakeIntensity = intensity;
    const startTime = performance.now();

    const shakeStep = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // Exponential decay envelope
      const damp = Math.exp(-t * 5.0);

      if (t < 1.0) {
        this.cameraShakeOffset.set(
          (Math.random() - 0.5) * intensity * damp,
          (Math.random() - 0.5) * intensity * damp,
          (Math.random() - 0.5) * intensity * damp
        );
        requestAnimationFrame(shakeStep);
      } else {
        this.cameraShakeIntensity = 0;
        this.cameraShakeOffset.set(0, 0, 0);
      }
    };

    requestAnimationFrame(shakeStep);
  }

  // Trigger high-intensity impact contact flash light
  triggerImpactFlash(impactPos, isCritical = false) {
    if (!this.impactFlashLight) {
      this.impactFlashLight = new THREE.PointLight(isCritical ? 0xef4444 : 0x38bdf8, 0, 8, 2);
      this.scene.add(this.impactFlashLight);
    }

    if (impactPos) this.impactFlashLight.position.copy(impactPos);
    this.impactFlashLight.color.setHex(isCritical ? 0xff3b30 : 0x00f0ff);
    this.impactFlashLight.intensity = isCritical ? 8.0 : 5.5;

    const startTime = performance.now();
    const duration = 140; // ms

    const flashStep = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      this.impactFlashLight.intensity = (isCritical ? 8.0 : 5.5) * (1.0 - t);
      if (t < 1.0) requestAnimationFrame(flashStep);
      else this.impactFlashLight.intensity = 0;
    };

    requestAnimationFrame(flashStep);
  }

  // Upgraded dual concentric expanding blast waves & ground ripple
  triggerImpactShockwave(impactPos, isCritical = false) {
    if (!this.impactShockRing) return;

    const ringColor = isCritical ? 0xef4444 : 0x06b6d4;
    const ringColorOuter = isCritical ? 0xff7733 : 0x38bdf8;

    if (impactPos) {
      this.impactShockRing.position.x = impactPos.x;
      this.impactShockRing.position.z = impactPos.z;
      if (this.impactShockRingOuter) {
        this.impactShockRingOuter.position.x = impactPos.x;
        this.impactShockRingOuter.position.z = impactPos.z;
      }
    }

    this.impactShockRing.scale.set(1, 1, 1);
    this.impactShockRing.material.color.setHex(ringColor);
    this.impactShockRing.material.opacity = 1.0;

    if (this.impactShockRingOuter) {
      this.impactShockRingOuter.scale.set(1, 1, 1);
      this.impactShockRingOuter.material.color.setHex(ringColorOuter);
      this.impactShockRingOuter.material.opacity = 0.9;
    }

    const startTime = performance.now();
    const duration = 650; // ms

    const animateRings = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // Fast expansion deceleration
      const ease = 1 - Math.pow(1 - t, 3);
      const s = 1.0 + ease * 34.0;
      const sOuter = 1.0 + ease * 52.0;

      this.impactShockRing.scale.set(s, s, s);
      this.impactShockRing.material.opacity = 1.0 * (1.0 - ease);

      if (this.impactShockRingOuter) {
        this.impactShockRingOuter.scale.set(sOuter, sOuter, sOuter);
        this.impactShockRingOuter.material.opacity = 0.9 * (1.0 - ease);
      }

      if (t < 1.0) {
        requestAnimationFrame(animateRings);
      } else {
        this.impactShockRing.material.opacity = 0;
        if (this.impactShockRingOuter) this.impactShockRingOuter.material.opacity = 0;
      }
    };

    requestAnimationFrame(animateRings);
  }

  // Cinematic Slow-Mo Impact Camera Swoop
  triggerCinematicImpactSwoop(impactPos, durationMs = 1200, onComplete) {
    if (!this.camera || !this.controls) return;

    const savedCamPos = this.camera.position.clone();
    const savedTarget = this.controls.target.clone();

    // Close-up dramatic macro framing on impact corner
    const macroCamPos = new THREE.Vector3(
      impactPos.x + 1.25,
      impactPos.y + 0.45,
      impactPos.z + 1.35
    );
    const macroTarget = new THREE.Vector3(impactPos.x, impactPos.y + 0.1, impactPos.z);

    const swoopDuration = 320;
    const swoopStart = performance.now();

    const animateSwoopIn = (now) => {
      const elapsed = now - swoopStart;
      const t = Math.min(1.0, elapsed / swoopDuration);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(savedCamPos, macroCamPos, ease);
      this.controls.target.lerpVectors(savedTarget, macroTarget, ease);
      this.controls.update();

      if (t < 1.0) {
        requestAnimationFrame(animateSwoopIn);
      } else {
        // Hold macro view during collision, then smoothly return
        setTimeout(() => {
          const returnStart = performance.now();
          const returnDuration = 450;
          const animateReturn = (rNow) => {
            const rElapsed = rNow - returnStart;
            const rt = Math.min(1.0, rElapsed / returnDuration);
            const rEase = 1 - Math.pow(1 - rt, 3);

            this.camera.position.lerpVectors(macroCamPos, savedCamPos, rEase);
            this.controls.target.lerpVectors(macroTarget, savedTarget, rEase);
            this.controls.update();

            if (rt < 1.0) {
              requestAnimationFrame(animateReturn);
            } else if (onComplete) {
              onComplete();
            }
          };
          requestAnimationFrame(animateReturn);
        }, Math.max(300, durationMs - 770));
      }
    };

    requestAnimationFrame(animateSwoopIn);
  }

  setCameraPreset(preset) {
    if (!this.camera) return;

    const presets = {
      isometric: { pos: [3.8, 2.8, 3.8], target: [0, 0, 0] },
      front: { pos: [0, 0.2, 4.8], target: [0, 0, 0] },
      top: { pos: [0, 5.2, 0.01], target: [0, 0, 0] },
      side: { pos: [4.8, 0.2, 0], target: [0, 0, 0] },
      dropView: { pos: [3.2, 1.2, 3.2], target: [0, -0.2, 0] }
    };

    const targetConfig = presets[preset] || presets.isometric;
    this.animateCameraTo(targetConfig.pos, targetConfig.target);
  }

  animateCameraTo(pos, target) {
    if (!this.controls) {
      this.camera.position.set(...pos);
      return;
    }

    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(...pos);
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(...target);

    const startTime = performance.now();
    const duration = 650; // ms

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (t < 1.0) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  // Draw 3D dimension calipers and measurements
  updateDimensions(dims, scale) {
    // Clear previous
    while (this.dimensionGroup.children.length > 0) {
      const obj = this.dimensionGroup.children[0];
      this.dimensionGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    if (!dims) return;

    const L = dims.length * scale;
    const W = dims.width * scale;
    const H = dims.height * scale;

    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.05,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.65
    });

    // Outer Bounding Box Lines
    const boxGeo = new THREE.BoxGeometry(L, H, W);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lines = new THREE.LineSegments(edges, lineMat);
    lines.computeLineDistances();
    this.dimensionGroup.add(lines);
  }

  toggleDimensions(visible) {
    this.dimensionGroup.visible = visible;
  }

  toggleGrid(visible) {
    this.gridHelper.visible = visible;
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    requestAnimationFrame(() => this.render());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      if (this.cameraShakeIntensity > 0) {
        this.camera.position.add(this.cameraShakeOffset);
        this.renderer.render(this.scene, this.camera);
        this.camera.position.sub(this.cameraShakeOffset);
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}
