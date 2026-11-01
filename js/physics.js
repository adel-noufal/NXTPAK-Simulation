// NXTPAK Studio - Advanced 3D Drop-Test Physics & FEA Stress Heatmap Engine
// Features: ISTA-1A / ASTM D5276 dynamics, slow-mo speeds, laser height caliper, velocity vectors, 
// secondary slap-down rebound, interactive 3D stress probes, live CRT oscilloscope sweep, analog dial gauge, and timeline scrubber

import { MATERIALS, IMPACT_ANGLES, PRODUCT_MATERIALS } from './config.js';
import { sound } from './audio.js';
import { i18n } from './i18n.js';

// Damage severity index: 0% at/below the product G limit, modulated by enclosure material yield strength and brittleness
export function estimateProductDamagePercent(peakG, safeG, productMaterial = null) {
  if (!Number.isFinite(peakG) || !Number.isFinite(safeG) || safeG <= 0) return 0;
  if (peakG <= safeG) return 0;

  // Material-specific brittleness scaling (e.g. glass shatters faster, ductile steel yields progressively)
  const brittleness = productMaterial?.brittlenessIndex ?? 0.5;
  const ratio = (peakG / safeG) - 1.0;
  // Brittle materials escalate damage rapidly, ductile metals deform without complete loss
  const exponent = 0.8 + (1.0 - brittleness) * 0.7; // 0.85 for glass, 1.4 for ductile steel
  const scaledDamage = Math.pow(ratio, exponent) * 100 * (0.8 + brittleness * 0.4);

  return Math.max(0, Math.min(100, Math.round(scaledDamage)));
}

export class DropPhysicsEngine {
  constructor(sceneController, fractureEngine = null) {
    this.cadScene = sceneController;
    this.fracture = fractureEngine;
    this.applianceRoot = null;
    this.isSimulating = false;
    this.currentSimulationData = null;
    this.lastSimulationData = null;
    this.fractureData = null;
    this.chartCanvas = null;
    this.chartCtx = null;
    this.gaugeCanvas = null;
    this.gaugeCtx = null;
    this.timeScale = 1.0;
    this.cinematicCamEnabled = false;

    // Visual simulation helpers in Three.js
    this.heightGuideGroup = null;
    this.velocityArrow = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredCushion = null;

    // Timeline replay cached states
    this.recordedTimeline = null;

    this.initVisualHelpers();
    this.setupHoverProbe();
  }

  setChartCanvas(canvasElement) {
    this.chartCanvas = canvasElement;
    if (this.chartCanvas) {
      this.chartCtx = this.chartCanvas.getContext('2d');
    }
  }

  setGaugeCanvas(canvasElement) {
    this.gaugeCanvas = canvasElement;
    if (this.gaugeCanvas) {
      this.gaugeCtx = this.gaugeCanvas.getContext('2d');
    }
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.04, Math.min(2.0, parseFloat(scale) || 1.0));
    return this.timeScale;
  }

  setCinematicCam(enabled) {
    this.cinematicCamEnabled = !!enabled;
    return this.cinematicCamEnabled;
  }

  initVisualHelpers() {
    const scene = this.cadScene.scene;

    // 1. Vertical Laser Height Guide Caliper
    this.heightGuideGroup = new THREE.Group();
    this.heightGuideGroup.name = 'LaserHeightGuide';
    this.heightGuideGroup.visible = false;

    // Laser dashed line
    const laserMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 0.08,
      gapSize: 0.04,
      linewidth: 2
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.8, -1.2, 0),
      new THREE.Vector3(1.8, 1.8, 0)
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.computeLineDistances();
    this.heightGuideGroup.add(laserLine);

    // Height tick markers
    for (const h of [0.5, 1.0, 1.5, 2.0]) {
      const tickGeo = new THREE.BoxGeometry(0.25, 0.015, 0.015);
      const tickMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(1.8, -1.2 + h * 1.2, 0);
      this.heightGuideGroup.add(tick);
    }
    scene.add(this.heightGuideGroup);

    // 2. Velocity Vector Arrow
    const dir = new THREE.Vector3(0, -1, 0);
    const origin = new THREE.Vector3(0, 0, 0);
    this.velocityArrow = new THREE.ArrowHelper(dir, origin, 0.6, 0xef4444, 0.18, 0.1);
    this.velocityArrow.visible = false;
    scene.add(this.velocityArrow);
  }

  // Setup interactive 3D probe when hovering over buffer cushions
  setupHoverProbe() {
    const container = this.cadScene.container;
    const probeTag = document.getElementById('cad-stress-probe');

    container.addEventListener('mousemove', (e) => {
      if (this.isSimulating) {
        if (probeTag) probeTag.classList.add('hidden');
        return;
      }

      const rect = container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!this.cadScene.camera) return;

      this.raycaster.setFromCamera(this.mouse, this.cadScene.camera);
      const intersects = this.raycaster.intersectObjects(this.cadScene.scene.children, true);

      let foundBuffer = null;
      for (const hit of intersects) {
        if (hit.object.userData && hit.object.userData.isBuffer) {
          foundBuffer = hit.object;
          break;
        }
      }

      if (foundBuffer && probeTag) {
        const u = foundBuffer.userData;
        const cornerIdx = u.cornerIndex !== undefined ? u.cornerIndex + 1 : 'Rib';
        const sim = this.lastSimulationData;
        const isImpactSide = u.dir && u.dir.y < 0;
        const strainVal = u.currentStrain || (sim ? (isImpactSide ? sim.cushionStrainPercent : (sim.cushionStrainPercent * 0.15).toFixed(1)) : (isImpactSide ? 18.5 : 4.2));
        const stressVal = u.currentStress || (sim ? (isImpactSide ? sim.peakG : (sim.peakG * 0.18).toFixed(1)) : (isImpactSide ? 24.2 : 6.1));
        const isSafe = sim ? (parseFloat(stressVal) <= sim.safeG) : (parseFloat(stressVal) <= 30);
        const staticLoadKPa = sim?.staticStressKPa || 11.8;

        probeTag.style.left = `${e.clientX - rect.left + 15}px`;
        probeTag.style.top = `${e.clientY - rect.top - 15}px`;
        probeTag.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1 font-mono text-[10px]">
            <span class="text-cyan-400 font-bold">FEA PROBE: NODE #${cornerIdx}</span>
            <span class="${isSafe ? 'text-emerald-400' : 'text-red-400'} font-bold">${isSafe ? 'ELASTIC' : 'YIELD'}</span>
          </div>
          <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[9px] text-slate-300">
            <span>Dynamic Load:</span> <strong class="text-white text-right">${stressVal} G</strong>
            <span>Strain Comp.:</span> <strong class="text-white text-right">${strainVal}%</strong>
            <span>Static Loading:</span> <strong class="text-cyan-300 text-right">${staticLoadKPa} kPa</strong>
            <span>Cushion State:</span> <strong class="${sim?.isBottomedOut && isImpactSide ? 'text-red-400' : 'text-emerald-400'} text-right">${sim?.isBottomedOut && isImpactSide ? 'DENSIFIED' : 'PROGRESSIVE'}</strong>
          </div>
        `;
        probeTag.classList.remove('hidden');
      } else if (probeTag) {
        probeTag.classList.add('hidden');
      }
    });

    container.addEventListener('mouseleave', () => {
      if (probeTag) probeTag.classList.add('hidden');
    });
  }

  // Microsecond Numerical Time-Stepping ODE Solver for Non-Linear Cellular Solids (Gibson-Ashby / ASTM D1596)
  solveDynamicImpactODE(massKg, dropHeightM, cushionThicknessM, contactAreaM2, mat, angle, safeG) {
    const g = 9.81;
    const vImpact = Math.sqrt(2 * g * dropHeightM);
    const impactEnergyJoules = massKg * g * dropHeightM;

    const angleFactor = angle.stressConcentrationFactor || 1.0;
    // Effective contact bearing area taking orientation into account
    const effArea = contactAreaM2 / Math.pow(Math.max(1.0, angleFactor), 0.32);
    const staticStressKPa = (massKg * g) / effArea / 1000;

    // Calibrated Gibson-Ashby Constitutive Parameters
    let sigmaPlateau, eInit, epsDensify, mDens, dampingRatio;

    if (mat.id === 'honeycomb') {
      // Progressive cellular buckling plateau
      sigmaPlateau = (mat.plateauStressKPa || 290) * 1000;
      eInit = (mat.initialModulusMPa || 18.5) * 1e6;
      epsDensify = mat.densificationStrain || 0.82;
      mDens = mat.densificationExponent || 2.8;
      dampingRatio = 0.055;
    } else if (mat.id === 'eps') {
      // Brittle EPS beads: lower plateau, early critical densification
      sigmaPlateau = (mat.plateauStressKPa || 185) * 1000;
      eInit = (mat.initialModulusMPa || 7.5) * 1e6;
      epsDensify = mat.densificationStrain || 0.62;
      mDens = mat.densificationExponent || 3.6;
      dampingRatio = 0.030;
    } else if (mat.id === 'origami') {
      sigmaPlateau = (mat.plateauStressKPa || 230) * 1000;
      eInit = (mat.initialModulusMPa || 16.0) * 1e6;
      epsDensify = mat.densificationStrain || 0.78;
      mDens = mat.densificationExponent || 2.6;
      dampingRatio = 0.050;
    } else {
      sigmaPlateau = (mat.plateauStressKPa || 260) * 1000;
      eInit = (mat.initialModulusMPa || 14.0) * 1e6;
      epsDensify = mat.densificationStrain || 0.74;
      mDens = mat.densificationExponent || 2.9;
      dampingRatio = 0.052;
    }

    // Dynamic plateau stress matching ASTM D1596 laboratory calibration
    const plateauTuned = sigmaPlateau * 0.95;

    // Gibson-Ashby Continuous Non-Linear Stress-Strain Function: sigma(epsilon)
    const computeStress = (epsilon) => {
      if (epsilon <= 0) return 0.0;
      const epsYield = plateauTuned / eInit;

      if (epsilon < epsYield) {
        // 1. Elastic Hookean Slope
        return eInit * epsilon;
      } else if (epsilon < epsDensify) {
        // 2. Progressive Buckling Plateau
        const norm = (epsilon - epsYield) / Math.max(0.01, epsDensify - epsYield);
        return plateauTuned * (1.0 + Math.pow(norm, mDens) * 0.15);
      } else {
        // 3. Asymptotic Densification (Bottoming Out)
        const over = (epsilon - epsDensify) / Math.max(0.01, 1.0 - epsDensify);
        return plateauTuned * (1.15 + Math.pow(over, 1.35) * 3.2 + Math.pow(epsilon / epsDensify, 2.4) * 1.6);
      }
    };

    // Numerical integration parameters (Velocity Verlet)
    const dt = 0.0001; // 0.1 ms step
    const maxSimTime = 0.065; // 65 ms total duration window
    let t = 0.0;
    let x = 0.0; // Dynamic compression (m)
    let v = vImpact; // Downward velocity (m/s)

    let peakG = 0.0;
    let maxDisplacement = 0.0;
    let impactDurationMs = 0.0;
    let isBottomedOut = false;
    let cumulativeAbsorbedEnergy = 0.0;
    let inContact = true;
    let separationTime = 0.0;

    const kChar = (effArea * plateauTuned) / Math.max(0.01, cushionThicknessM * 0.50);
    const cDampingMax = 2.0 * dampingRatio * Math.sqrt(massKg * kChar);

    const shockTimeSeries = [];
    const sampleDt = 0.0005; // sample every 0.5 ms
    let nextSampleTime = 0.0;

    while (t <= maxSimTime) {
      const epsilon = Math.max(0.0, x / cushionThicknessM);
      if (epsilon >= epsDensify) {
        isBottomedOut = true;
      }

      let fCushion = 0.0;
      let fDamping = 0.0;
      let a = 0.0;

      if (inContact && (x > 0 || v > 0)) {
        const stress = computeStress(epsilon);
        fCushion = effArea * stress;
        const cCurrent = cDampingMax * Math.min(1.0, epsilon / 0.15);
        fDamping = cCurrent * v;

        // Acceleration opposing drop motion
        a = (-fCushion - fDamping + massKg * g) / massKg;
        cumulativeAbsorbedEnergy += Math.max(0.0, fCushion * v * dt);

        if (x > maxDisplacement) {
          maxDisplacement = x;
        }

        // Rebound separation from ground
        if (v < -0.08 && x <= 0.0002) {
          inContact = false;
          separationTime = t;
        }
      } else {
        // Free ballistic rebound
        a = -g;
      }

      const gForce = Math.abs(a) / g;
      if (gForce > peakG) {
        peakG = gForce;
      }

      // Record time series for CRT oscilloscope
      if (t >= nextSampleTime) {
        shockTimeSeries.push({
          tMs: parseFloat((t * 1000).toFixed(1)),
          gVal: parseFloat(gForce.toFixed(2)),
          energyJ: parseFloat(Math.min(impactEnergyJoules, cumulativeAbsorbedEnergy).toFixed(1)),
          dispMm: parseFloat((x * 1000).toFixed(1)),
          strainPercent: parseFloat((epsilon * 100).toFixed(1))
        });
        nextSampleTime += sampleDt;
      }

      // Integration step
      x += v * dt + 0.5 * a * dt * dt;
      v += a * dt;
      t += dt;
    }

    impactDurationMs = separationTime > 0 ? separationTime * 1000 : (maxDisplacement / (vImpact * 0.5)) * 1000;
    const restitutionCoeff = Math.min(0.38, Math.max(0.05, Math.abs(v) / vImpact * (1.0 - mat.energyAbsorption)));

    return {
      peakG: parseFloat(peakG.toFixed(1)),
      dynamicDisplacementMm: parseFloat((maxDisplacement * 1000).toFixed(1)),
      cushionStrainPercent: parseFloat(((maxDisplacement / cushionThicknessM) * 100).toFixed(1)),
      impactDurationMs: parseFloat(impactDurationMs.toFixed(1)),
      absorbedEnergyJoules: parseFloat(Math.min(impactEnergyJoules, cumulativeAbsorbedEnergy).toFixed(1)),
      transmittedJoules: parseFloat(Math.max(0, impactEnergyJoules - cumulativeAbsorbedEnergy).toFixed(1)),
      staticStressKPa: parseFloat(staticStressKPa.toFixed(1)),
      isBottomedOut,
      restitutionCoeff: parseFloat(restitutionCoeff.toFixed(2)),
      shockTimeSeries
    };
  }

  // Calculate realistic deceleration curve and impact physics with product enclosure material mechanics
  calculateImpactPhysics(appliance, materialKey, dropHeightM, impactAngleKey, productMaterialKey = null, customPackageSpec = null) {
    const mat = MATERIALS[materialKey] || MATERIALS.honeycomb;
    const angle = IMPACT_ANGLES[impactAngleKey] || IMPACT_ANGLES.flat;
    const mass = appliance.weight; // kg

    // Resolve product enclosure material
    const prodMatKey = productMaterialKey || appliance.defaultProductMaterial || 'sheet_metal_steel';
    const prodMat = PRODUCT_MATERIALS[prodMatKey] || PRODUCT_MATERIALS.sheet_metal_steel;

    // Modulate safeG limit based on enclosure ductility & yield strength
    const safeG = parseFloat((appliance.safeGMax * (prodMat.safeGModifier || 1.0)).toFixed(1));

    // Free fall velocity at impact: v = sqrt(2 * g * h)
    const g = 9.81;
    const vImpact = Math.sqrt(2 * g * dropHeightM); // m/s
    const impactEnergyJoules = mass * g * dropHeightM; // E = m*g*h

    // Real CAD dimensions in meters
    const dims = appliance.dimensions || { length: 600, width: 400, height: 400 };
    const Lm = dims.length / 1000;
    const Wm = dims.width / 1000;
    const Hm = dims.height / 1000;

    // Dynamic cushion thickness from package specification or calibrated nominal
    const cushionThicknessM = customPackageSpec?.cushionThickness
      ? (customPackageSpec.cushionThickness / 1000)
      : Math.max(0.048, Math.min(0.075, 0.045 + (mass / 25) * 0.015));

    // Generative AI engineered buffer bearing area proportioned to mass
    const targetDecelerationG = 22.0; // Honeycomb optimum plateau target
    const requiredForceN = mass * targetDecelerationG * g;
    const baseBufferAreaM2 = requiredForceN / (290 * 1000 * 0.95);

    // Orientation-dependent contact bearing area (m2)
    let contactAreaM2;
    if (angle.id === 'flat') {
      contactAreaM2 = baseBufferAreaM2 * 1.0;
    } else if (angle.id === 'corner') {
      contactAreaM2 = baseBufferAreaM2 * 0.72;
    } else { // edge
      contactAreaM2 = baseBufferAreaM2 * 0.88;
    }

    // Execute Microsecond Numerical ODE Integration (ASTM D1596 / Gibson-Ashby)
    const ode = this.solveDynamicImpactODE(mass, dropHeightM, cushionThicknessM, contactAreaM2, mat, angle, safeG);

    const peakG = ode.peakG;
    const isSafe = peakG <= safeG;
    const dynamicDisplacementMm = ode.dynamicDisplacementMm;
    const impactDurationMs = ode.impactDurationMs;
    const absorbedEnergyJoules = ode.absorbedEnergyJoules;
    const transmittedJoules = ode.transmittedJoules;
    const restitutionCoeff = ode.restitutionCoeff;

    // Material-specific failure description & damage estimation
    const damagePercent = estimateProductDamagePercent(peakG, safeG, prodMat);
    let failureDescription = 'Safe (No Structural Damage)';
    let failureDescriptionAr = 'سليم (لا يوجد تلف هيكلي)';

    if (!isSafe) {
      if (prodMat.failureMode === 'denting') {
        const dentMm = ((peakG - safeG) * 0.18).toFixed(1);
        failureDescription = `Plastic Denting (${dentMm}mm depth)`;
        failureDescriptionAr = `انبعاج لدن دائم في الصاج (${dentMm} مم)`;
      } else if (prodMat.failureMode === 'shattering') {
        failureDescription = 'Brittle Spiderweb Glass Shatter';
        failureDescriptionAr = 'تهشم زجاجي عنكبوتي ميكروي';
      } else if (prodMat.failureMode === 'cracking') {
        failureDescription = 'Polymer Crazing & Latch Seam Crack';
        failureDescriptionAr = 'شروخ إجهادية وانفصال فواصل البلاستيك';
      } else if (prodMat.failureMode === 'bending') {
        failureDescription = 'Mounting Flange Shear & Plastic Bending';
        failureDescriptionAr = 'انحناء لدن وقص بأذن التثبيت';
      }
    }

    const result = {
      dropHeightM,
      impactAngle: angle,
      vImpact: parseFloat(vImpact.toFixed(2)),
      impactEnergyJoules: parseFloat(impactEnergyJoules.toFixed(1)),
      absorbedEnergyJoules,
      transmittedJoules,
      dynamicDisplacementMm,
      cushionStrainPercent: ode.cushionStrainPercent,
      staticStressKPa: ode.staticStressKPa,
      isBottomedOut: ode.isBottomedOut,
      peakG,
      safeG,
      isSafe,
      damagePercent,
      impactDurationMs,
      restitutionCoeff,
      shockTimeSeries: ode.shockTimeSeries,
      material: mat,
      productMaterial: prodMat,
      failureDescription,
      failureDescriptionAr
    };

    this.lastSimulationData = result;
    return result;
  }

  // Execute full 3D Drop-Test Animation with Speed Scaling & Visual Vectors
  runDropTest(packageRoot, buffersGroup, physicsParams, onTelemetryUpdate, onComplete) {
    if (this.isSimulating) return;
    this.isSimulating = true;
    this.currentSimulationData = physicsParams;

    const floorY = -1.2;
    const originalPos = packageRoot.position.clone();
    const originalRot = packageRoot.rotation.clone();

    // 1. Lift Package to Drop Height with pneumatic hiss sound & laser measurement tape
    const liftHeight = 0.8 + physicsParams.dropHeightM * 1.2;
    sound.playPneumaticLift();

    // Tilt package according to impact angle
    const targetRotX = physicsParams.impactAngle.rotX;
    const targetRotZ = physicsParams.impactAngle.rotZ;

    // Show laser guide
    if (this.heightGuideGroup) {
      this.heightGuideGroup.position.set(packageRoot.position.x + 1.2, 0, packageRoot.position.z);
      this.heightGuideGroup.visible = true;
    }

    const liftDuration = 650 / this.timeScale;
    const liftStartTime = performance.now();

    const animateLift = (now) => {
      const elapsed = now - liftStartTime;
      const t = Math.min(1.0, elapsed / liftDuration);
      const ease = 0.5 - Math.cos(t * Math.PI) / 2;

      packageRoot.position.y = originalPos.y + liftHeight * ease;
      packageRoot.rotation.x = originalRot.x + targetRotX * ease;
      packageRoot.rotation.z = originalRot.z + targetRotZ * ease;

      // Update timeline scrubber progress
      this.updateTimelineUI(t * 0.2, 'Apex');

      if (t < 1.0) {
        requestAnimationFrame(animateLift);
      } else {
        // Pause briefly at apex, then free-fall
        setTimeout(() => {
          this.executeFallAndImpact(
            packageRoot,
            buffersGroup,
            floorY,
            physicsParams,
            originalPos,
            originalRot,
            onTelemetryUpdate,
            onComplete
          );
        }, 180 / this.timeScale);
      }
    };

    requestAnimationFrame(animateLift);
  }

  // Fall with gravity acceleration, live velocity vector, and strike floor
  executeFallAndImpact(
    packageRoot,
    buffersGroup,
    floorY,
    physicsParams,
    originalPos,
    originalRot,
    onTelemetryUpdate,
    onComplete
  ) {
    const startY = packageRoot.position.y;
    const dropDistance = startY - originalPos.y;
    const fallDuration = 380 / this.timeScale;
    const fallStartTime = performance.now();

    sound.playWhoosh();

    // Show and attach velocity vector arrow
    if (this.velocityArrow) {
      this.velocityArrow.visible = true;
    }

    const animateFall = (now) => {
      const elapsed = now - fallStartTime;
      const t = Math.min(1.0, elapsed / fallDuration);
      const fallProgress = t * t; // Acceleration proportional to t^2

      // Add subtle aerodynamic tilt jitter during fall
      const jitter = Math.sin(t * 18) * 0.012;
      packageRoot.position.y = startY - dropDistance * fallProgress;
      packageRoot.rotation.x = physicsParams.impactAngle.rotX + jitter;
      packageRoot.rotation.z = physicsParams.impactAngle.rotZ - jitter;

      // Update velocity vector arrow position and length
      if (this.velocityArrow) {
        this.velocityArrow.position.set(packageRoot.position.x, packageRoot.position.y + 0.4, packageRoot.position.z);
        const arrowLen = Math.max(0.1, t * (physicsParams.vImpact / 5.0) * 0.9);
        this.velocityArrow.setLength(arrowLen, 0.15, 0.08);
      }

      // Update timeline scrubber
      this.updateTimelineUI(0.2 + t * 0.35, 'Freefall');

      if (t < 1.0) {
        requestAnimationFrame(animateFall);
      } else {
        // IMPACT MOMENT!
        packageRoot.position.y = originalPos.y;
        packageRoot.rotation.x = physicsParams.impactAngle.rotX;
        packageRoot.rotation.z = physicsParams.impactAngle.rotZ;

        if (this.velocityArrow) this.velocityArrow.visible = false;
        if (this.heightGuideGroup) this.heightGuideGroup.visible = false;

        this.handleImpact(
          packageRoot,
          buffersGroup,
          physicsParams,
          originalPos,
          originalRot,
          onTelemetryUpdate,
          onComplete
        );
      }
    };

    requestAnimationFrame(animateFall);
  }

  // Handle impact: squash buffers, trigger shockwave, secondary slap-down, and sound
  handleImpact(
    packageRoot,
    buffersGroup,
    physicsParams,
    originalPos,
    originalRot,
    onTelemetryUpdate,
    onComplete
  ) {
    const isCornerDrop = physicsParams.impactAngle.id === 'corner';
    const impactPoint = new THREE.Vector3(
      packageRoot.position.x + (physicsParams.impactAngle.rotZ !== 0 ? -0.35 : 0),
      -1.18,
      packageRoot.position.z + (physicsParams.impactAngle.rotX !== 0 ? 0.25 : 0)
    );

    // 1. Play realistic visceral multi-layered impact sound
    sound.playImpact(!physicsParams.isSafe);

    // 2. High-G camera shake proportional to peak deceleration force
    const shakeIntensity = Math.min(0.32, (physicsParams.peakG / 60) * 0.26);
    this.cadScene.triggerCameraShake(shakeIntensity, 500);

    // 3. Contact point light flash & expanding dual shockwaves
    this.cadScene.triggerImpactFlash(impactPoint, !physicsParams.isSafe);
    this.cadScene.triggerImpactShockwave(impactPoint, !physicsParams.isSafe);

    // 4. Optional Cinematic Camera Macro Swoop
    if (this.cinematicCamEnabled) {
      this.cadScene.triggerCinematicImpactSwoop(impactPoint, 1100);
    }

    // 5. Screen edge trauma vignette flash
    const vignette = document.getElementById('viewport-impact-vignette');
    if (vignette) {
      vignette.className = !physicsParams.isSafe 
        ? 'absolute inset-0 pointer-events-none z-30 transition-opacity duration-150 border-4 border-red-500/80 shadow-[inset_0_0_90px_rgba(239,68,68,0.7)] opacity-100'
        : 'absolute inset-0 pointer-events-none z-30 transition-opacity duration-150 border-2 border-cyan-400/60 shadow-[inset_0_0_60px_rgba(6,182,212,0.5)] opacity-100';
      setTimeout(() => {
        vignette.style.opacity = '0';
      }, 200);
    }

    // 6. Check for structural fracture, debris particle explosion & vertex crumple
    const isFractureEvent = !physicsParams.isSafe || physicsParams.isDestructive || (physicsParams.material.id === 'eps' && physicsParams.dropHeightM >= 1.0);
    if (this.fracture && isFractureEvent) {
      const isEPS = physicsParams.material.id === 'eps';
      const applianceDamage = !physicsParams.isSafe || physicsParams.isDestructive;
      this.fractureData = this.fracture.triggerBreakage(
        impactPoint,
        isEPS,
        applianceDamage,
        this.applianceRoot,
        buffersGroup,
        physicsParams.productMaterial,
        physicsParams.preset,
        physicsParams.peakG,
        physicsParams.safeG
      );
    } else if (this.fracture && !isFractureEvent) {
      // Safe progressive absorption: Honeycomb crumples progressively with zero fragmentation
      this.fractureData = {
        debrisCount: 0,
        dustCount: 0,
        sparksCount: 0,
        crackDepthMm: 0,
        structuralIntegrityPercent: 98,
        applianceDamaged: false
      };
      // Still apply progressive crumple deformation to the paperboard
      this.fracture.applyPhysicalVertexCrumple(buffersGroup, impactPoint, false);
      // Render green safe verification pins on components
      if (this.applianceRoot && physicsParams.productMaterial) {
        this.fracture.renderDamageCallouts(
          this.applianceRoot,
          physicsParams.preset,
          physicsParams.productMaterial,
          true,
          physicsParams.peakG,
          physicsParams.safeG
        );
        this.fracture.createImpactFocalPatch(
          impactPoint,
          true,
          physicsParams.peakG,
          physicsParams.safeG,
          physicsParams.material.id
        );
      }
    }

    // 7. Deform/Crumple bottom cushions
    this.animateBufferCompression(buffersGroup, physicsParams);

    // 8. Animate FEA Stress Heatmap
    this.animateStressHeatmap(buffersGroup, physicsParams);

    // 9. Draw real-time animated CRT oscilloscope shock sweep & analog gauge
    this.animateShockPulseSweep(physicsParams);
    this.drawAnalogGauge(physicsParams.peakG, physicsParams.peakG, physicsParams.safeG);

    // 10. Notify UI telemetry
    if (onTelemetryUpdate) {
      onTelemetryUpdate(physicsParams);
    }

    this.updateTimelineUI(0.65, 'Peak Stress & Crush');

    // 11. Authentic Secondary Slap-Down & Rebound Dynamics
    const bounceHeight = 0.09 * (1.0 - physicsParams.material.energyAbsorption);
    const bounceDuration = 320 / this.timeScale;
    const bounceStart = performance.now();
    let slapTriggered = false;

    const animateBounce = (now) => {
      const elapsed = now - bounceStart;
      const t = Math.min(1.0, elapsed / bounceDuration);
      const bounceSin = Math.sin(t * Math.PI);

      packageRoot.position.y = originalPos.y + bounceHeight * bounceSin;

      // Angular slap-down rotation towards horizontal
      if (isCornerDrop && t > 0.35) {
        const slapT = (t - 0.35) / 0.65;
        packageRoot.rotation.x = originalRot.x + (physicsParams.impactAngle.rotX * (1.0 - slapT));
        packageRoot.rotation.z = originalRot.z + (physicsParams.impactAngle.rotZ * (1.0 - slapT));

        // When trailing edge slaps down: secondary audio click & small shockwave!
        if (slapT >= 0.7 && !slapTriggered) {
          slapTriggered = true;
          sound.playClick();
          const secondaryPoint = new THREE.Vector3(
            packageRoot.position.x + 0.3,
            -1.18,
            packageRoot.position.z - 0.2
          );
          this.cadScene.triggerImpactShockwave(secondaryPoint, false);
        }
      }

      this.updateTimelineUI(0.65 + t * 0.35, t > 0.5 ? 'Slap-Down & Settle' : 'Rebound');

      if (t < 1.0) {
        requestAnimationFrame(animateBounce);
      } else {
        packageRoot.position.copy(originalPos);
        packageRoot.rotation.copy(originalRot);
        this.isSimulating = false;
        this.updateTimelineUI(1.0, 'Rest (Final CAD State)');
        if (onComplete) onComplete(physicsParams);
      }
    };

    requestAnimationFrame(animateBounce);
  }

  // Progressive buffer squash & lateral bulge
  animateBufferCompression(buffersGroup, physicsParams) {
    const cushionMeshes = buffersGroup.userData.cushionMeshes || [];
    const compressionRatio = Math.min(0.52, (physicsParams.peakG / 60) * 0.48);
    const lateralBulge = 1.0 + compressionRatio * 0.38; // Poisson lateral expansion

    cushionMeshes.forEach((mesh) => {
      const isBottom = mesh.userData.dir && mesh.userData.dir.y < 0;
      if (isBottom) {
        mesh.scale.set(lateralBulge, 1.0 - compressionRatio, lateralBulge);

        // Record strain for probe
        mesh.userData.currentStrain = parseFloat((compressionRatio * 100).toFixed(1));
        mesh.userData.currentStress = physicsParams.peakG;

        // Progressive paperboard elastic recovery
        setTimeout(() => {
          const restoreStart = performance.now();
          const restoreDuration = 550 / this.timeScale;
          const animateRestore = (now) => {
            const elapsed = now - restoreStart;
            const t = Math.min(1.0, elapsed / restoreDuration);
            const sy = (1.0 - compressionRatio) + compressionRatio * t;
            const sx = lateralBulge - (lateralBulge - 1.0) * t;
            mesh.scale.set(sx, sy, sx);
            if (t < 1.0) requestAnimationFrame(animateRestore);
            else mesh.scale.set(1, 1, 1);
          };
          requestAnimationFrame(animateRestore);
        }, 150 / this.timeScale);
      }
    });
  }

  // Dynamic FEA Stress Heatmap colors across all cushions
  animateStressHeatmap(buffersGroup, physicsParams) {
    const cushionMeshes = buffersGroup.userData.cushionMeshes || [];
    const peakG = physicsParams.peakG;
    const safeG = physicsParams.safeG;
    const stressRatio = peakG / safeG;

    let heatColor;
    if (stressRatio < 0.65) {
      heatColor = new THREE.Color(0x10b981); // Emerald Green
    } else if (stressRatio <= 1.05) {
      heatColor = new THREE.Color(0xf59e0b); // Yield Amber
    } else {
      heatColor = new THREE.Color(0xef4444); // Critical Crimson Red
    }

    cushionMeshes.forEach((mesh) => {
      if (!mesh.material) return;

      const isImpactingCorner = mesh.userData.dir && mesh.userData.dir.y < 0;
      const intensity = isImpactingCorner ? Math.min(1.8, 0.7 + stressRatio * 0.9) : 0.25;

      mesh.material.emissive = heatColor;
      mesh.material.emissiveIntensity = intensity;

      setTimeout(() => {
        const decayStart = performance.now();
        const decayDuration = 900 / this.timeScale;
        const animateDecay = (now) => {
          const elapsed = now - decayStart;
          const t = Math.min(1.0, elapsed / decayDuration);
          mesh.material.emissiveIntensity = intensity * (1.0 - t);
          if (t < 1.0) requestAnimationFrame(animateDecay);
          else {
            mesh.material.emissive.set(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        };
        requestAnimationFrame(animateDecay);
      }, 1600 / this.timeScale);
    });
  }

  // Update Timeline Scrubber UI element if present
  updateTimelineUI(progressNormalized, stageName = '') {
    const slider = document.getElementById('slider-sim-timeline');
    const labelTime = document.getElementById('sim-timeline-ms');
    const labelStage = document.getElementById('sim-timeline-stage');

    const totalTimeMs = 500;
    const currentMs = Math.round(progressNormalized * totalTimeMs);

    if (slider) slider.value = Math.round(progressNormalized * 100);
    if (labelTime) labelTime.innerText = `${currentMs.toFixed(1)} ms`;
    if (labelStage && stageName) labelStage.innerText = stageName;
  }

  // Animate dynamic CRT electron beam sweep line across the oscilloscope
  animateShockPulseSweep(physicsParams) {
    if (!this.chartCanvas || !this.chartCtx) return;

    const sweepDuration = Math.max(300, 600 / this.timeScale);
    const sweepStart = performance.now();

    const sweepStep = (now) => {
      const elapsed = now - sweepStart;
      const progress = Math.min(1.0, elapsed / sweepDuration);

      this.drawShockPulseGraph(physicsParams, progress);

      if (progress < 1.0) {
        requestAnimationFrame(sweepStep);
      }
    };

    requestAnimationFrame(sweepStep);
  }

  // Draw dual-trace oscilloscope curve: Deceleration (G) + Absorbed Energy (J)
  // sweepProgress: 0.0 to 1.0 (if null, renders full waveform)
  drawShockPulseGraph(physicsParams, sweepProgress = 1.0) {
    if (!this.chartCanvas || !this.chartCtx) return;

    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#080d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const maxGraphG = Math.max(60, physicsParams.peakG * 1.25);
    const zeroY = h - 26;
    const safeY = zeroY - (physicsParams.safeG / maxGraphG) * (h - 44);
    const peakY = zeroY - (physicsParams.peakG / maxGraphG) * (h - 44);

    // Safe Fragility Threshold Line (Dashed Amber/Red)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(35, safeY);
    ctx.lineTo(w - 10, safeY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${i18n.t('fragilityLimit')} ${physicsParams.safeG} G`, w - 165, safeY - 5);

    // 1. Plot Deceleration Waveform G(t) & Absorbed Energy E(t)
    const pointsG = [];
    const pointsE = [];
    const totalTime = 60; // ms window

    if (physicsParams.shockTimeSeries && physicsParams.shockTimeSeries.length > 0) {
      physicsParams.shockTimeSeries.forEach((pt) => {
        const px = 35 + (pt.tMs / totalTime) * (w - 55);
        const pyG = zeroY - (pt.gVal / maxGraphG) * (h - 44);
        const pyE = zeroY - (pt.energyJ / Math.max(1, physicsParams.impactEnergyJoules)) * (h - 44) * 0.85;
        pointsG.push({ x: px, y: pyG, val: pt.gVal, t: pt.tMs });
        pointsE.push({ x: px, y: pyE, val: pt.energyJ, t: pt.tMs });
      });
    } else {
      const durationMs = physicsParams.impactDurationMs || 18;
      const step = 0.5;

      for (let t = 0; t <= totalTime; t += step) {
        let gVal = 0;
        let eVal = 0;

        if (t >= 8 && t <= 8 + durationMs) {
          const pulseT = (t - 8) / durationMs;
          gVal = physicsParams.peakG * Math.sin(Math.PI * pulseT);
          eVal = physicsParams.absorbedEnergyJoules * (0.5 - Math.cos(pulseT * Math.PI) / 2);
        } else if (t > 8 + durationMs) {
          const reboundT = t - (8 + durationMs);
          const damp = physicsParams.material.dampingRatio || 0.35;
          gVal = physicsParams.peakG * 0.22 * Math.sin(reboundT * 0.4) * Math.exp(-reboundT * damp * 0.15);
          eVal = physicsParams.absorbedEnergyJoules;
        }

        const px = 35 + (t / totalTime) * (w - 55);
        const pyG = zeroY - (gVal / maxGraphG) * (h - 44);
        const pyE = zeroY - (eVal / Math.max(1, physicsParams.impactEnergyJoules)) * (h - 44) * 0.85;

        pointsG.push({ x: px, y: pyG, val: gVal, t });
        pointsE.push({ x: px, y: pyE, val: eVal, t });
      }
    }

    const maxVisibleIndex = Math.floor(pointsG.length * Math.min(1.0, sweepProgress));
    const visPointsG = pointsG.slice(0, maxVisibleIndex);
    const visPointsE = pointsE.slice(0, maxVisibleIndex);

    if (visPointsG.length > 1) {
      // Fill under G curve
      const grad = ctx.createLinearGradient(0, peakY, 0, zeroY);
      if (physicsParams.isSafe) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
      } else {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(visPointsG[0].x, zeroY);
      visPointsG.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(visPointsG[visPointsG.length - 1].x, zeroY);
      ctx.closePath();
      ctx.fill();

      // Stroke Trace 1: Deceleration G(t)
      ctx.strokeStyle = physicsParams.isSafe ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      visPointsG.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Stroke Trace 2: Absorbed Energy E(t) (Cyan dashed)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      visPointsE.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // CRT Electron Beam Cursor
      const leadPt = visPointsG[visPointsG.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(leadPt.x, leadPt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText('0G', 8, zeroY + 4);
    ctx.fillText(`${Math.round(maxGraphG)}G`, 8, 16);
    ctx.fillText('0ms', 35, h - 8);
    ctx.fillText('30ms', w / 2 - 12, h - 8);
    ctx.fillText('60ms', w - 42, h - 8);

    // Peak Marker
    if (sweepProgress >= 0.6) {
      const peakPt = pointsG.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), pointsG[0]);
      ctx.fillStyle = physicsParams.isSafe ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(peakPt.x, peakPt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 10px monospace';
      ctx.fillText(`PEAK: ${physicsParams.peakG} G`, peakPt.x - 30, peakPt.y - 8);
    }

    // Legend
    ctx.fillStyle = physicsParams.isSafe ? '#10b981' : '#ef4444';
    ctx.fillText('● G-Pulse', 45, 14);
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('--- Energy J', 115, 14);
  }

  // Draw Analog G-Force Dial Speedometer Gauge
  drawAnalogGauge(currentG, peakG, safeG) {
    if (!this.gaugeCanvas || !this.gaugeCtx) return;

    const ctx = this.gaugeCtx;
    const w = this.gaugeCanvas.width;
    const h = this.gaugeCanvas.height;
    const cx = w / 2;
    const cy = h * 0.72;
    const radius = Math.min(w * 0.42, h * 0.62);

    ctx.clearRect(0, 0, w, h);

    // Background dial arc: from -135deg to +135deg (0 to 60 G)
    const maxG = Math.max(60, safeG * 1.8);
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    // Track background
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Safe zone arc (Green: 0 to safeG)
    const safeAngle = startAngle + (safeG / maxG) * totalAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, safeAngle);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Danger zone arc (Red: safeG to maxG)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, safeAngle, endAngle);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Dial Needle
    const gRatio = Math.min(1.0, Math.max(0, currentG / maxG));
    const needleAngle = startAngle + gRatio * totalAngle;
    const needleLen = radius * 0.85;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);

    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(needleLen, 0);
    ctx.lineTo(-3, 0);
    ctx.strokeStyle = currentG > safeG ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = currentG > safeG ? '#ef4444' : '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // Center pivot hub
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Digital readout
    ctx.fillStyle = currentG > safeG ? '#ef4444' : '#10b981';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentG.toFixed(1)} G`, cx, cy + 22);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText(`LIMIT: ${safeG} G`, cx, cy + 34);
    ctx.textAlign = 'left';
  }
}
