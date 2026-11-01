// NXTPAK Studio - Custom 3D Model Ingestion & CAD Loader Engine
// Supports OBJ, STL, GLTF/GLB uploads, drag-and-drop, bounding box estimation, and sample models

import { sound } from './audio.js';
import { i18n } from './i18n.js';
import { ModelBuilder } from './models.js';
import { PRESETS } from './config.js';

export class ModelUploader {
  constructor(appController) {
    this.app = appController;
    this.customModelGroup = null;
    this.customMetadata = null;
  }

  // Load a sample industrial appliance (e.g. Tornado Washing Machine or Sharp AC Compressor)
  loadSampleModel(sampleType) {
    sound.playClick();
    let modelData = {};

    if (sampleType === 'washing_machine') {
      modelData = {
        name: i18n.currentLang === 'ar' ? 'غسالة تورنيدو تحميل أمامي 8 كجم' : 'Tornado Front-Load Washing Machine 8kg',
        model: 'TWF-0800',
        dimensions: { length: 600, width: 550, height: 850 }, // mm
        weight: 68.0, // kg
        fragility: 6.5,
        safeGMax: 35.0,
        criticalComponents: ['Motor Direct Drive', 'Front Glass Door', 'Drum Suspension Springs'],
        color: 0xe2e8f0,
        accentColor: 0x0284c7,
        type: 'washing_machine'
      };
    } else if (sampleType === 'air_conditioner') {
      modelData = {
        name: i18n.currentLang === 'ar' ? 'وحدة تكييف شارب خارجية إنفرتر 2.25 حصان' : 'Sharp Inverter AC Outdoor Compressor Unit',
        model: 'AY-XP18UHE',
        dimensions: { length: 780, width: 290, height: 540 },
        weight: 32.5,
        fragility: 7.0,
        safeGMax: 32.0,
        criticalComponents: ['Rotary Inverter Compressor', 'Condenser Aluminum Fin Tube', 'Fan Motor'],
        color: 0xf1f5f9,
        accentColor: 0xd97706,
        type: 'air_conditioner'
      };
    }

    const mesh = this.buildProceduralSampleMesh(modelData);
    this.applyIngestedModel(mesh, modelData);
  }

  // Procedurally generate detailed sample 3D appliance for immediate inspection
  buildProceduralSampleMesh(spec) {
    const group = new THREE.Group();
    group.name = 'UploadedApplianceSample';
    const s = ModelBuilder.getScale(spec.dimensions);
    const L = spec.dimensions.length * s;
    const W = spec.dimensions.width * s;
    const H = spec.dimensions.height * s;

    if (spec.type === 'washing_machine') {
      // Main steel cabinet
      const bodyGeo = new THREE.BoxGeometry(L, H, W);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Top control panel
      const panelGeo = new THREE.BoxGeometry(L * 0.95, H * 0.18, 0.02);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(0, H * 0.38, W / 2 + 0.01);
      group.add(panel);

      // Rotary cycle knob
      const knobGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 24);
      knobGeo.rotateX(Math.PI / 2);
      const knobMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.9 });
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.set(0, H * 0.38, W / 2 + 0.03);
      group.add(knob);

      // Front circular glass door with chrome bezel
      const doorRingGeo = new THREE.TorusGeometry(Math.min(L, H) * 0.32, 0.035, 16, 48);
      const doorRingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
      const doorRing = new THREE.Mesh(doorRingGeo, doorRingMat);
      doorRing.position.set(0, -H * 0.08, W / 2 + 0.015);
      group.add(doorRing);

      // Tinted glass window
      const glassGeo = new THREE.CircleGeometry(Math.min(L, H) * 0.3, 32);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f2942,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        transmission: 0.7
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, -H * 0.08, W / 2 + 0.016);
      group.add(glass);
    } else {
      // AC Outdoor Unit
      const bodyGeo = new THREE.BoxGeometry(L, H, W);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Circular fan protective grill
      const fanGeo = new THREE.TorusGeometry(Math.min(L, H) * 0.36, 0.025, 16, 40);
      const fanMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(-L * 0.15, 0, W / 2 + 0.01);
      group.add(fan);

      // Compressor side maintenance cover
      const compCover = new THREE.Mesh(
        new THREE.BoxGeometry(L * 0.32, H * 0.85, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 })
      );
      compCover.position.set(L * 0.3, 0, W / 2 + 0.01);
      group.add(compCover);
    }

    return group;
  }

  // Handle uploaded file (OBJ, STL, GLTF/GLB)
  handleFileUpload(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    sound.playClick();

    const reader = new FileReader();

    if (name.endsWith('.obj')) {
      reader.onload = (e) => this.parseOBJ(e.target.result, file.name);
      reader.readAsText(file);
    } else if (name.endsWith('.stl')) {
      reader.onload = (e) => this.parseSTL(e.target.result, file.name);
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.gltf') || name.endsWith('.glb')) {
      reader.onload = (e) => this.parseGLTF(e.target.result, file.name);
      reader.readAsArrayBuffer(file);
    } else {
      alert(i18n.currentLang === 'ar' 
        ? 'صيغة الملف غير مدعومة. يرجى اختيار ملف OBJ أو STL أو GLTF.' 
        : 'Unsupported file format. Please upload .OBJ, .STL, or .GLTF/.GLB 3D CAD files.');
    }
  }

  parseOBJ(text, filename) {
    if (!window.THREE || !window.THREE.OBJLoader) {
      alert('OBJLoader library is loading. Please try again.');
      return;
    }
    try {
      const loader = new THREE.OBJLoader();
      const objGroup = loader.parse(text);
      this.processLoadedGeometry(objGroup, filename);
    } catch (err) {
      console.error('Error parsing OBJ:', err);
      alert('Failed to parse OBJ file: ' + err.message);
    }
  }

  parseSTL(arrayBuffer, filename) {
    if (!window.THREE || !window.THREE.STLLoader) {
      alert('STLLoader library is loading. Please try again.');
      return;
    }
    try {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(arrayBuffer);
      const material = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.4,
        metalness: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);
      this.processLoadedGeometry(group, filename);
    } catch (err) {
      console.error('Error parsing STL:', err);
      alert('Failed to parse STL file: ' + err.message);
    }
  }

  parseGLTF(arrayBuffer, filename) {
    if (!window.THREE || !window.THREE.GLTFLoader) {
      alert('GLTFLoader library is loading. Please try again.');
      return;
    }
    try {
      const loader = new THREE.GLTFLoader();
      loader.parse(arrayBuffer, '', (gltf) => {
        this.processLoadedGeometry(gltf.scene || gltf.scenes[0], filename);
      }, (err) => {
        console.error('Error parsing GLTF:', err);
        alert('Failed to parse GLTF file: ' + err.message);
      });
    } catch (err) {
      console.error('Error running GLTFLoader:', err);
      alert('Failed to parse GLTF file: ' + err.message);
    }
  }

  // Calculate bounding box, normalize scale, and ingest into application
  processLoadedGeometry(threeGroup, filename) {
    // Compute accurate world bounding box
    const bbox = new THREE.Box3().setFromObject(threeGroup);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Center geometry around origin
    threeGroup.position.sub(center);

    // Estimate real-world dimensions in millimeters
    let realL = Math.round(size.x * 1000);
    let realH = Math.round(size.y * 1000);
    let realW = Math.round(size.z * 1000);

    // If file was already saved in mm (large values), normalize
    const maxDimension = Math.max(realL, realH, realW);
    if (maxDimension > 4000) {
      realL = Math.round(size.x);
      realH = Math.round(size.y);
      realW = Math.round(size.z);
    } else if (maxDimension < 100) {
      // Scale up if model was in meters
      realL = Math.max(200, Math.round(size.x * 1000));
      realH = Math.max(200, Math.round(size.y * 1000));
      realW = Math.max(100, Math.round(size.z * 1000));
    }

    // Check if user explicitly specified mass or fragility in the upload modal
    const userMassInput = parseFloat(document.getElementById('upload-custom-mass')?.value);
    const userFragility = parseFloat(document.getElementById('upload-custom-fragility')?.value) || 6.5;

    // Estimate realistic appliance mass (volume * 180 kg/m3 average domestic appliance density)
    const volumeM3 = (realL * realW * realH) / 1e9;
    const estWeight = (Number.isFinite(userMassInput) && userMassInput > 0)
      ? userMassInput
      : Math.max(2.0, Math.min(150.0, parseFloat((volumeM3 * 180).toFixed(1))));

    const modelData = {
      name: filename.replace(/\.[^/.]+$/, '').toUpperCase(),
      model: 'CAD-' + Math.floor(Math.random() * 9000 + 1000),
      dimensions: { length: realL, width: realW, height: realH },
      weight: estWeight,
      fragility: userFragility,
      safeGMax: userFragility >= 8 ? 25.0 : (userFragility >= 6 ? 35.0 : 45.0),
      criticalComponents: ['Custom Geometry Enclosure', 'Internal PCB & Electronics'],
      type: 'uploaded'
    };

    // Apply industrial material to uploaded meshes if not textured
    threeGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.material || child.material.isMeshBasicMaterial) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.45,
            metalness: 0.6
          });
        }
      }
    });

    this.applyIngestedModel(threeGroup, modelData);
  }

  // Hook model into App Controller state and trigger generative cushion synthesis
  applyIngestedModel(threeGroup, modelData) {
    this.customModelGroup = threeGroup;
    this.customMetadata = modelData;

    // Update app state
    this.app.state.presetKey = 'custom';
    this.app.state.dimensions = { ...modelData.dimensions };
    this.app.state.weight = modelData.weight;
    this.app.state.fragility = modelData.fragility;

    // Synchronize PRESETS.custom for physics & export reports
    if (PRESETS && PRESETS.custom) {
      PRESETS.custom.name = modelData.name;
      PRESETS.custom.model = modelData.model || 'CAD-CUSTOM';
      PRESETS.custom.dimensions = { ...modelData.dimensions };
      PRESETS.custom.weight = modelData.weight;
      PRESETS.custom.fragility = modelData.fragility;
      PRESETS.custom.safeGMax = modelData.safeGMax || 35.0;
      if (modelData.criticalComponents) {
        PRESETS.custom.criticalComponents = modelData.criticalComponents;
      }
    }

    // Set custom mesh override in modelBuilder
    this.app.modelBuilder.uploadedCustomMesh = threeGroup;

    // Update preset selector label
    const select = document.getElementById('preset-select');
    if (select) {
      select.value = 'custom';
    }

    // Synchronize UI sliders
    this.app.syncSlidersToState();
    this.app.rebuildAssembly();
    this.app.updateUI();

    // Trigger laser scanning and sound
    sound.playScanSweep();
    this.app.scene.triggerScanAnimation();

    // Close upload modal if open
    const modal = document.getElementById('modal-upload-model');
    if (modal) modal.classList.add('hidden');

    // Notify user with success banner
    const banner = document.getElementById('upload-success-toast');
    if (banner) {
      banner.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
          <span>${i18n.currentLang === 'ar' ? 'تم استيراد النموذج وتوليد الحواجز الكرتونية بنجاح:' : 'CAD Model Ingested & Generative Buffers Synthesized:'} <strong>${modelData.name}</strong> (${modelData.dimensions.length}×${modelData.dimensions.width}×${modelData.dimensions.height} mm, ${modelData.weight} kg)</span>
        </div>
      `;
      banner.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => banner.classList.add('hidden'), 5000);
    }
  }
}
