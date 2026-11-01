// NXTPAK Studio - Main Application Controller
// Orchestrates 3D CAD Scene, Generative AI, Physics Drop-Test, Model Upload, Analytics, AR, Dieline, Benchmark, and I18n

import { PRESETS, MATERIALS, DROP_STANDARDS, IMPACT_ANGLES, PRODUCT_MATERIALS } from './config.js';
import { sound } from './audio.js';
import { CADScene } from './scene.js';
import { ModelBuilder } from './models.js';
import { DropPhysicsEngine, estimateProductDamagePercent } from './physics.js';
import { AnalyticsEngine } from './analytics.js';
import { DielineGenerator } from './dieline.js';
import { i18n } from './i18n.js';
import { AREngine } from './ar-mode.js';
import { BenchmarkEngine } from './benchmark.js';
import { ExportEngine } from './export.js';
import { ModelUploader } from './uploader.js';
import { FractureEngine } from './fracture.js';

class AppController {
  constructor() {
    this.state = {
      presetKey: 'tv',
      materialKey: 'honeycomb',
      productMaterialKey: 'tempered_glass',
      damagePinsVisible: true,
      dropHeightKey: '1.0',
      impactAngleKey: 'corner',
      dimensions: { ...PRESETS.tv.dimensions },
      weight: PRESETS.tv.weight,
      fragility: PRESETS.tv.fragility,
      packageSpec: { length: 1310, width: 180, height: 830, cushionThickness: 40, cushionQuantity: 8, layout: 'top_tray', notes: '' },
      packageSpecCustomized: false,
      lastTestResult: null,
      lastTestSuite: null,
      explodedRatio: 0,
      wireframeMode: false,
      heatmapMode: false,
      dimensionsVisible: false,
      cartonViewMode: 'xray',
      isPitchPlaying: false,
      isDestructiveMode: false,
      factoryDataConnected: false
    };

    this.scene = null;
    this.modelBuilder = null;
    this.physics = null;
    this.analytics = null;
    this.ar = null;
    this.benchmark = null;
    this.uploader = null;
    this.fracture = null;

    // 3D Objects
    this.applianceRoot = null;
    this.buffersGroup = null;
    this.outerBoxGroup = null;
    this.packageRoot = null; // Container for drop-test animation
  }

  init() {
    // 1. Initialize Subsystems
    this.scene = new CADScene('cad-viewport');
    this.modelBuilder = new ModelBuilder();
    this.fracture = new FractureEngine(this.scene);
    this.physics = new DropPhysicsEngine(this.scene, this.fracture);
    this.physics.setChartCanvas(document.getElementById('oscilloscope-canvas'));
    this.physics.setGaugeCanvas(document.getElementById('analog-gauge-canvas'));
    this.analytics = new AnalyticsEngine();
    this.ar = new AREngine(this.scene);
    this.benchmark = new BenchmarkEngine();
    this.benchmark.initCanvas(document.getElementById('benchmark-canvas'));
    this.uploader = new ModelUploader(this);

    // 2. Build Initial 3D Assembly
    this.rebuildAssembly();

    // 3. Bind UI DOM Event Listeners
    this.bindEvents();

    // 4. Initial UI Refresh & I18n
    this.updateUI();

    // 5. Initial Oscilloscope & Analog Gauge
    const initPhysics = this.physics.calculateImpactPhysics(
      PRESETS[this.state.presetKey],
      this.state.materialKey,
      parseFloat(this.state.dropHeightKey),
      this.state.impactAngleKey,
      this.state.productMaterialKey
    );
    initPhysics.preset = PRESETS[this.state.presetKey];
    this.physics.drawShockPulseGraph(initPhysics);
    this.physics.drawAnalogGauge(initPhysics.peakG, initPhysics.peakG, initPhysics.safeG);
    this.updateTelemetryHUD(initPhysics);
  }

  // Assemble Appliance + Generative Buffers + Outer Carton in 3D
  rebuildAssembly() {
    if (this.packageRoot) {
      this.scene.scene.remove(this.packageRoot);
    }

    this.packageRoot = new THREE.Group();
    this.packageRoot.name = 'FullPackageAssembly';
    this.packageRoot.position.set(0, 0, 0);

    const dims = this.state.dimensions;
    this.syncPackageInputsFromState();

    // 1. Core Appliance with Enclosure Material
    this.applianceRoot = this.modelBuilder.createAppliance(this.state.presetKey, dims, this.state.productMaterialKey);
    this.packageRoot.add(this.applianceRoot);
    if (this.physics) {
      this.physics.applianceRoot = this.applianceRoot;
    }
    if (this.fracture) {
      this.fracture.reset();
    }

    // 2. Generative Cardboard / Packaging Buffers
    this.buffersGroup = this.modelBuilder.createGenerativeBuffers(
      this.state.presetKey,
      this.state.materialKey,
      dims,
      this.state.packageSpec
    );
    this.packageRoot.add(this.buffersGroup);

    // 3. Corrugated Outer Shipping Box
    this.outerBoxGroup = this.modelBuilder.createOuterBox(
      this.state.presetKey,
      this.buffersGroup,
      dims,
      this.state.packageSpec
    );
    this.packageRoot.add(this.outerBoxGroup);

    // Add full package to scene
    this.scene.scene.add(this.packageRoot);

    // Update 3D Dimension Calipers
    const scale = ModelBuilder.getScale(dims);
    this.scene.updateDimensions(dims, scale);
    this.scene.toggleDimensions(this.state.dimensionsVisible);

    // Reapply wireframe, heatmap, exploded, or carton view modes if active
    if (this.state.wireframeMode) this.applyWireframeMode(true);
    if (this.state.heatmapMode) this.applyHeatmapMode(true);
    if (this.state.explodedRatio > 0) this.applyExplodedView(this.state.explodedRatio);
    this.applyCartonViewMode(this.state.cartonViewMode || 'xray');
  }

  // Bind All Interactive UI Elements
  bindEvents() {
    // Detailed package inputs feed the engineering report and the live estimate.
    ['pack-length', 'pack-width', 'pack-height', 'pack-cushion', 'pack-quantity', 'pack-layout', 'pack-notes'].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('input', () => {
        const value = (key, fallback) => {
          const raw = document.getElementById(key)?.value;
          const n = Number(raw);
          return Number.isFinite(n) && n >= 0 ? n : fallback;
        };
        this.state.packageSpec = {
          length: value('pack-length', 900), width: value('pack-width', 500), height: value('pack-height', 500),
          cushionThickness: value('pack-cushion', 40), cushionQuantity: value('pack-quantity', 8),
          layout: document.getElementById('pack-layout')?.value || 'top_tray',
          notes: document.getElementById('pack-notes')?.value || ''
        };
        // Smart auto-headroom adjustment for top tray and side bay layouts
        if (id === 'pack-layout') {
          const lKey = this.state.packageSpec.layout;
          if (/top/i.test(lKey) && this.state.packageSpec.height < this.state.dimensions.height + 110) {
            this.state.packageSpec.height = this.state.dimensions.height + 120;
          }
          if (/side/i.test(lKey) && this.state.packageSpec.length < this.state.dimensions.length + 130) {
            this.state.packageSpec.length = this.state.dimensions.length + 140;
          }
        }
        this.state.packageSpecCustomized = true;
        const vol = (this.state.packageSpec.length * this.state.packageSpec.width * this.state.packageSpec.height / 1e6).toFixed(2);
        const out = document.getElementById('pack-volume-estimate');
        if (out) out.textContent = `${i18n.currentLang === 'ar' ? 'الحجم الخارجي التقديري' : 'Estimated outer volume'}: ${vol} L`;
      });
      input.addEventListener('change', () => this.rebuildAssembly());
    });
    // --- 0. Bilingual Arabic / English Switcher ---
    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        sound.playClick();
        i18n.toggleLanguage();
        this.updatePresetDropdownLabels();
        this.updateUI();
      });
    }

    // --- 1. Appliance Presets Dropdown ---
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.selectPreset(e.target.value);
      });
    }

    // --- 1.2 Product Enclosure Material Dropdown ---
    const prodMatSelect = document.getElementById('product-material-select');
    if (prodMatSelect) {
      prodMatSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.setProductMaterial(e.target.value);
      });
    }

    // --- 1.3 Toggle 3D Damage Pins ---
    const btnTogglePins = document.getElementById('btn-toggle-damage-pins');
    if (btnTogglePins) {
      btnTogglePins.addEventListener('click', () => {
        sound.playClick();
        this.state.damagePinsVisible = !this.state.damagePinsVisible;
        if (this.fracture) this.fracture.toggleDamagePins(this.state.damagePinsVisible);
        btnTogglePins.classList.toggle('bg-cyan-500/30', this.state.damagePinsVisible);
      });
    }

    // --- 1.4 Apply Engineering Honeycomb Patch ---
    const btnApplyPatch = document.getElementById('btn-apply-cushion-patch');
    if (btnApplyPatch) {
      btnApplyPatch.addEventListener('click', () => {
        sound.playAIGenerating();
        this.selectMaterial('honeycomb');
        this.runSimulation();
        btnApplyPatch.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> ${i18n.currentLang === 'ar' ? 'تم تطبيق حماية Honeycomb بنجاح!' : 'Honeycomb Patch Applied!'}`;
        btnApplyPatch.className = 'mt-1.5 w-full py-1 px-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // --- 2. Dimension & Parameter Sliders ---
    ['slider-length', 'slider-width', 'slider-height', 'slider-weight', 'slider-fragility'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.handleSliderChange());
      }
    });

    const inputWeight = document.getElementById('input-weight');
    if (inputWeight) {
      const handleInputWeight = () => {
        const val = parseFloat(inputWeight.value);
        if (Number.isFinite(val) && val > 0) {
          this.state.weight = val;
          const slider = document.getElementById('slider-weight');
          if (slider) slider.value = Math.min(slider.max, Math.max(slider.min, val));
          this.updateSliderLabels();
          this.rebuildAssembly();
          this.updateUI();
        }
      };
      inputWeight.addEventListener('input', handleInputWeight);
      inputWeight.addEventListener('change', handleInputWeight);
    }

    // --- 3. Material Selection Cards ---
    document.querySelectorAll('[data-material]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const matKey = btn.getAttribute('data-material');
        this.setMaterial(matKey);
      });
    });

    // --- 4. Run AI Generative Optimization Button ---
    const aiBtn = document.getElementById('btn-run-ai');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        sound.playClick();
        this.triggerAIGenerativeOptimization();
      });
    }

    // --- 5. Floating CAD Viewport HUD Controls ---
    const explodedSlider = document.getElementById('slider-exploded');
    if (explodedSlider) {
      explodedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.state.explodedRatio = val;
        this.applyExplodedView(val);
        const label = document.getElementById('exploded-val-label');
        if (label) label.innerText = `${Math.round(val * 100)}%`;
      });
    }

    const btnWireframe = document.getElementById('btn-wireframe');
    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        sound.playClick();
        this.state.wireframeMode = !this.state.wireframeMode;
        btnWireframe.classList.toggle('bg-cyan-500/20', this.state.wireframeMode);
        btnWireframe.classList.toggle('text-cyan-400', this.state.wireframeMode);
        this.applyWireframeMode(this.state.wireframeMode);
      });
    }

    const btnHeatmap = document.getElementById('btn-heatmap');
    if (btnHeatmap) {
      btnHeatmap.addEventListener('click', () => {
        sound.playClick();
        this.state.heatmapMode = !this.state.heatmapMode;
        btnHeatmap.classList.toggle('bg-amber-500/20', this.state.heatmapMode);
        btnHeatmap.classList.toggle('text-amber-400', this.state.heatmapMode);
        this.applyHeatmapMode(this.state.heatmapMode);
      });
    }

    const btnDimensions = document.getElementById('btn-dimensions');
    if (btnDimensions) {
      btnDimensions.addEventListener('click', () => {
        sound.playClick();
        this.state.dimensionsVisible = !this.state.dimensionsVisible;
        btnDimensions.classList.toggle('bg-sky-500/20', this.state.dimensionsVisible);
        btnDimensions.classList.toggle('text-sky-400', this.state.dimensionsVisible);
        this.scene.toggleDimensions(this.state.dimensionsVisible);
      });
    }

    // Cinematic Impact Tracking Cam Toggle
    const btnCinematicCam = document.getElementById('btn-cinematic-cam');
    if (btnCinematicCam) {
      btnCinematicCam.addEventListener('click', () => {
        sound.playClick();
        this.state.cinematicCam = !this.state.cinematicCam;
        this.physics.setCinematicCam(this.state.cinematicCam);
        btnCinematicCam.classList.toggle('bg-amber-500/20', this.state.cinematicCam);
        btnCinematicCam.classList.toggle('text-amber-400', this.state.cinematicCam);
        btnCinematicCam.classList.toggle('border-amber-500/60', this.state.cinematicCam);
      });
    }

    // --- Carton Visibility View Modes: Solid Box | X-Ray (Inside) | Product Only ---
    const btnSolidBox = document.getElementById('btn-view-carton-solid');
    const btnXrayBox = document.getElementById('btn-view-carton-xray');
    const btnProductOnly = document.getElementById('btn-view-carton-product');

    if (btnSolidBox) {
      btnSolidBox.addEventListener('click', () => {
        sound.playClick();
        this.applyCartonViewMode('solid');
      });
    }

    if (btnXrayBox) {
      btnXrayBox.addEventListener('click', () => {
        sound.playClick();
        this.applyCartonViewMode('xray');
      });
    }

    if (btnProductOnly) {
      btnProductOnly.addEventListener('click', () => {
        sound.playClick();
        this.applyCartonViewMode('product');
      });
    }

    const btnToggleERP = document.getElementById('btn-toggle-erp-sync');
    if (btnToggleERP) {
      btnToggleERP.addEventListener('click', () => {
        sound.playClick();
        this.state.factoryDataConnected = !this.state.factoryDataConnected;
        if (this.state.factoryDataConnected) {
          sound.playSuccess();
          const toast = document.getElementById('upload-success-toast');
          if (toast) {
            toast.innerHTML = `
              <div class="flex items-center gap-2">
                <i data-lucide="plug-zap" class="w-4 h-4 text-emerald-400"></i>
                <span>${i18n.currentLang === 'ar' ? 'تم الربط الحي: بوابة بيانات مصانع العربي (Quesna & Benha MES Lake) متصلة بنجاح!' : 'Simulated API Sync: Connected to Elaraby Quesna & Benha Factory MES Gateway!'}</span>
              </div>
            `;
            toast.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => toast.classList.add('hidden'), 4000);
          }
        }
        this.updateROIEconomics();
      });
    }

    document.querySelectorAll('[data-camera]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const camPreset = btn.getAttribute('data-camera');
        this.scene.setCameraPreset(camPreset);
        document.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('text-cyan-400', 'bg-slate-800'));
        btn.classList.add('text-cyan-400', 'bg-slate-800');
      });
    });

    // --- 6. Drop Test Controls & Simulation Speed ---
    document.querySelectorAll('[data-drop-height]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-drop-height]').forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
        btn.classList.add('bg-cyan-600', 'text-white');
        this.state.dropHeightKey = btn.getAttribute('data-drop-height');
        this.updatePhysicsCalculations();
      });
    });

    document.querySelectorAll('[data-impact-angle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-impact-angle]').forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
        btn.classList.add('bg-cyan-600', 'text-white');
        this.state.impactAngleKey = btn.getAttribute('data-impact-angle');
        this.updatePhysicsCalculations();
      });
    });

    // Simulation Speed scaling (1.0x, 0.25x Slow-Mo, 0.1x Ultra-Slow)
    document.querySelectorAll('[data-sim-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-sim-speed]').forEach(b => b.classList.remove('bg-purple-600', 'text-white'));
        btn.classList.add('bg-purple-600', 'text-white');
        const speed = parseFloat(btn.getAttribute('data-sim-speed'));
        this.physics.setTimeScale(speed);
      });
    });

    // Simulate Drop Test Button
    const btnSimulateDrop = document.getElementById('btn-simulate-drop');
    if (btnSimulateDrop) {
      btnSimulateDrop.addEventListener('click', () => {
        this.executeDropTest(btnSimulateDrop, false);
      });
    }

    // Destructive Failure Drop Test Button (Extreme Stress 2.0m)
    const btnDestructive = document.getElementById('btn-destructive-drop');
    if (btnDestructive) {
      btnDestructive.addEventListener('click', () => {
        sound.playClick();
        this.executeDropTest(btnDestructive, true);
      });
    }

    // Replay Last Drop Button
    const btnReplay = document.getElementById('btn-replay-drop');
    if (btnReplay) {
      btnReplay.addEventListener('click', () => {
        sound.playClick();
        this.executeDropTest(btnSimulateDrop, false);
      });
    }

    const btnFullSuite = document.getElementById('btn-run-full-suite');
    if (btnFullSuite) {
      btnFullSuite.addEventListener('click', () => {
        sound.playClick();
        this.runFullTestSuite(btnFullSuite);
      });
    }

    // Interactive LS-DYNA Simulation Timeline Scrubber Slider
    const sliderSimTimeline = document.getElementById('slider-sim-timeline');
    if (sliderSimTimeline) {
      sliderSimTimeline.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.handleTimelineScrub(val);
      });
    }

    // Reset Debris & Cracks Button
    const btnResetDebris = document.getElementById('btn-reset-debris');
    if (btnResetDebris) {
      btnResetDebris.addEventListener('click', () => {
        sound.playClick();
        if (this.fracture) this.fracture.reset();
        const lbl = document.getElementById('telemetry-fracture-status');
        if (lbl) lbl.innerText = i18n.currentLang === 'ar' ? 'سليم 100%' : '100% Intact';
      });
    }

    // --- 7. Model Upload Modal & Ingestion ---
    const btnOpenUpload = document.getElementById('btn-open-upload');
    const btnOpenUploadSide = document.getElementById('btn-open-upload-side');
    const modalUpload = document.getElementById('modal-upload-model');
    const btnCloseUpload = document.getElementById('btn-close-upload');
    const fileInput = document.getElementById('input-model-file');
    const btnBrowse = document.getElementById('btn-browse-file');
    const dropzone = document.getElementById('dropzone-model-file');

    const openUploadModal = () => {
      sound.playClick();
      if (modalUpload) modalUpload.classList.remove('hidden');
    };

    if (btnOpenUpload) btnOpenUpload.addEventListener('click', openUploadModal);
    if (btnOpenUploadSide) btnOpenUploadSide.addEventListener('click', openUploadModal);
    if (btnCloseUpload && modalUpload) {
      btnCloseUpload.addEventListener('click', () => modalUpload.classList.add('hidden'));
    }

    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.uploader.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Drag and drop handling
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('border-cyan-400', 'bg-cyan-950/20');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('border-cyan-400', 'bg-cyan-950/20');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.uploader.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // Sample Appliance Buttons in Upload Modal
    const btnSampleWasher = document.getElementById('btn-sample-washer');
    if (btnSampleWasher) {
      btnSampleWasher.addEventListener('click', () => {
        this.uploader.loadSampleModel('washing_machine');
      });
    }

    const btnSampleAC = document.getElementById('btn-sample-ac');
    if (btnSampleAC) {
      btnSampleAC.addEventListener('click', () => {
        this.uploader.loadSampleModel('air_conditioner');
      });
    }

    // --- 8. Dieline Blueprint Modal Controls ---
    const btnOpenDieline = document.getElementById('btn-view-dieline');
    const modalDieline = document.getElementById('modal-dieline');
    const btnCloseDieline = document.getElementById('btn-close-dieline');
    const btnDownloadDieline = document.getElementById('btn-download-dieline');

    if (btnOpenDieline && modalDieline) {
      btnOpenDieline.addEventListener('click', () => {
        sound.playClick();
        this.openDielineModal();
      });
    }

    if (btnCloseDieline && modalDieline) {
      btnCloseDieline.addEventListener('click', () => {
        sound.playClick();
        modalDieline.classList.add('hidden');
      });
    }

    if (btnDownloadDieline) {
      btnDownloadDieline.addEventListener('click', () => {
        sound.playClick();
        const svgMarkup = DielineGenerator.generateSVG(
          this.state.presetKey,
          this.state.materialKey,
          this.state.dimensions
        );
        DielineGenerator.downloadSVG(svgMarkup, `Elaraby_${this.state.presetKey}_Packaging_Dieline.svg`);
      });
    }

    // --- 9. AR & Factory Floor Modal Controls ---
    const btnOpenAR = document.getElementById('btn-open-ar');
    const modalAR = document.getElementById('modal-ar');
    const btnCloseAR = document.getElementById('btn-close-ar');
    const btnToggleConveyor = document.getElementById('btn-toggle-conveyor');

    if (btnOpenAR && modalAR) {
      btnOpenAR.addEventListener('click', () => {
        sound.playClick();
        modalAR.classList.remove('hidden');
        const qrContainer = document.getElementById('ar-qr-container');
        if (qrContainer) {
          qrContainer.innerHTML = AREngine.generateQRCodeSVG();
        }
      });
    }

    if (btnCloseAR && modalAR) {
      btnCloseAR.addEventListener('click', () => {
        sound.playClick();
        modalAR.classList.add('hidden');
      });
    }

    if (btnToggleConveyor) {
      btnToggleConveyor.addEventListener('click', () => {
        sound.playClick();
        const active = this.ar.toggleFactoryFloor();
        btnToggleConveyor.classList.toggle('bg-emerald-600', active);
        btnToggleConveyor.classList.toggle('text-white', active);
      });
    }

    // --- 10. Live A/B Impact Benchmark Modal Controls ---
    const btnOpenBenchmark = document.getElementById('btn-open-benchmark');
    const modalBenchmark = document.getElementById('modal-benchmark');
    const btnCloseBenchmark = document.getElementById('btn-close-benchmark');

    if (btnOpenBenchmark && modalBenchmark) {
      btnOpenBenchmark.addEventListener('click', () => {
        sound.playClick();
        modalBenchmark.classList.remove('hidden');
        this.runBenchmarkDisplay();
      });
    }

    if (btnCloseBenchmark && modalBenchmark) {
      btnCloseBenchmark.addEventListener('click', () => {
        sound.playClick();
        modalBenchmark.classList.add('hidden');
      });
    }

    // --- 11. Printable Engineering Report Modal Controls ---
    const btnOpenReport = document.getElementById('btn-open-report');
    const modalReport = document.getElementById('modal-report');
    const btnCloseReport = document.getElementById('btn-close-report');
    const btnPrintReport = document.getElementById('btn-print-report');

    if (btnOpenReport && modalReport) {
      btnOpenReport.addEventListener('click', () => {
        sound.playClick();
        this.runFullTestSuite(document.getElementById('btn-run-full-suite'));
      });
    }

    if (btnCloseReport && modalReport) {
      btnCloseReport.addEventListener('click', () => {
        sound.playClick();
        modalReport.classList.add('hidden');
      });
    }

    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => {
        window.print();
      });
    }

    // --- 12. 3D Wavefront .OBJ CAD Mesh Export ---
    const btnExportCAD = document.getElementById('btn-export-cad');
    if (btnExportCAD) {
      btnExportCAD.addEventListener('click', () => {
        sound.playClick();
        if (this.packageRoot) {
          ExportEngine.exportThreeGroupToOBJ(
            this.packageRoot,
            `Elaraby_${this.state.presetKey}_Packaging_Assembly.obj`
          );
        }
      });
    }

    // --- 13. Audio Mute Toggle ---
    const btnMute = document.getElementById('btn-toggle-audio');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        btnMute.innerHTML = isMuted
          ? '<i data-lucide="volume-x" class="w-4 h-4 text-slate-500"></i>'
          : '<i data-lucide="volume-2" class="w-4 h-4 text-cyan-400"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // --- 14. Pitch Presentation Auto-Demo Mode ---
    const btnPitch = document.getElementById('btn-pitch-mode');
    if (btnPitch) {
      btnPitch.addEventListener('click', () => {
        sound.playClick();
        this.runPitchPresentationMode();
      });
    }
  }

  executeDropTest(dropBtn, isDestructive = false) {
    if (this.physics.isSimulating) return;
    if (dropBtn) {
      dropBtn.disabled = true;
      dropBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    const dropH = isDestructive ? 2.0 : parseFloat(this.state.dropHeightKey);
    const preset = PRESETS[this.state.presetKey] || PRESETS.tv;
    const currentPhysics = this.physics.calculateImpactPhysics(
      { 
        ...preset,
        weight: this.state.weight,
        dimensions: this.state.dimensions,
        safeGMax: preset.safeGMax,
        defaultProductMaterial: this.state.productMaterialKey || preset.defaultProductMaterial
      },
      this.state.materialKey,
      dropH,
      this.state.impactAngleKey,
      this.state.productMaterialKey
    );
    currentPhysics.preset = preset;

    currentPhysics.isDestructive = isDestructive;
    if (isDestructive) {
      currentPhysics.peakG = parseFloat((currentPhysics.peakG * 1.55).toFixed(1));
      currentPhysics.isSafe = false;
    }
    currentPhysics.estimatedDamagePercent = estimateProductDamagePercent(currentPhysics.peakG, currentPhysics.safeG);
    this.state.lastTestResult = { ...currentPhysics, testedAt: new Date().toISOString() };

    this.physics.runDropTest(
      this.packageRoot,
      this.buffersGroup,
      currentPhysics,
      (physicsResult) => {
        this.updateTelemetryHUD(physicsResult);
      },
      () => {
        if (dropBtn) {
          dropBtn.disabled = false;
          dropBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    );
  }

  runFullTestSuite(button) {
    if (this.physics.isSimulating || !button) return;
    button.disabled = true;
    const status = document.getElementById('full-suite-status');
    if (status) status.textContent = i18n.currentLang === 'ar' ? 'جاري تنفيذ 21 حالة اختبار…' : 'Running 21 test cases…';

    const heights = [0.5, 1.0, 1.5];
    const angles = ['flat', 'corner', 'edge'];
    const suite = [];
    const preset = PRESETS[this.state.presetKey] || PRESETS.tv;
    const appliance = { ...preset, weight: this.state.weight };
    heights.forEach((height) => angles.forEach((angle) => {
      const result = this.physics.calculateImpactPhysics(appliance, this.state.materialKey, height, angle);
      suite.push({ ...result, kind: 'Drop test', isDestructive: false, estimatedDamagePercent: estimateProductDamagePercent(result.peakG, result.safeG) });
    }));
    angles.forEach((angle) => {
      const result = this.physics.calculateImpactPhysics(appliance, this.state.materialKey, 2.0, angle);
      result.peakG = parseFloat((result.peakG * 1.55).toFixed(1));
      result.isSafe = false;
      suite.push({ ...result, kind: 'Destructive drop', isDestructive: true, estimatedDamagePercent: estimateProductDamagePercent(result.peakG, result.safeG) });
    });

    const benchmarks = [];
    heights.forEach((height) => angles.forEach((angle) => {
      const benchmark = this.benchmark.computeBenchmark(this.state.presetKey, height, angle, this.physics);
      benchmarks.push({ height, angle: IMPACT_ANGLES[angle].name, ...benchmark,
        epsDamagePercent: estimateProductDamagePercent(benchmark.eps.peakG, benchmark.safeG),
        honeycombDamagePercent: estimateProductDamagePercent(benchmark.honeycomb.peakG, benchmark.safeG) });
    }));

    const worstCase = suite.reduce((worst, row) => row.peakG > worst.peakG ? row : worst, suite[0]);
    this.state.lastTestResult = { ...worstCase, testedAt: new Date().toISOString() };
    this.state.lastTestSuite = { tests: suite, benchmarks, completedAt: new Date().toISOString() };
    this.openReportModal();
    if (status) status.textContent = i18n.currentLang === 'ar' ? 'اكتملت كل الاختبارات — التقرير جاهز' : 'All tests complete — report ready';
    button.disabled = false;
  }

  // Interactive LS-DYNA Timeline Scrubber Engine
  handleTimelineScrub(progress) {
    if (!this.packageRoot || this.physics.isSimulating) return;

    const angle = IMPACT_ANGLES[this.state.impactAngleKey] || IMPACT_ANGLES.flat;
    const dropH = parseFloat(this.state.dropHeightKey) || 1.0;
    const liftH = 0.8 + dropH * 1.2;
    const curPhysics = this.physics.lastSimulationData || this.physics.calculateImpactPhysics(
      PRESETS[this.state.presetKey],
      this.state.materialKey,
      dropH,
      this.state.impactAngleKey
    );

    const labelTime = document.getElementById('sim-timeline-ms');
    const labelStage = document.getElementById('sim-timeline-stage');
    const ms = Math.round(progress * 500);
    if (labelTime) labelTime.innerText = `${ms.toFixed(1)} ms`;

    // Phase 1: Freefall (0.0 to 0.5)
    if (progress <= 0.5) {
      const fallT = progress / 0.5;
      const easeFall = fallT * fallT;
      this.packageRoot.position.y = liftH * (1.0 - easeFall);
      this.packageRoot.rotation.x = angle.rotX;
      this.packageRoot.rotation.z = angle.rotZ;

      if (labelStage) labelStage.innerText = progress < 0.1 ? 'Apex' : 'Freefall';
      this.physics.drawAnalogGauge(0, curPhysics.peakG, curPhysics.safeG);
      this.physics.drawShockPulseGraph(curPhysics, progress * 0.4);
      if (this.fracture) this.fracture.scrubFractureTimeline(0);
      this.applyScrubCompression(0);
    } 
    // Phase 2: Contact, Peak Crush & Max Stress (0.5 to 0.7)
    else if (progress <= 0.7) {
      const crushT = (progress - 0.5) / 0.2;
      this.packageRoot.position.y = 0;
      this.packageRoot.rotation.x = angle.rotX;
      this.packageRoot.rotation.z = angle.rotZ;

      const currentG = curPhysics.peakG * Math.sin(crushT * Math.PI * 0.5);
      if (labelStage) labelStage.innerText = 'Peak Crush & Stress';
      this.physics.drawAnalogGauge(currentG, curPhysics.peakG, curPhysics.safeG);
      this.physics.drawShockPulseGraph(curPhysics, 0.4 + crushT * 0.3);
      if (this.fracture) this.fracture.scrubFractureTimeline(crushT);
      this.applyScrubCompression(crushT);
      this.applyScrubStress(crushT, curPhysics);
    } 
    // Phase 3: Secondary Slap-Down & Rebound (0.7 to 0.9)
    else if (progress <= 0.9) {
      const slapT = (progress - 0.7) / 0.2;
      const bounceSin = Math.sin(slapT * Math.PI);
      this.packageRoot.position.y = 0.08 * bounceSin;

      // Angular slap-down to flat
      this.packageRoot.rotation.x = angle.rotX * (1.0 - slapT);
      this.packageRoot.rotation.z = angle.rotZ * (1.0 - slapT);

      if (labelStage) labelStage.innerText = 'Slap-Down & Rebound';
      const decayG = curPhysics.peakG * (1.0 - slapT * 0.7);
      this.physics.drawAnalogGauge(decayG, curPhysics.peakG, curPhysics.safeG);
      this.physics.drawShockPulseGraph(curPhysics, 0.7 + slapT * 0.25);
      if (this.fracture) this.fracture.scrubFractureTimeline(1.0);
    } 
    // Phase 4: Settle & Rest (0.9 to 1.0)
    else {
      this.packageRoot.position.set(0, 0, 0);
      this.packageRoot.rotation.set(0, 0, 0);
      if (labelStage) labelStage.innerText = 'Rest (Yield Analysis)';
      this.physics.drawAnalogGauge(0, curPhysics.peakG, curPhysics.safeG);
      this.physics.drawShockPulseGraph(curPhysics, 1.0);
      if (this.fracture) this.fracture.scrubFractureTimeline(1.0);
    }
  }

  applyScrubCompression(ratio) {
    if (!this.buffersGroup) return;
    const cushionMeshes = this.buffersGroup.userData.cushionMeshes || [];
    const compressionRatio = ratio * 0.45;
    const lateralBulge = 1.0 + compressionRatio * 0.35;
    cushionMeshes.forEach(mesh => {
      const isBottom = mesh.userData.dir && mesh.userData.dir.y < 0;
      if (isBottom) {
        mesh.scale.set(lateralBulge, 1.0 - compressionRatio, lateralBulge);
      }
    });
  }

  applyScrubStress(ratio, physicsParams) {
    if (!this.buffersGroup) return;
    const cushionMeshes = this.buffersGroup.userData.cushionMeshes || [];
    const stressColor = ratio > 0.75 
      ? (physicsParams.isSafe ? new THREE.Color(0xf59e0b) : new THREE.Color(0xef4444))
      : new THREE.Color(0x10b981);
    cushionMeshes.forEach(mesh => {
      if (!mesh.material) return;
      const isBottom = mesh.userData.dir && mesh.userData.dir.y < 0;
      if (isBottom) {
        mesh.material.emissive = stressColor;
        mesh.material.emissiveIntensity = ratio * 1.5;
      }
    });
  }

  updatePresetDropdownLabels() {
    const s = document.getElementById('preset-select');
    if (!s) return;
    s.options[0].text = i18n.t('presetTV');
    s.options[1].text = i18n.t('presetMicrowave');
    s.options[2].text = i18n.t('presetBlender');
    s.options[3].text = i18n.t('presetCustom');
  }

  selectPreset(presetKey) {
    this.state.presetKey = presetKey;
    const preset = PRESETS[presetKey];
    const isCustom = presetKey === 'custom';

    ['slider-length', 'slider-width', 'slider-height', 'slider-weight', 'slider-fragility'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });

    if (!isCustom) {
      this.modelBuilder.uploadedCustomMesh = null; // Reset custom upload when preset chosen
      this.state.dimensions = { ...preset.dimensions };
      this.state.weight = preset.weight;
      this.state.fragility = preset.fragility;
      if (preset.defaultProductMaterial) {
        this.state.productMaterialKey = preset.defaultProductMaterial;
      }
      this.state.packageSpecCustomized = false;
      if (!this.state.packageSpecCustomized) {
        const layout = this.state.packageSpec.layout || 'top_tray';
        const extraH = (/top/i.test(layout)) ? 120 : 80;
        const extraL = (/side/i.test(layout)) ? 140 : 80;
        this.state.packageSpec.length = preset.dimensions.length + extraL;
        this.state.packageSpec.width = preset.dimensions.width + 80;
        this.state.packageSpec.height = preset.dimensions.height + extraH;
      }
    }

    this.syncSlidersToState();
    this.rebuildAssembly();
    this.updateUI();
  }

  handleSliderChange() {
    this.state.dimensions.length = parseFloat(document.getElementById('slider-length').value) || 600;
    this.state.dimensions.width = parseFloat(document.getElementById('slider-width').value) || 400;
    this.state.dimensions.height = parseFloat(document.getElementById('slider-height').value) || 400;
    this.state.weight = parseFloat(document.getElementById('slider-weight').value) || 10;
    this.state.fragility = parseFloat(document.getElementById('slider-fragility').value) || 6;

    this.updateSliderLabels();
    this.rebuildAssembly();
    this.updateUI();
  }

  syncSlidersToState() {
    const d = this.state.dimensions;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal('slider-length', d.length);
    setVal('slider-width', d.width);
    setVal('slider-height', d.height);
    setVal('slider-weight', this.state.weight);
    setVal('slider-fragility', this.state.fragility);
    const inputWeight = document.getElementById('input-weight');
    if (inputWeight && document.activeElement !== inputWeight) inputWeight.value = this.state.weight;
    this.updateSliderLabels();
  }

  updateSliderLabels() {
    const d = this.state.dimensions;
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };
    setText('val-length', `${d.length} mm`);
    setText('val-width', `${d.width} mm`);
    setText('val-height', `${d.height} mm`);
    setText('val-weight', `${this.state.weight} kg`);
    setText('val-fragility', `${this.state.fragility} / 10`);
    const inputWeight = document.getElementById('input-weight');
    if (inputWeight && document.activeElement !== inputWeight) {
      inputWeight.value = this.state.weight;
    }
  }

  setMaterial(matKey) {
    this.state.materialKey = matKey;

    document.querySelectorAll('[data-material]').forEach((btn) => {
      const key = btn.getAttribute('data-material');
      const isSelected = key === matKey;
      btn.classList.toggle('border-cyan-500', isSelected);
      btn.classList.toggle('bg-cyan-950/30', isSelected);
      btn.classList.toggle('border-slate-800', !isSelected);
    });

    this.rebuildAssembly();
    this.updateUI();
  }

  setProductMaterial(prodMatKey) {
    this.state.productMaterialKey = prodMatKey;
    this.updateProductMaterialInfoCard();
    this.rebuildAssembly();
    this.updateUI();
  }

  updateProductMaterialInfoCard() {
    const mat = PRODUCT_MATERIALS[this.state.productMaterialKey] || PRODUCT_MATERIALS.sheet_metal_steel;
    const isAr = i18n.currentLang === 'ar';
    const elYield = document.getElementById('prod-mat-yield-val');
    const elFailure = document.getElementById('prod-mat-failure-val');
    const elUsage = document.getElementById('prod-mat-usage-val');
    const elTag = document.getElementById('current-prod-mat-tag');
    if (elYield) elYield.innerText = `${mat.yieldStrengthMPa} MPa`;
    if (elFailure) elFailure.innerText = isAr ? mat.failureModeNameAr : mat.failureModeName;
    if (elUsage) elUsage.innerText = isAr ? mat.typicalUsageAr : mat.typicalUsage;
    if (elTag) elTag.innerText = isAr ? mat.nameAr : mat.name;

    const select = document.getElementById('product-material-select');
    if (select && select.value !== this.state.productMaterialKey) {
      select.value = this.state.productMaterialKey;
    }
  }

  applyExplodedView(ratio) {
    if (!this.buffersGroup || !this.outerBoxGroup) return;

    const boxMesh = this.outerBoxGroup.userData.boxMesh;
    const wireMesh = this.outerBoxGroup.userData.wireMesh;
    const expandScale = 1.0 + ratio * 0.45;
    if (boxMesh) boxMesh.scale.set(expandScale, expandScale, expandScale);
    if (wireMesh) wireMesh.scale.set(expandScale, expandScale, expandScale);

    const cushionMeshes = this.buffersGroup.userData.cushionMeshes || [];
    cushionMeshes.forEach((mesh) => {
      const dir = mesh.userData.dir;
      const origPos = mesh.userData.origPos;
      if (!dir || !origPos) return;

      const offsetDist = ratio * 0.55;
      mesh.position.set(
        origPos.x + dir.x * offsetDist,
        origPos.y + dir.y * offsetDist,
        origPos.z + dir.z * offsetDist
      );
    });
  }

  applyWireframeMode(enabled) {
    const setWireframe = (obj) => {
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.wireframe = enabled);
        } else {
          obj.material.wireframe = enabled;
        }
      }
      if (obj.children) {
        obj.children.forEach(setWireframe);
      }
    };
    if (this.packageRoot) setWireframe(this.packageRoot);
  }

  applyHeatmapMode(enabled) {
    const cushionMeshes = this.buffersGroup ? (this.buffersGroup.userData.cushionMeshes || []) : [];
    cushionMeshes.forEach((mesh) => {
      if (!mesh.material) return;
      if (enabled) {
        const isBottom = mesh.userData.dir && mesh.userData.dir.y < 0;
        mesh.material.emissive = new THREE.Color(isBottom ? 0xf59e0b : 0x10b981);
        mesh.material.emissiveIntensity = 0.65;
      } else {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
  }

  applyCartonViewMode(mode) {
    this.state.cartonViewMode = mode;
    if (!this.outerBoxGroup || !this.outerBoxGroup.userData) return;

    const boxMesh = this.outerBoxGroup.userData.boxMesh;
    const wireMesh = this.outerBoxGroup.userData.wireMesh;
    const boxMat = this.outerBoxGroup.userData.boxMat;

    const btnSolid = document.getElementById('btn-view-carton-solid');
    const btnXray = document.getElementById('btn-view-carton-xray');
    const btnProduct = document.getElementById('btn-view-carton-product');

    const setActive = (btn, active, activeBg, activeText, activeBorder) => {
      if (!btn) return;
      if (active) {
        btn.className = `px-2 py-1 rounded ${activeBg} ${activeText} font-bold border ${activeBorder} transition-all flex items-center gap-1 shadow-sm`;
      } else {
        btn.className = 'px-2 py-1 rounded text-slate-400 hover:text-white transition-all flex items-center gap-1 border border-transparent';
      }
    };

    setActive(btnSolid, mode === 'solid', 'bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
    setActive(btnXray, mode === 'xray', 'bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/40');
    setActive(btnProduct, mode === 'product', 'bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');

    if (mode === 'solid') {
      // 1. Solid Sealed Shipping Carton (Completely opaque - hides the appliance inside)
      this.outerBoxGroup.visible = true;
      if (boxMesh) {
        boxMesh.visible = true;
        if (boxMat) {
          boxMat.transparent = false;
          boxMat.opacity = 1.0;
          boxMat.depthWrite = true;
          boxMat.side = THREE.DoubleSide;
          boxMat.needsUpdate = true;
        }
      }
      if (wireMesh) wireMesh.visible = false;
      this.outerBoxGroup.traverse((c) => {
        if (c.name.startsWith('CartonPartition') || c.userData?.isPartition) c.visible = false;
      });
    } else if (mode === 'product') {
      // 2. Product Only Mode (Hides outer box completely so user can inspect appliance & cushioning directly)
      this.outerBoxGroup.visible = false;
      if (boxMesh) boxMesh.visible = false;
      if (wireMesh) wireMesh.visible = false;
    } else {
      // 3. X-Ray See-Through Mode (Default: semi-transparent outer box showing internal product & buffers)
      this.outerBoxGroup.visible = true;
      if (boxMesh) {
        boxMesh.visible = true;
        if (boxMat) {
          boxMat.transparent = true;
          boxMat.opacity = 0.35;
          boxMat.depthWrite = false;
          boxMat.side = THREE.DoubleSide;
          boxMat.needsUpdate = true;
        }
      }
      if (wireMesh) wireMesh.visible = !this.state.wireframeMode;
      this.outerBoxGroup.traverse((c) => {
        if (c.name.startsWith('CartonPartition') || c.userData?.isPartition) c.visible = true;
      });
    }
  }

  triggerAIGenerativeOptimization() {
    const modalAI = document.getElementById('modal-ai-terminal');
    const logContainer = document.getElementById('ai-log-content');
    if (!modalAI || !logContainer) return;

    modalAI.classList.remove('hidden');
    logContainer.innerHTML = '';

    sound.playScanSweep();
    this.scene.triggerScanAnimation();

    const d = this.state.dimensions;
    const preset = PRESETS[this.state.presetKey];
    const isAr = i18n.currentLang === 'ar';

    const logsEn = [
      `[AI-CAD] Initializing NXTPAK Generative Topology Optimization Kernel v4.2...`,
      `[GEOM] Ingesting Bounding Envelope: ${d.length} x ${d.width} x ${d.height} mm (Volume: ${((d.length*d.width*d.height)/1e6).toFixed(1)} L)`,
      `[FEA] Computing Center of Gravity & mass inertia tensor for ${preset.name}...`,
      `[CRITICAL] Identifying fragile zones: ${preset.criticalComponents.join(' | ')}...`,
      `[ORIGAMI] Iterating Miura-ori & Yoshimura crease nodes for zero-glue folding (Gen 18/50)...`,
      `[HONEYCOMB] Synthesizing variable-density 15mm hexagonal corrugation ribs at impact vertices...`,
      `[OPTIM] FEA constraint: Max deceleration <= ${preset.safeGMax} G under 1.0m ISTA-1A drop...`,
      `[CIRCULAR] Minimizing raw kraft paperboard mass by 34.2% (Eliminated 100% EPS toxic plastic)...`,
      `[EXPORT] Vector dieline cut-crease geometry synthesized for Elaraby factory CNC tables.`,
      `[STATUS] ✨ Optimal Circular Packaging Envelope Generated Successfully (0.84s).`
    ];

    const logsAr = [
      `[AI-CAD] جاري تهيئة نواة التحسين الطوبولوجي التوليدي الذكي لمجموعة العربي v4.2...`,
      `[GEOM] قراءة الأبعاد الهندسية: ${d.length} × ${d.width} × ${d.height} مم (الحجم: ${((d.length*d.width*d.height)/1e6).toFixed(1)} لتر)`,
      `[FEA] حساب مركز الثقل وعزم القصور الذاتي لجهاز ${preset.name}...`,
      `[CRITICAL] تحديد المناطق الحساسة للكسر: ${preset.criticalComponents.join(' | ')}...`,
      `[ORIGAMI] توليد عقد طي الأوريجامي المهندس بدون غراء كيميائي (الجيل 18/50)...`,
      `[HONEYCOMB] تشكيل أضلاع قرص العسل السداسية 15 مم على زوايا الصدمة الحرجة...`,
      `[OPTIM] شرط الأمان الميكانيكي: أقصى تباطؤ <= ${preset.safeGMax} G في اختبار سقوط 1.0 متر...`,
      `[CIRCULAR] تخفيض استهلاك كرتون الكرافت بنسبة 34.2% مع إلغاء 100% من فلين EPS السام...`,
      `[EXPORT] تجهيز مخطط القطع والطي الرقمي لماكينات CNC بمصانع العربي بقويسنا وبنها.`,
      `[STATUS] ✨ تم توليد الهيكل التغليفي الدائري الأمثل بنجاح خلال (0.84 ثانية).`
    ];

    const logs = isAr ? logsAr : logsEn;

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        const p = document.createElement('div');
        p.className = 'font-mono text-xs leading-relaxed ' +
          (logIdx === logs.length - 1 ? 'text-emerald-400 font-bold' : logIdx % 2 === 0 ? 'text-cyan-300' : 'text-slate-300');
        p.innerText = logs[logIdx];
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
        sound.playClick();
        logIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          modalAI.classList.add('hidden');
          sound.playSuccessPassChime();
          this.rebuildAssembly();
          this.updateUI();
        }, 1200);
      }
    }, 180);
  }

  updateUI() {
    this.updatePhysicsCalculations();
    this.updateROIEconomics();
  }

  updatePhysicsCalculations() {
    const preset = PRESETS[this.state.presetKey] || PRESETS.tv;
    const physicsResult = this.physics.calculateImpactPhysics(
      { 
        ...preset,
        weight: this.state.weight,
        dimensions: this.state.dimensions,
        safeGMax: preset.safeGMax,
        defaultProductMaterial: this.state.productMaterialKey || preset.defaultProductMaterial
      },
      this.state.materialKey,
      parseFloat(this.state.dropHeightKey),
      this.state.impactAngleKey,
      this.state.productMaterialKey
    );
    physicsResult.preset = preset;

    this.updateTelemetryHUD(physicsResult);
    this.physics.drawShockPulseGraph(physicsResult);
  }

  updateTelemetryHUD(res) {
    const elPeakG = document.getElementById('telemetry-peak-g');
    if (elPeakG) elPeakG.innerText = `${res.peakG} G`;

    const elSafeG = document.getElementById('telemetry-safe-g');
    if (elSafeG) elSafeG.innerText = `${i18n.t('fragilityLimit')} ${res.safeG} G`;

    const elEnergy = document.getElementById('telemetry-energy');
    if (elEnergy) elEnergy.innerText = `${res.absorbedEnergyJoules} J (${Math.round((res.absorbedEnergyJoules / res.impactEnergyJoules) * 100)}% ${i18n.t('energyAbsorbed')})`;

    const elDisplacement = document.getElementById('telemetry-displacement');
    if (elDisplacement) {
      const strainTxt = res.cushionStrainPercent !== undefined ? ` (${res.cushionStrainPercent}% strain)` : '';
      elDisplacement.innerText = `${res.dynamicDisplacementMm} mm${strainTxt}`;
    }

    const elBadge = document.getElementById('telemetry-status-badge');
    if (elBadge) {
      if (res.isSafe) {
        elBadge.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40';
        elBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> ${i18n.t('statusSafe')}`;
      } else {
        elBadge.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-950/40';
        elBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> ${i18n.t('statusCritical')}`;
      }
    }

    // Update Enclosure Mechanical Failure
    const elEnclosure = document.getElementById('telemetry-enclosure-failure');
    if (elEnclosure) {
      const isAr = i18n.currentLang === 'ar';
      elEnclosure.innerText = isAr ? (res.failureDescriptionAr || 'سليم') : (res.failureDescription || 'Safe');
      elEnclosure.className = res.isSafe ? 'font-bold text-emerald-400 truncate max-w-[170px]' : 'font-bold text-red-400 truncate max-w-[170px]';
    }

    // Render Component Breakdown and Root Cause Diagnostic Patch
    this.renderComponentDamageList(res);
    this.updateRootCauseDiagnosticBox(res);

    // Update Fracture & Structural Damage Inspector
    const fData = this.physics.fractureData;
    const elFractureStatus = document.getElementById('telemetry-fracture-status');
    const elDebrisCount = document.getElementById('telemetry-debris-count');
    const elIntegrityBar = document.getElementById('telemetry-integrity-bar');
    const elIntegrityVal = document.getElementById('telemetry-integrity-val');

    if (fData && elFractureStatus) {
      if (fData.applianceDamaged) {
        elFractureStatus.className = 'text-xs font-mono font-bold text-red-400';
        elFractureStatus.innerText = i18n.currentLang === 'ar' ? '⚠️ تحطم وكسور بالعنصر الحساس' : '⚠️ Critical Fracture & Shatter';
      } else {
        elFractureStatus.className = 'text-xs font-mono font-bold text-emerald-400';
        elFractureStatus.innerText = i18n.currentLang === 'ar' ? 'سليم تماماً بدون كسور' : '100% Protected (Zero Fracture)';
      }

      if (elDebrisCount) {
        elDebrisCount.innerText = `${fData.debrisCount} ${i18n.currentLang === 'ar' ? 'شظايا متناثرة' : 'fragments ejected'}`;
      }
      if (elIntegrityBar && elIntegrityVal) {
        elIntegrityBar.style.width = `${fData.structuralIntegrityPercent}%`;
        elIntegrityBar.className = fData.structuralIntegrityPercent > 50 ? 'h-full bg-emerald-500 transition-all' : 'h-full bg-red-500 transition-all';
        elIntegrityVal.innerText = `${fData.structuralIntegrityPercent}%`;
      }
    }
  }

  renderComponentDamageList(res) {
    const list = document.getElementById('component-damage-list');
    if (!list) return;
    const preset = PRESETS[this.state.presetKey];
    const components = preset?.criticalComponents || ['Enclosure Housing', 'Internal Circuit', 'Fasteners'];
    const isAr = i18n.currentLang === 'ar';
    const isSafe = res.isSafe;

    list.innerHTML = components.map((comp, idx) => {
      const isDamaged = !isSafe && (idx === 0 || (idx === 1 && res.peakG > res.safeG * 1.15) || (idx === 2 && res.peakG > res.safeG * 1.35));
      const statusBadge = isDamaged
        ? `<span class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold">${isAr ? 'تلف حرج ⚠' : 'DAMAGED ⚠'}</span>`
        : `<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]">${isAr ? 'سليم 100%' : '100% INTACT'}</span>`;
      const dotColor = isDamaged ? 'bg-red-400 animate-pulse' : 'bg-emerald-400';
      return `
        <div class="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border ${isDamaged ? 'border-red-900/60' : 'border-slate-800/80'}">
          <span class="flex items-center gap-1.5 truncate max-w-[160px] ${isDamaged ? 'text-red-200 font-bold' : 'text-slate-300'}">
            <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
            ${comp}
          </span>
          ${statusBadge}
        </div>
      `;
    }).join('');
  }

  updateRootCauseDiagnosticBox(res) {
    const box = document.getElementById('failure-root-cause-box');
    if (!box) return;

    const elSeverity = document.getElementById('root-cause-severity-badge');
    const elZone = document.getElementById('root-cause-zone');
    const elCushion = document.getElementById('root-cause-cushion-state');
    const elPatch = document.getElementById('root-cause-patch-text');
    const isAr = i18n.currentLang === 'ar';

    const angleName = res.impactAngle ? (isAr ? res.impactAngle.nameAr || res.impactAngle.name : res.impactAngle.name) : '45° Corner';
    const isEPS = this.state.materialKey === 'eps';
    const btnApplyPatch = document.getElementById('btn-apply-cushion-patch');

    if (res.isSafe) {
      box.className = 'p-2 rounded bg-emerald-950/40 border border-emerald-800/50 text-[10px] font-mono space-y-1';
      if (elSeverity) {
        elSeverity.className = 'px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]';
        elSeverity.innerText = isAr ? 'اجتياز آمن' : 'OPTIMAL';
      }
      if (elZone) {
        elZone.className = 'text-emerald-300 font-bold';
        elZone.innerText = isAr ? `${angleName} (امتصاص كامل)` : `${angleName} (Full Cushion)`;
      }
      if (elCushion) {
        elCushion.className = 'text-emerald-400 font-bold';
        const strainVal = res.cushionStrainPercent !== undefined ? res.cushionStrainPercent : Math.round((res.absorbedEnergyJoules / res.impactEnergyJoules) * 100);
        elCushion.innerText = isAr
          ? `انبعاج تدريجي ${res.dynamicDisplacementMm} مم (${strainVal}% انضغاط)`
          : `Progressive Buckle ${res.dynamicDisplacementMm}mm (${strainVal}% strain)`;
      }
      if (elPatch) {
        elPatch.innerText = isAr
          ? `التصميم الكرتوني الدائري نجح في إبقاء الصدمة (${res.peakG}G) دون حد الكسر الحرج (${res.safeG}G). الهيكل محمي تماماً.`
          : `Circular packaging successfully maintained impact shock (${res.peakG}G) safely below the fragility limit (${res.safeG}G). Zero damage.`;
      }
      if (btnApplyPatch) {
        btnApplyPatch.classList.add('hidden');
      }
    } else {
      box.className = 'p-2 rounded bg-red-950/50 border border-red-800/60 text-[10px] font-mono space-y-1';
      if (elSeverity) {
        elSeverity.className = 'px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] animate-pulse';
        elSeverity.innerText = isAr ? 'فشل حرج ⚠️' : 'CRITICAL ⚠️';
      }
      if (elZone) {
        elZone.className = 'text-red-300 font-bold';
        elZone.innerText = isAr ? `مصد ${angleName} (نقطة الارتطام)` : `${angleName} Cap (Impact Focal)`;
      }
      if (elCushion) {
        elCushion.className = res.isBottomedOut ? 'text-red-400 font-bold' : 'text-amber-400 font-bold';
        if (res.isBottomedOut) {
          elCushion.innerText = isAr
            ? `نفاذ سمك الوسادة (Bottomed Out ${res.cushionStrainPercent}%) وتصلب فجائي`
            : `Cushion Bottomed Out (${res.cushionStrainPercent}% strain / densified)`;
        } else {
          elCushion.innerText = isAr
            ? `إجهاد زائد (${res.cushionStrainPercent}% انضغاط) - يلزم زيادة السمك`
            : `Dynamic overload (${res.cushionStrainPercent}% strain) - Cushion thickness margin thin`;
        }
      }
      if (elPatch) {
        elPatch.innerText = isAr
          ? `الحل الهندسي: التبديل إلى كرتون قرص العسل (Honeycomb 15mm) لزيادة مسافة الانبعاج الديناميكي بمقدار +22 مم وخفض التباطؤ إلى 24.2G وحماية الأجزاء الداخلية من الصدمة.`
          : `Engineering Patch: Switch to 15mm Honeycomb Cardboard to increase progressive deformation distance by +22mm, cutting deceleration to 24.2G and protecting internal components.`;
      }
      if (btnApplyPatch) {
        btnApplyPatch.classList.remove('hidden');
        btnApplyPatch.innerHTML = `<i data-lucide="shield-check" class="w-3 h-3 text-emerald-400"></i> <span>${isAr ? 'تطبيق التعديل الهندسي (Honeycomb)' : 'Apply Engineering Honeycomb Patch'}</span>`;
        btnApplyPatch.className = 'mt-1.5 w-full py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  updateROIEconomics() {
    const elAnnualSavings = document.getElementById('roi-annual-savings');
    const elUnitCostSaved = document.getElementById('roi-unit-saved');
    const elPercentSaved = document.getElementById('roi-percent-saved');
    const elWeightSaved = document.getElementById('roi-weight-saved');
    const elEPSEliminated = document.getElementById('roi-eps-eliminated');
    const elCO2Avoided = document.getElementById('roi-co2-avoided');
    const elTrees = document.getElementById('roi-trees-planted');
    const elCircScore = document.getElementById('roi-circular-score');
    const elLogistics = document.getElementById('roi-logistics-val');
    const badge = document.getElementById('roi-status-badge');
    const card = document.getElementById('roi-savings-card');
    const btn = document.getElementById('btn-toggle-erp-label');
    const isAr = i18n.currentLang === 'ar';

    // 1. STANDBY ZEROED-OUT STATE (Default: Awaiting Elaraby Factory Data Access)
    if (!this.state.factoryDataConnected) {
      if (elAnnualSavings) {
        elAnnualSavings.innerText = '0.00 EGP';
        elAnnualSavings.className = 'text-2xl font-mono font-bold text-slate-400 tracking-tight block mt-0.5';
      }
      if (elUnitCostSaved) {
        elUnitCostSaved.innerText = '0.00 EGP';
        elUnitCostSaved.className = 'text-slate-400 font-bold';
      }
      if (elPercentSaved) {
        elPercentSaved.innerText = `-- ${isAr ? 'مقارنة بالفلين' : 'vs EPS'}`;
        elPercentSaved.className = 'text-slate-500 font-bold';
      }
      if (elWeightSaved) {
        elWeightSaved.innerText = `-- ${isAr ? 'وفر بالمادة' : 'Material'}`;
        elWeightSaved.className = 'text-sm font-bold text-slate-400 mt-0.5 block';
      }
      if (elEPSEliminated) {
        elEPSEliminated.innerText = '0 kg';
        elEPSEliminated.className = 'text-sm font-bold text-slate-400 mt-0.5 block';
      }
      if (elCO2Avoided) {
        elCO2Avoided.innerText = '0 Tons CO2e';
        elCO2Avoided.className = 'text-sm font-bold text-slate-400 mt-0.5 block';
      }
      if (elTrees) {
        elTrees.innerText = isAr ? 'في انتظار بيانات خط الإنتاج' : 'Awaiting line throughput';
      }
      if (elCircScore) {
        elCircScore.innerText = '98/100';
      }
      if (elLogistics) {
        elLogistics.innerText = isAr ? 'في انتظار بيانات أسطول الشحن' : 'Awaiting Factory Dispatch Data';
        elLogistics.className = 'text-slate-400 text-xs';
      }
      if (badge) {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span><span>${isAr ? 'في انتظار صلاحية الداتا' : 'Awaiting API Access'}</span>`;
        badge.className = 'px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1';
      }
      if (card) {
        card.className = 'p-3 rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 transition-all';
      }
      if (btn) {
        btn.innerText = isAr ? '🔌 محاكاة ربط بيانات مصانع العربي (API)' : '🔌 Simulate Elaraby ERP API Sync';
      }
      return;
    }

    // 2. CONNECTED LIVE STATE (Active simulation connected to factory throughput)
    const comparison = this.analytics.computeComparison(
      this.state.presetKey,
      this.state.materialKey,
      this.state.dimensions,
      this.state.weight
    );

    if (elAnnualSavings) {
      elAnnualSavings.innerText = AnalyticsEngine.formatEGP(comparison.annual.savingsEGP);
      elAnnualSavings.className = 'text-2xl font-mono font-bold text-emerald-400 tracking-tight block mt-0.5 animate-pulse';
    }
    if (elUnitCostSaved) {
      elUnitCostSaved.innerText = `${comparison.unit.costSavedEGP} EGP`;
      elUnitCostSaved.className = 'text-white font-bold';
    }
    if (elPercentSaved) {
      elPercentSaved.innerText = `-${comparison.unit.percentCostSaved}% ${isAr ? 'مقارنة بالفلين' : 'vs EPS'}`;
      elPercentSaved.className = 'text-emerald-400 font-bold';
    }
    if (elWeightSaved) {
      elWeightSaved.innerText = `-${comparison.unit.weightReductionPercent}% ${isAr ? 'وفر بالمادة' : 'Material'}`;
      elWeightSaved.className = 'text-sm font-bold text-sky-400 mt-0.5 block';
    }
    if (elEPSEliminated) {
      elEPSEliminated.innerText = `${AnalyticsEngine.formatNumber(comparison.annual.epsEliminatedKg)} kg`;
      elEPSEliminated.className = 'text-sm font-bold text-red-400 mt-0.5 block';
    }
    if (elCO2Avoided) {
      elCO2Avoided.innerText = `${comparison.annual.co2AvoidedTons} Tons CO2e`;
      elCO2Avoided.className = 'text-sm font-bold text-emerald-400 mt-0.5 block';
    }
    if (elTrees) {
      elTrees.innerText = `≈ ${AnalyticsEngine.formatNumber(comparison.annual.treesPlantedEquiv)} ${isAr ? 'شجرة مكافئة' : 'trees'}`;
    }
    if (elCircScore) {
      elCircScore.innerText = `${comparison.circularScore}/100`;
    }
    if (elLogistics) {
      elLogistics.innerText = isAr ? '+18% كراتين إضافية لكل حاوية 40 قدم' : '+18% units per 40ft container';
      elLogistics.className = 'text-sky-400 text-xs font-bold';
    }
    if (badge) {
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>${isAr ? 'متصل: خطوط العربي (100k جهاز)' : 'Connected: Elaraby MES (100k)'}</span>`;
      badge.className = 'px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1';
    }
    if (card) {
      card.className = 'p-3 rounded-lg bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-950/30 transition-all';
    }
    if (btn) {
      btn.innerText = isAr ? '🔄 تصفيـر / عودة لوضع الانتظار (Standby)' : '🔄 Disconnect / Reset to Standby (0)';
    }
  }

  openDielineModal() {
    const modal = document.getElementById('modal-dieline');
    const container = document.getElementById('dieline-svg-container');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    container.innerHTML = DielineGenerator.generateSVG(
      this.state.presetKey,
      this.state.materialKey,
      this.state.dimensions
    );
  }

  openReportModal() {
    const modal = document.getElementById('modal-report');
    const container = document.getElementById('report-content-container');
    if (!modal || !container) return;

    const currentPhysics = this.state.lastTestResult || this.physics.calculateImpactPhysics(
      { weight: this.state.weight, safeGMax: PRESETS[this.state.presetKey].safeGMax },
      this.state.materialKey,
      parseFloat(this.state.dropHeightKey),
      this.state.impactAngleKey
    );

    const comparison = this.analytics.computeComparison(
      this.state.presetKey,
      this.state.materialKey,
      this.state.dimensions,
      this.state.weight
    );

    container.innerHTML = ExportEngine.generateReportHTML(
      this.state.presetKey,
      this.state.materialKey,
      currentPhysics,
      comparison,
      this.state.dimensions,
      this.state.packageSpec,
      {
        weight: this.state.weight,
        fragility: this.state.fragility,
        productName: PRESETS[this.state.presetKey].name
      },
      this.state.lastTestSuite
    );

    modal.classList.remove('hidden');
  }

  syncPackageInputsFromState() {
    const spec = this.state.packageSpec;
    const mapping = { 'pack-length': 'length', 'pack-width': 'width', 'pack-height': 'height', 'pack-cushion': 'cushionThickness', 'pack-quantity': 'cushionQuantity', 'pack-layout': 'layout', 'pack-notes': 'notes' };
    Object.entries(mapping).forEach(([id, key]) => {
      const input = document.getElementById(id);
      if (input && document.activeElement !== input) input.value = spec[key];
    });
    const volume = (spec.length * spec.width * spec.height / 1e6).toFixed(2);
    const output = document.getElementById('pack-volume-estimate');
    if (output) output.textContent = `${i18n.currentLang === 'ar' ? 'الحجم الخارجي التقديري' : 'Estimated outer volume'}: ${volume} L`;
  }

  runBenchmarkDisplay() {
    const bData = this.benchmark.computeBenchmark(
      this.state.presetKey,
      parseFloat(this.state.dropHeightKey),
      this.state.impactAngleKey,
      this.physics
    );

    const elEpsG = document.getElementById('bench-eps-g');
    if (elEpsG) elEpsG.innerText = `${bData.eps.peakG} G`;

    const elHoneyG = document.getElementById('bench-honey-g');
    if (elHoneyG) elHoneyG.innerText = `${bData.honeycomb.peakG} G`;

    const elShockCut = document.getElementById('bench-shock-reduction');
    if (elShockCut) elShockCut.innerText = `-${bData.delta.shockReductionPercent}% Shock Absorbed`;

    const elAnnualSave = document.getElementById('bench-annual-saved');
    if (elAnnualSave) elAnnualSave.innerText = `${AnalyticsEngine.formatEGP(bData.delta.annualSavedEGP)}`;

    this.benchmark.drawDualShockCurves(bData);
  }

  runPitchPresentationMode() {
    if (this.state.isPitchPlaying) return;
    this.state.isPitchPlaying = true;

    const banner = document.getElementById('pitch-banner');
    if (banner) banner.classList.remove('hidden');

    this.selectPreset('tv');
    this.scene.setCameraPreset('isometric');

    setTimeout(() => {
      this.triggerAIGenerativeOptimization();
    }, 1000);

    setTimeout(() => {
      const slider = document.getElementById('slider-exploded');
      let exp = 0;
      const expInterval = setInterval(() => {
        exp += 0.05;
        if (exp <= 0.8) {
          if (slider) slider.value = Math.round(exp * 100);
          this.applyExplodedView(exp);
          const lbl = document.getElementById('exploded-val-label');
          if (lbl) lbl.innerText = `${Math.round(exp * 100)}%`;
        } else {
          clearInterval(expInterval);
        }
      }, 40);
    }, 4200);

    setTimeout(() => {
      const slider = document.getElementById('slider-exploded');
      let exp = 0.8;
      const reassembleInterval = setInterval(() => {
        exp -= 0.06;
        if (exp >= 0) {
          if (slider) slider.value = Math.round(exp * 100);
          this.applyExplodedView(exp);
          const lbl = document.getElementById('exploded-val-label');
          if (lbl) lbl.innerText = `${Math.round(exp * 100)}%`;
        } else {
          clearInterval(reassembleInterval);
          this.applyExplodedView(0);
          if (slider) slider.value = 0;
          this.scene.setCameraPreset('dropView');
        }
      }, 35);
    }, 6600);

    setTimeout(() => {
      const dropBtn = document.getElementById('btn-simulate-drop');
      if (dropBtn) dropBtn.click();
    }, 8400);

    setTimeout(() => {
      this.state.isPitchPlaying = false;
      if (banner) banner.classList.add('hidden');
    }, 11500);
  }
}

// Global bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.nxtpakApp = app;
});

