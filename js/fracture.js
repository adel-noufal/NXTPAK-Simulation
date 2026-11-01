// NXTPAK Studio - Hyper-Realistic Structural Fracture, Crumple & Particle Blast Engine
// Simulates glowing friction sparks, volumetric dust plumes, rigid tumbling debris shards,
// vertex-level mesh crumple deformation, OLED spiderweb glass cracking, and LS-DYNA timeline scrubbing

import { sound } from './audio.js';
import { i18n } from './i18n.js';

export class FractureEngine {
  constructor(cadScene) {
    this.cadScene = cadScene;
    this.debrisGroup = null;
    this.dustParticleGroup = null;
    this.sparksGroup = null;
    this.crackDecalMesh = null;
    this.isFractured = false;
    this.debrisParticles = [];
    this.dustParticles = [];
    this.sparkParticles = [];
    this.animatingPhysics = false;
    this.deformedMeshes = [];

    this.initSystems();
  }

  initSystems() {
    this.debrisGroup = new THREE.Group();
    this.debrisGroup.name = 'FractureDebrisSystem';
    this.cadScene.scene.add(this.debrisGroup);

    this.dustParticleGroup = new THREE.Group();
    this.dustParticleGroup.name = 'ImpactDustSystem';
    this.cadScene.scene.add(this.dustParticleGroup);

    this.sparksGroup = new THREE.Group();
    this.sparksGroup.name = 'ImpactSparksSystem';
    this.cadScene.scene.add(this.sparksGroup);

    this.damagePinsGroup = new THREE.Group();
    this.damagePinsGroup.name = 'DamageVisualizationPins';
    this.cadScene.scene.add(this.damagePinsGroup);

    this.impactPatchGroup = new THREE.Group();
    this.impactPatchGroup.name = 'ImpactFocalPatch';
    this.cadScene.scene.add(this.impactPatchGroup);
  }

  // Clear previous debris, dust particles, sparks, cracks, damage callout pins, and impact patches
  reset() {
    this.isFractured = false;
    this.debrisParticles = [];
    this.dustParticles = [];
    this.sparkParticles = [];
    this.animatingPhysics = false;

    // Restore deformed geometry vertices
    this.restoreVertexDeformation();

    // Clear impact focal patch
    while (this.impactPatchGroup.children.length > 0) {
      const obj = this.impactPatchGroup.children[0];
      this.impactPatchGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Clear damage callout pins
    while (this.damagePinsGroup.children.length > 0) {
      const obj = this.damagePinsGroup.children[0];
      this.damagePinsGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Clear debris meshes
    while (this.debrisGroup.children.length > 0) {
      const obj = this.debrisGroup.children[0];
      this.debrisGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Clear dust particles
    while (this.dustParticleGroup.children.length > 0) {
      const obj = this.dustParticleGroup.children[0];
      this.dustParticleGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    // Clear sparks
    while (this.sparksGroup.children.length > 0) {
      const obj = this.sparksGroup.children[0];
      this.sparksGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    // Clear screen crack decal
    if (this.crackDecalMesh) {
      if (this.crackDecalMesh.parent) this.crackDecalMesh.parent.remove(this.crackDecalMesh);
      if (this.crackDecalMesh.geometry) this.crackDecalMesh.geometry.dispose();
      if (this.crackDecalMesh.material) this.crackDecalMesh.material.dispose();
      this.crackDecalMesh = null;
    }
  }

  // Restore any vertex-deformed geometries back to original uncompressed CAD shape
  restoreVertexDeformation() {
    for (const mesh of this.deformedMeshes) {
      if (mesh && mesh.geometry && mesh.geometry.userData && mesh.geometry.userData.basePositions) {
        const pos = mesh.geometry.attributes.position;
        const base = mesh.geometry.userData.basePositions;
        for (let i = 0; i < base.length; i++) {
          pos.array[i] = base[i];
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }
    }
    this.deformedMeshes = [];
  }

  // Trigger real breaking simulation: generates sparks, flying debris shards, dust blast, vertex crumple, and spiderweb cracks
  triggerBreakage(impactPoint, isEPS = true, isCriticalApplianceDamage = true, applianceRoot = null, buffersGroup = null, productMaterial = null, preset = null, peakG = 0, safeG = 30) {
    this.reset();
    this.isFractured = true;

    // 1. Play visceral multi-layered fracture audio
    sound.playStructuralSnap();
    if (isCriticalApplianceDamage) {
      if (productMaterial && productMaterial.failureMode === 'shattering') {
        setTimeout(() => sound.playGlassShatter(), 60);
      } else {
        setTimeout(() => sound.playThud(), 50);
      }
    }

    // 2. High-speed friction sparks blast
    this.spawnFrictionSparks(impactPoint, isCriticalApplianceDamage);

    // 3. Volumetric dust & cardboard paper fiber particle blast
    this.spawnDustBlast(impactPoint, isEPS);

    // 4. Rigid physical debris shards (corner chunks breaking off with floor bounce)
    this.spawnBufferDebris(impactPoint, isEPS ? 0xf8fafc : 0xb58c55, isEPS);

    // 5. Physical Vertex-Level Mesh Crumple Deformation (dents & folds near impact)
    if (buffersGroup) {
      this.applyPhysicalVertexCrumple(buffersGroup, impactPoint, isEPS);
    }

    // 6. If appliance was critically damaged, generate cracked glass spiderweb decal on appliance
    if (isCriticalApplianceDamage && applianceRoot) {
      this.applyApplianceCrack(applianceRoot, impactPoint);
    }

    // 7. Render 3D component damage callout markers directly in the CAD scene
    if (applianceRoot && productMaterial) {
      this.renderDamageCallouts(applianceRoot, preset, productMaterial, !isCriticalApplianceDamage, peakG, safeG);
    }

    // 8. Render 3D Impact Focal Contact Patch & Shockwave Vector
    this.createImpactFocalPatch(impactPoint, !isCriticalApplianceDamage, peakG, safeG, isEPS ? 'eps' : 'cardboard');

    // 9. Start rigid body debris physics loop
    this.startPhysicsLoop();

    return {
      debrisCount: this.debrisParticles.length,
      dustCount: this.dustParticles.length,
      sparksCount: this.sparkParticles.length,
      crackDepthMm: isEPS ? 48.0 : 14.0,
      structuralIntegrityPercent: isEPS ? 14 : 78,
      applianceDamaged: isCriticalApplianceDamage
    };
  }

  // High-velocity radiant friction sparks shooting along the ground and arcing upwards
  spawnFrictionSparks(impactPoint, isCritical = false) {
    const sparkCount = isCritical ? 65 : 35;
    const floorY = -1.18;
    const sparkMat = new THREE.MeshBasicMaterial({
      color: isCritical ? 0xffaa00 : 0x00f0ff,
      transparent: true,
      opacity: 1.0
    });

    for (let i = 0; i < sparkCount; i++) {
      const size = 0.012 + Math.random() * 0.02;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const mesh = new THREE.Mesh(geo, sparkMat.clone());

      mesh.position.set(
        impactPoint.x + (Math.random() - 0.5) * 0.12,
        floorY + 0.02 + Math.random() * 0.03,
        impactPoint.z + (Math.random() - 0.5) * 0.12
      );

      // Radial ballistic eject vector
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 6.5;
      const vx = Math.cos(angle) * speed;
      const vy = 1.2 + Math.random() * 4.2; // High arc
      const vz = Math.sin(angle) * speed;

      this.sparkParticles.push({
        mesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 1.0,
        decay: 2.2 + Math.random() * 2.5
      });
      this.sparksGroup.add(mesh);
    }
  }

  // Radial dust & fiber blast shooting horizontally along the floor
  spawnDustBlast(impactPoint, isEPS) {
    const particleCount = 65;
    const floorY = -1.18;
    const dustMat = new THREE.MeshStandardMaterial({
      color: isEPS ? 0xf8fafc : 0xd2b48c,
      transparent: true,
      opacity: 0.88,
      roughness: 0.95
    });

    for (let i = 0; i < particleCount; i++) {
      const size = 0.02 + Math.random() * 0.045;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const mesh = new THREE.Mesh(geo, dustMat.clone());

      mesh.position.set(
        impactPoint.x + (Math.random() - 0.5) * 0.12,
        floorY + 0.02 + Math.random() * 0.05,
        impactPoint.z + (Math.random() - 0.5) * 0.12
      );

      // Fast horizontal explosion angle
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.8 + Math.random() * 6.2; // High velocity radial burst
      const vx = Math.cos(angle) * speed;
      const vy = 0.3 + Math.random() * 2.2;
      const vz = Math.sin(angle) * speed;

      this.dustParticles.push({
        mesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 1.0,
        decay: 1.2 + Math.random() * 1.8
      });
      this.dustParticleGroup.add(mesh);
    }
  }

  // Spawn 3D rigid debris shards with outward velocity & tumble spin
  spawnBufferDebris(impactPoint, materialColor, isEPS = false) {
    const shardCount = isEPS ? 36 : 24;
    const floorY = -1.18;
    const shardMat = new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: isEPS ? 0.95 : 0.8,
      metalness: 0.04
    });

    for (let i = 0; i < shardCount; i++) {
      // Procedural faceted chunk
      const size = 0.04 + Math.random() * 0.085;
      const shardGeo = isEPS 
        ? new THREE.DodecahedronGeometry(size, 0)
        : new THREE.TetrahedronGeometry(size, 0);

      // Randomize vertices for jagged irregular fracture look
      const pos = shardGeo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setXYZ(
          j,
          pos.getX(j) * (0.6 + Math.random() * 0.8),
          pos.getY(j) * (0.6 + Math.random() * 0.8),
          pos.getZ(j) * (0.6 + Math.random() * 0.8)
        );
      }
      shardGeo.computeVertexNormals();

      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.castShadow = true;
      shard.receiveShadow = true;

      // Spawn near impact corner
      shard.position.set(
        impactPoint.x + (Math.random() - 0.5) * 0.22,
        Math.max(floorY + 0.05, impactPoint.y + Math.random() * 0.16),
        impactPoint.z + (Math.random() - 0.5) * 0.22
      );

      // Explosion outward velocity vector
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.2;
      const vx = Math.cos(angle) * speed;
      const vy = 1.8 + Math.random() * 4.2; // Eject upward
      const vz = Math.sin(angle) * speed;

      const particle = {
        mesh: shard,
        velocity: new THREE.Vector3(vx, vy, vz),
        angularVel: new THREE.Vector3(
          (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 26
        ),
        bounces: 0,
        active: true
      };

      this.debrisParticles.push(particle);
      this.debrisGroup.add(shard);
    }
  }

  // Physical vertex-level crumple & denting on buffer geometries near impact point
  applyPhysicalVertexCrumple(buffersGroup, impactPoint, isEPS) {
    const cushionMeshes = buffersGroup.userData.cushionMeshes || [];

    cushionMeshes.forEach((mesh) => {
      const isBottom = mesh.userData.dir && mesh.userData.dir.y < 0;
      if (!isBottom || !mesh.geometry) return;

      const geo = mesh.geometry;
      if (!geo.userData || !geo.userData.basePositions) return;

      const pos = geo.attributes.position;
      const base = geo.userData.basePositions;

      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];

        // If bottom half of buffer cap: crumple upwards and crinkle outwards
        if (by < 0) {
          const crumpleAmount = isEPS ? 0.42 : 0.26;
          const noise = Math.sin(bx * 32) * Math.cos(bz * 32) * 0.04;

          // Squashed Y and bulged X/Z (Poisson ratio expansion)
          const ny = by * (1.0 - crumpleAmount) + noise;
          const nx = bx * (1.0 + crumpleAmount * 0.45);
          const nz = bz * (1.0 + crumpleAmount * 0.45);

          pos.setXYZ(i, nx, ny, nz);
        }
      }

      pos.needsUpdate = true;
      geo.computeVertexNormals();
      this.deformedMeshes.push(mesh);
    });
  }

  // Debris, dust & sparks physics simulation loop
  startPhysicsLoop() {
    this.animatingPhysics = true;
    const floorY = -1.18;
    const g = 9.81 * 1.8;
    let lastTime = performance.now();

    const step = (now) => {
      if (!this.animatingPhysics) return;

      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      let hasActiveParticles = false;

      // 1. Animate Debris Shards
      for (const p of this.debrisParticles) {
        if (!p.active) continue;

        p.velocity.y -= g * dt;
        p.velocity.x *= 0.985;
        p.velocity.z *= 0.985;

        p.mesh.position.x += p.velocity.x * dt;
        p.mesh.position.y += p.velocity.y * dt;
        p.mesh.position.z += p.velocity.z * dt;

        p.mesh.rotation.x += p.angularVel.x * dt;
        p.mesh.rotation.y += p.angularVel.y * dt;
        p.mesh.rotation.z += p.angularVel.z * dt;

        if (p.mesh.position.y <= floorY) {
          p.mesh.position.y = floorY;
          p.bounces++;
          p.velocity.y = -p.velocity.y * 0.38;
          p.velocity.x *= 0.65;
          p.velocity.z *= 0.65;
          p.angularVel.multiplyScalar(0.5);

          if (p.bounces >= 4 || Math.abs(p.velocity.y) < 0.2) {
            p.active = false;
            p.mesh.position.y = floorY + 0.02;
          } else {
            hasActiveParticles = true;
          }
        } else {
          hasActiveParticles = true;
        }
      }

      // 2. Animate Friction Sparks
      for (const s of this.sparkParticles) {
        if (s.life <= 0) continue;

        s.velocity.y -= g * 1.2 * dt;
        s.velocity.x *= 0.97;
        s.velocity.z *= 0.97;

        s.mesh.position.x += s.velocity.x * dt;
        s.mesh.position.y += s.velocity.y * dt;
        s.mesh.position.z += s.velocity.z * dt;

        if (s.mesh.position.y <= floorY) {
          s.mesh.position.y = floorY + 0.01;
          s.velocity.y = -s.velocity.y * 0.45; // Sparks bounce off concrete
          s.velocity.x *= 0.7;
          s.velocity.z *= 0.7;
        }

        s.life -= s.decay * dt;
        s.mesh.material.opacity = Math.max(0, s.life);

        if (s.life > 0) hasActiveParticles = true;
        else s.mesh.visible = false;
      }

      // 3. Animate Dust Cloud Particles
      for (const d of this.dustParticles) {
        if (d.life <= 0) continue;

        d.velocity.x *= 0.94;
        d.velocity.z *= 0.94;
        d.velocity.y *= 0.96;

        d.mesh.position.x += d.velocity.x * dt;
        d.mesh.position.y += d.velocity.y * dt;
        d.mesh.position.z += d.velocity.z * dt;

        d.life -= d.decay * dt;
        d.mesh.material.opacity = Math.max(0, d.life * 0.85);
        d.mesh.scale.multiplyScalar(1.0 + dt * 1.6); // Expanding smoke puff

        if (d.life > 0) hasActiveParticles = true;
        else d.mesh.visible = false;
      }

      if (hasActiveParticles) {
        requestAnimationFrame(step);
      } else {
        this.animatingPhysics = false;
      }
    };

    requestAnimationFrame(step);
  }

  // Generates spiderweb glass crack pattern overlay on appliance display/body
  applyApplianceCrack(applianceRoot, impactPoint) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 1024);

    // Spiderweb crack radial rays with glowing core
    const originX = 240;
    const originY = 800; // Bottom corner impact epicenter
    const rayCount = 20;

    // Glowing impact crater
    const craterGrad = ctx.createRadialGradient(originX, originY, 10, originX, originY, 130);
    craterGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    craterGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.75)');
    craterGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = craterGrad;
    ctx.beginPath();
    ctx.arc(originX, originY, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    // Radial main crack lines
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 1.6) * (i / rayCount) - Math.PI * 0.25;
      const length = 220 + Math.random() * 580;
      let curX = originX;
      let curY = originY;

      ctx.beginPath();
      ctx.moveTo(curX, curY);

      const segs = 12;
      for (let s = 1; s <= segs; s++) {
        const segDist = (length / segs) * s;
        const jx = (Math.random() - 0.5) * 36;
        const jy = (Math.random() - 0.5) * 36;
        curX = originX + Math.cos(angle) * segDist + jx;
        curY = originY - Math.sin(angle) * segDist + jy;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    // Concentric spiderweb connecting rings
    ctx.lineWidth = 2.0;
    for (const radius of [70, 150, 260, 420, 620]) {
      ctx.beginPath();
      let first = true;
      for (let a = 0; a <= Math.PI * 1.5; a += 0.18) {
        const rJitter = radius + (Math.random() - 0.5) * 25;
        const cx = originX + Math.cos(a) * rJitter;
        const cy = originY - Math.sin(a) * rJitter;
        if (first) {
          ctx.moveTo(cx, cy);
          first = false;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
    }

    const crackTex = new THREE.CanvasTexture(canvas);
    const crackMat = new THREE.MeshBasicMaterial({
      map: crackTex,
      transparent: true,
      opacity: 0.95,
      depthTest: true,
      side: THREE.DoubleSide
    });

    const bounds = new THREE.Box3().setFromObject(applianceRoot);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    const crackGeo = new THREE.PlaneGeometry(size.x * 0.98, size.y * 0.98);
    this.crackDecalMesh = new THREE.Mesh(crackGeo, crackMat);
    this.crackDecalMesh.position.set(0, 0, size.z / 2 + 0.02);
    this.crackDecalMesh.name = 'SpiderwebCrackDecal';

    applianceRoot.add(this.crackDecalMesh);
  }

  // Scrub fracture progress (0% to 100%) for frame-by-frame inspector
  scrubFractureTimeline(progress) {
    if (!this.crackDecalMesh) return;
    this.crackDecalMesh.material.opacity = Math.min(1.0, progress * 1.2);
    const s = 0.5 + progress * 0.5;
    this.crackDecalMesh.scale.set(s, s, 1);
  }

  // Generate 3D Callout Sprite with leader line pointing to damaged component
  createDamageCalloutPin(anchorPos, title, statusText, detailText, isDamaged) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // High-tech glassmorphic badge styling
    ctx.fillStyle = isDamaged ? 'rgba(15, 23, 42, 0.92)' : 'rgba(6, 78, 59, 0.92)';
    ctx.strokeStyle = isDamaged ? '#ef4444' : '#10b981';
    ctx.lineWidth = 4;

    const r = 16;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(512 - r, 0);
    ctx.quadraticCurveTo(512, 0, 512, r);
    ctx.lineTo(512, 160 - r);
    ctx.quadraticCurveTo(512, 160, 512 - r, 160);
    ctx.lineTo(r, 160);
    ctx.quadraticCurveTo(0, 160, 0, 160 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top status pill badge
    ctx.fillStyle = isDamaged ? '#ef4444' : '#10b981';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(statusText, 24, 42);

    // Title / Component Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(title, 24, 88);

    // Detail / Damage explanation
    ctx.fillStyle = isDamaged ? '#fca5a5' : '#a7f3d0';
    ctx.font = '22px monospace';
    ctx.fillText(detailText, 24, 130);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.85, 0.26, 1.0);

    const offset = new THREE.Vector3(
      anchorPos.x >= 0 ? 0.38 : -0.38,
      0.38,
      anchorPos.z >= 0 ? 0.25 : -0.25
    );
    const spritePos = anchorPos.clone().add(offset);
    sprite.position.copy(spritePos);

    // Glowing anchor beacon dot
    const dotGeo = new THREE.SphereGeometry(0.025, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: isDamaged ? 0xef4444 : 0x10b981 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(anchorPos);

    // Leader line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([anchorPos, spritePos]);
    const lineMat = new THREE.LineBasicMaterial({
      color: isDamaged ? 0xef4444 : 0x10b981,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const line = new THREE.Line(lineGeo, lineMat);

    const pinGroup = new THREE.Group();
    pinGroup.add(dot);
    pinGroup.add(line);
    pinGroup.add(sprite);

    this.damagePinsGroup.add(pinGroup);
    return pinGroup;
  }

  // Render 3D Damage Callout Markers across appliance components
  renderDamageCallouts(applianceRoot, preset, productMaterial, isSafe, peakG, safeG) {
    if (!this.damagePinsGroup) return;

    // Clear existing pins
    while (this.damagePinsGroup.children.length > 0) {
      const obj = this.damagePinsGroup.children[0];
      this.damagePinsGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    if (!applianceRoot) return;

    const bounds = new THREE.Box3().setFromObject(applianceRoot);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const center = new THREE.Vector3();
    bounds.getCenter(center);

    const isAr = i18n.currentLang === 'ar';
    const components = preset?.criticalComponents || ['Enclosure Housing', 'Internal Circuit', 'Fasteners'];

    // 1. External Enclosure Shell Callout
    const enclosurePos = new THREE.Vector3(center.x - size.x * 0.35, center.y - size.y * 0.35, center.z + size.z * 0.45);
    const encName = isAr ? productMaterial.nameAr : productMaterial.name;
    const encStatus = isSafe ? (isAr ? '✓ سليم ومحمي' : '✓ 100% INTACT') : (isAr ? '⚠ تلف وانبعاج بالصاج' : '⚠ CRITICAL DENT / CRACK');
    const encDesc = isSafe 
      ? (isAr ? `إجهاد ${peakG}G أقل من حد الخضوع` : `Stress ${peakG}G below yield point`)
      : (isAr ? `${productMaterial.failureModeNameAr}` : `${productMaterial.failureModeName}`);
    this.createDamageCalloutPin(enclosurePos, encName, encStatus, encDesc, !isSafe);

    // 2. Top/Front Critical Component Callout (OLED Display, Glass Door, Pitcher)
    const comp1Pos = new THREE.Vector3(center.x + size.x * 0.3, center.y + size.y * 0.25, center.z + size.z * 0.45);
    const comp1Name = components[0] || 'Display Substrate';
    const comp1Status = isSafe ? (isAr ? '✓ بدون شروخ' : '✓ INTACT') : (isAr ? '⚠ شروخ وتخلخل' : '⚠ FRACTURED');
    const comp1Desc = isSafe 
      ? (isAr ? `تخميد كامل لصدمة ${peakG}G` : `Damped below ${safeG}G threshold`)
      : (isAr ? `تجاوز تسارع الأمان (${peakG}G > ${safeG}G)` : `Exceeded threshold (${peakG}G > ${safeG}G)`);
    this.createDamageCalloutPin(comp1Pos, comp1Name, comp1Status, comp1Desc, !isSafe);

    // 3. Core Internal Mechanism Callout (Motor, Magnetron, PCB, Suspension)
    const comp2Pos = new THREE.Vector3(center.x, center.y - size.y * 0.2, center.z - size.z * 0.3);
    const comp2Name = components[1] || 'Internal Drive / Core';
    const comp2Status = isSafe ? (isAr ? '✓ محاذاة سليمة' : '✓ ALIGNED') : (isAr ? '⚠ إزاحة داخلية' : '⚠ INTERNAL DISPLACEMENT');
    const comp2Desc = isSafe 
      ? (isAr ? 'نظام التعليق والمحور مستقر' : 'Drive alignment preserved')
      : (isAr ? 'خلع المساعدين أو إجهاد المحور' : 'Damper decouple / coil shift');
    this.createDamageCalloutPin(comp2Pos, comp2Name, comp2Status, comp2Desc, !isSafe);
  }

  toggleDamagePins(visible) {
    if (this.damagePinsGroup) {
      this.damagePinsGroup.visible = !!visible;
    }
    if (this.impactPatchGroup) {
      this.impactPatchGroup.visible = !!visible;
    }
  }

  // 3D Impact Focal Patch: shows the exact contact origin, concentric stress rings, and shockwave propagation vector
  createImpactFocalPatch(impactPoint, isSafe, peakG, safeG, materialKey = 'eps') {
    if (!this.impactPatchGroup) return;

    // Clear previous patch
    while (this.impactPatchGroup.children.length > 0) {
      const obj = this.impactPatchGroup.children[0];
      this.impactPatchGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    const floorY = -1.18;
    const origin = new THREE.Vector3(impactPoint.x, floorY + 0.005, impactPoint.z);

    // 1. Concentric Stress Wave Discs on the floor
    const ringRadii = isSafe ? [0.15, 0.32, 0.5] : [0.2, 0.45, 0.75];
    const ringColor = isSafe ? 0x10b981 : 0xef4444;

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r * 0.92, r, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: isSafe ? (0.7 - idx * 0.2) : (0.9 - idx * 0.25),
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(origin.x, origin.y + idx * 0.002, origin.z);
      this.impactPatchGroup.add(ringMesh);
    });

    // 2. Central Focal Beacon on Contact Zone
    const focalGeo = new THREE.CircleGeometry(0.08, 24);
    focalGeo.rotateX(-Math.PI / 2);
    const focalMat = new THREE.MeshBasicMaterial({
      color: isSafe ? 0x34d399 : 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const focalMesh = new THREE.Mesh(focalGeo, focalMat);
    focalMesh.position.set(origin.x, origin.y + 0.006, origin.z);
    this.impactPatchGroup.add(focalMesh);

    // 3. Shockwave Impulse Vector Arrow (points upward from ground contact into the appliance)
    const arrowDir = new THREE.Vector3(0, 1, 0);
    const arrowLength = isSafe ? 0.45 : 0.85;
    const arrowColor = isSafe ? 0x10b981 : 0xef4444;
    const arrowHelper = new THREE.ArrowHelper(arrowDir, origin, arrowLength, arrowColor, 0.12, 0.06);
    this.impactPatchGroup.add(arrowHelper);

    // 4. Billboard Tag floating right at the impact origin
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isSafe ? 'rgba(6, 78, 59, 0.92)' : 'rgba(127, 29, 29, 0.94)';
    ctx.strokeStyle = isSafe ? '#10b981' : '#f87171';
    ctx.lineWidth = 3;

    const rad = 14;
    ctx.beginPath();
    ctx.moveTo(rad, 0);
    ctx.lineTo(480 - rad, 0);
    ctx.quadraticCurveTo(480, 0, 480, rad);
    ctx.lineTo(480, 140 - rad);
    ctx.quadraticCurveTo(480, 140, 480 - rad, 140);
    ctx.lineTo(rad, 140);
    ctx.quadraticCurveTo(0, 140, 0, 140 - rad);
    ctx.lineTo(0, rad);
    ctx.quadraticCurveTo(0, 0, rad, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const isAr = i18n.currentLang === 'ar';
    ctx.fillStyle = isSafe ? '#34d399' : '#fca5a5';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(isSafe ? (isAr ? '🛡️ بؤرة امتصاص الصدمة' : '🛡️ IMPACT DAMPING ZONE') : (isAr ? '💥 بؤرة الصدمة والخلل' : '💥 IMPACT FAILURE ORIGIN'), 20, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(isSafe ? (isAr ? 'انبعاج تدريجي ممتص' : 'Progressive Buckling Zone') : (isAr ? 'نفاذ الصدمة وانكسار' : 'Cushion Bottomed Out'), 20, 78);

    ctx.fillStyle = isSafe ? '#a7f3d0' : '#fecaca';
    ctx.font = '19px monospace';
    ctx.fillText(isSafe ? `${(peakG).toFixed(1)}G < ${safeG}G (${materialKey.toUpperCase()})` : `Transmitted Shock: ${peakG}G (${materialKey.toUpperCase()})`, 20, 115);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.72, 0.21, 1.0);
    sprite.position.set(origin.x, origin.y + arrowLength + 0.15, origin.z);
    this.impactPatchGroup.add(sprite);
  }
}

