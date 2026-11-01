// NXTPAK Studio - Configuration & Data Specifications
// For Elaraby Group, DMZ Cairo & Photon X Hackathon

export const PRESETS = {
  tv: {
    id: 'tv',
    name: 'Tornado 55" 4K Smart TV',
    brand: 'TORNADO by Elaraby',
    model: '55US9500E',
    category: 'Consumer Electronics / Displays',
    dimensions: { length: 1230, width: 80, height: 710 }, // mm
    weight: 14.5, // kg
    fragility: 8.5, // 1-10 fragility index
    safeGMax: 30.0, // Maximum safe deceleration (G-force)
    criticalComponents: ['OLED Display Substrate', 'COF Driver ICs', 'Edge-lit LED Bar'],
    accentColor: '#38bdf8', // Cyan
    defaultProductMaterial: 'tempered_glass',
    epsBaseline: {
      volumeLiters: 48.2,
      weightKg: 1.45,
      costEGP: 85.0,
      co2Kg: 5.8
    }
  },
  microwave: {
    id: 'microwave',
    name: 'Sharp Inverter Microwave 34L',
    brand: 'SHARP by Elaraby',
    model: 'R-770AR-ST',
    category: 'Home Appliances / Kitchen',
    dimensions: { length: 520, width: 410, height: 310 }, // mm
    weight: 16.0, // kg (heavy magnetron offset)
    fragility: 6.8,
    safeGMax: 40.0,
    criticalComponents: ['High-Voltage Magnetron', 'Inverter PCB Board', 'Glass Turntable'],
    accentColor: '#fbbf24', // Amber
    defaultProductMaterial: 'stainless_steel',
    epsBaseline: {
      volumeLiters: 38.6,
      weightKg: 1.25,
      costEGP: 68.0,
      co2Kg: 5.0
    }
  },
  blender: {
    id: 'blender',
    name: 'Tornado Stand Blender 1.5L',
    brand: 'TORNADO by Elaraby',
    model: 'TB-600/2',
    category: 'Small Domestic Appliances',
    dimensions: { length: 220, width: 200, height: 430 }, // mm
    weight: 4.2, // kg
    fragility: 7.2,
    safeGMax: 35.0,
    criticalComponents: ['Borosilicate Glass Jar', 'Motor Drive Coupling', 'Titanium Blade Assembly'],
    accentColor: '#34d399', // Emerald
    defaultProductMaterial: 'abs_polymer',
    epsBaseline: {
      volumeLiters: 18.4,
      weightKg: 0.65,
      costEGP: 38.0,
      co2Kg: 2.6
    }
  },
  custom: {
    id: 'custom',
    name: 'Custom Elaraby Prototype',
    brand: 'Elaraby R&D Center',
    model: 'GEN-PROTO-2026',
    category: 'Custom Industrial Enclosure',
    dimensions: { length: 600, width: 400, height: 400 },
    weight: 10.0,
    fragility: 6.0,
    safeGMax: 35.0,
    criticalComponents: ['Structural Enclosure', 'Internal Electronics'],
    accentColor: '#a855f7', // Purple
    defaultProductMaterial: 'sheet_metal_steel',
    epsBaseline: {
      volumeLiters: 30.0,
      weightKg: 1.0,
      costEGP: 55.0,
      co2Kg: 4.0
    }
  }
};

export const MATERIALS = {
  eps: {
    id: 'eps',
    name: 'Traditional EPS Styrofoam',
    tag: 'Baseline (Toxic Plastic)',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    type: 'plastic',
    density: 22, // kg/m3
    elasticModulus: 4.5, // MPa
    initialModulusMPa: 7.5,
    plateauStressKPa: 185, // ASTM D1596 dynamic crush plateau
    densificationStrain: 0.62, // Critical bottoming-out threshold (62% collapse)
    densificationExponent: 3.6, // Asymptotic spike hardening rate
    energyAbsorption: 0.62, // ratio
    dampingRatio: 0.12,
    recyclability: 0.05, // 5% recyclability rate in Egypt
    circularScore: 12, // / 100
    costPerKgEGP: 58.0,
    co2PerKg: 3.9, // kg CO2e per kg EPS
    color: 0xf3f4f6,
    roughness: 0.95,
    metalness: 0.05,
    textureType: 'eps',
    description: 'Expanded Polystyrene. Non-biodegradable (500+ years in Egyptian landfills), microplastic pollutant, banned in EU circular directives.'
  },
  honeycomb: {
    id: 'honeycomb',
    name: 'Generative Honeycomb Cardboard',
    tag: 'Recommended (Optimal Eco)',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    type: 'cardboard',
    density: 135, // kg/m3 structural
    elasticModulus: 18.5, // MPa
    initialModulusMPa: 18.5,
    plateauStressKPa: 290, // Progressive buckling yield plateau (290 kPa)
    densificationStrain: 0.82, // High progressive travel before densification
    densificationExponent: 2.8,
    energyAbsorption: 0.88, // Superior progressive crush absorption
    dampingRatio: 0.38,
    recyclability: 1.0, // 100% repulpable in Egyptian paper mills
    circularScore: 98,
    costPerKgEGP: 26.5,
    co2PerKg: 0.65, // kg CO2e per kg recycled kraft
    color: 0xc89d6c,
    roughness: 0.82,
    metalness: 0.02,
    textureType: 'honeycomb',
    description: '15mm hexagonal kraft paperboard cells. Progressive progressive buckling delivers military-grade drop cushion with 35% less material mass.'
  },
  origami: {
    id: 'origami',
    name: 'Origami Folded Corrugated Flute',
    tag: 'Ultra-Lightweight',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    type: 'cardboard',
    density: 120,
    elasticModulus: 16.0,
    initialModulusMPa: 16.0,
    plateauStressKPa: 230,
    densificationStrain: 0.78,
    densificationExponent: 2.6,
    energyAbsorption: 0.82,
    dampingRatio: 0.34,
    recyclability: 1.0,
    circularScore: 96,
    costPerKgEGP: 24.0,
    co2PerKg: 0.60,
    color: 0xba915f,
    roughness: 0.85,
    metalness: 0.02,
    textureType: 'origami',
    description: 'Miura-ori inspired 3D faceted folded structure. Zero-glue interlocking tabs eliminate adhesive chemical emissions.'
  },
  pulp: {
    id: 'pulp',
    name: 'Molded Agricultural Pulp (Rice Straw)',
    tag: 'Local Circular Economy',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    type: 'cardboard',
    density: 145,
    elasticModulus: 14.0,
    initialModulusMPa: 14.0,
    plateauStressKPa: 260,
    densificationStrain: 0.74,
    densificationExponent: 2.9,
    energyAbsorption: 0.84,
    dampingRatio: 0.36,
    recyclability: 1.0,
    circularScore: 99,
    costPerKgEGP: 22.0,
    co2PerKg: 0.45, // Carbon negative potential from Egyptian rice straw valorization
    color: 0xb59975,
    roughness: 0.90,
    metalness: 0.01,
    textureType: 'pulp',
    description: 'Manufactured by upcycling Delta Nile rice straw fiber. Solves Egypt seasonal black cloud air pollution while creating protective packaging.'
  }
};

export const DROP_STANDARDS = {
  '0.5': {
    heightM: 0.5,
    heightLabel: '0.5 Meter (20")',
    name: 'Standard Handling (ISTA-1A Standard)',
    description: 'Conveyor belt drop & warehouse gentle handling.'
  },
  '1.0': {
    heightM: 1.0,
    heightLabel: '1.0 Meter (39")',
    name: 'Severe Transit Drop (Elaraby Factory Spec)',
    description: 'Tailgate unloader drop, typical Egyptian logistics road transit shock.'
  },
  '1.5': {
    heightM: 1.5,
    heightLabel: '1.5 Meter (59")',
    name: 'Extreme Stress Test (ASTM D5276)',
    description: 'High warehouse rack fall / severe mishandling verification.'
  }
};

export const IMPACT_ANGLES = {
  flat: {
    id: 'flat',
    name: 'Flat Bottom Drop',
    desc: 'Even impact over full bottom buffer area',
    rotX: 0,
    rotZ: 0,
    stressConcentrationFactor: 1.0
  },
  corner: {
    id: 'corner',
    name: '45° Critical Corner Drop',
    desc: 'Worst-case ISTA impact focused on single corner buffer cap',
    rotX: Math.PI / 6,
    rotZ: Math.PI / 4,
    stressConcentrationFactor: 2.45
  },
  edge: {
    id: 'edge',
    name: 'Longitudinal Edge Drop',
    desc: 'Impact distributed along packaging side edge rib',
    rotX: Math.PI / 4,
    rotZ: 0,
    stressConcentrationFactor: 1.65
  }
};

// Comprehensive Catalog of Appliance Enclosure Materials for Elaraby Group Products
export const PRODUCT_MATERIALS = {
  sheet_metal_steel: {
    id: 'sheet_metal_steel',
    name: 'Cold-Rolled Sheet Steel (0.8mm)',
    nameAr: 'صاج صلب مدرفل على البارد (0.8 مم)',
    icon: '⚙️',
    category: 'metal',
    categoryAr: 'معادن وصاج',
    typicalUsage: 'Washing Machines, Refrigerators, Cookers',
    typicalUsageAr: 'غسالات، ثلاجات، بوتاجازات العربي',
    yieldStrengthMPa: 250,
    elasticModulusGPa: 200,
    densityKgM3: 7850,
    brittlenessIndex: 0.15,
    failureMode: 'denting',
    failureModeName: 'Plastic Denting & Buckling',
    failureModeNameAr: 'تشوه دائم وانبعاج في الصاج',
    safeGModifier: 1.0,
    color: 0xf1f5f9,
    roughness: 0.38,
    metalness: 0.55,
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  stainless_steel: {
    id: 'stainless_steel',
    name: 'Brushed Stainless Steel (AISI 304)',
    nameAr: 'ستانلس ستيل مصقول (AISI 304)',
    icon: '✨',
    category: 'metal',
    categoryAr: 'معادن وصاج',
    typicalUsage: 'Microwaves, Premium Dishwashers',
    typicalUsageAr: 'ميكروويف، أفران، غسالات أطباق شارب',
    yieldStrengthMPa: 290,
    elasticModulusGPa: 193,
    densityKgM3: 8000,
    brittlenessIndex: 0.12,
    failureMode: 'denting',
    failureModeName: 'Surface Denting & Scuffing',
    failureModeNameAr: 'انبعاج سطحي وخدوش بالمعدن',
    safeGModifier: 1.1,
    color: 0xd1d5db,
    roughness: 0.25,
    metalness: 0.85,
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  },
  abs_polymer: {
    id: 'abs_polymer',
    name: 'High-Impact ABS Plastic',
    nameAr: 'بلاستيك ABS فائق مقاومة الصدمات',
    icon: '🛡️',
    category: 'plastic',
    categoryAr: 'بوليمرات وبلاستيك هندسي',
    typicalUsage: 'Stand Blenders, Vacuum Cleaners, Tornado Fans',
    typicalUsageAr: 'خلاطات تورنيدو، مكانس، أغطية المراوح',
    yieldStrengthMPa: 45,
    elasticModulusGPa: 2.3,
    densityKgM3: 1050,
    brittlenessIndex: 0.55,
    failureMode: 'cracking',
    failureModeName: 'Structural Crazing & Seam Fracture',
    failureModeNameAr: 'شروخ إجهادية وانفصال الفواصل',
    safeGModifier: 0.9,
    color: 0x38bdf8,
    roughness: 0.42,
    metalness: 0.05,
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  polycarbonate: {
    id: 'polycarbonate',
    name: 'Reinforced Polycarbonate (PC)',
    nameAr: 'بولي كربونات مقوى (PC)',
    icon: '💎',
    category: 'plastic',
    categoryAr: 'بوليمرات وبلاستيك هندسي',
    typicalUsage: 'Blender Jars, Kettles, Transparent Covers',
    typicalUsageAr: 'أوعية الخلاط، غلايات، أغطية شفافة',
    yieldStrengthMPa: 65,
    elasticModulusGPa: 2.4,
    densityKgM3: 1200,
    brittlenessIndex: 0.40,
    failureMode: 'cracking',
    failureModeName: 'Impact Crazing & Latch Snapping',
    failureModeNameAr: 'تشقق بالصدمات وكسر كلبسات التثبيت',
    safeGModifier: 0.95,
    color: 0x67e8f9,
    roughness: 0.15,
    metalness: 0.1,
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  tempered_glass: {
    id: 'tempered_glass',
    name: 'Tempered Glass & OLED Panel',
    nameAr: 'زجاج حراري مقسى وشاشات OLED',
    icon: '📺',
    category: 'glass',
    categoryAr: 'زجاج وبصريات',
    typicalUsage: 'Tornado 55" TV Screens, Microwave Doors',
    typicalUsageAr: 'واجهات شاشات تورنيدو، أبواب الميكروويف',
    yieldStrengthMPa: 120,
    elasticModulusGPa: 70,
    densityKgM3: 2500,
    brittlenessIndex: 0.95,
    failureMode: 'shattering',
    failureModeName: 'Spiderweb Shatter & Micro-Spallation',
    failureModeNameAr: 'تهشم عنكبوتي وتطاير شظايا زجاجية',
    safeGModifier: 0.8,
    color: 0x0f172a,
    roughness: 0.05,
    metalness: 0.9,
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  die_cast_aluminum: {
    id: 'die_cast_aluminum',
    name: 'Die-Cast Aluminum Alloy (A380)',
    nameAr: 'سبيكة ألومنيوم مصبوبة (A380)',
    icon: '🔩',
    category: 'metal',
    categoryAr: 'معادن وصاج',
    typicalUsage: 'AC Compressor Frames, Heavy Motor Mounts',
    typicalUsageAr: 'شاسيهات كباسات تكييف شارب، كراسي المواتير',
    yieldStrengthMPa: 160,
    elasticModulusGPa: 71,
    densityKgM3: 2700,
    brittlenessIndex: 0.35,
    failureMode: 'bending',
    failureModeName: 'Mounting Ear Shear & Plastic Bending',
    failureModeNameAr: 'قص أذن التثبيت وانحناء لدن',
    safeGModifier: 1.15,
    color: 0x94a3b8,
    roughness: 0.45,
    metalness: 0.75,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  polypropylene: {
    id: 'polypropylene',
    name: 'Structural Polypropylene (PP)',
    nameAr: 'بولي بروبيلين بوليمري مرن (PP)',
    icon: '📦',
    category: 'plastic',
    categoryAr: 'بوليمرات وبلاستيك هندسي',
    typicalUsage: 'Washing Machine Outer Tub, Base Trays',
    typicalUsageAr: 'حلة الغسالة الخارجية، قيعان الأجهزة',
    yieldStrengthMPa: 32,
    elasticModulusGPa: 1.5,
    densityKgM3: 910,
    brittlenessIndex: 0.20,
    failureMode: 'denting',
    failureModeName: 'Creep Buckling & Ductile Yield',
    failureModeNameAr: 'انبعاج لدن مرن بدون شروخ',
    safeGModifier: 1.2,
    color: 0xe2e8f0,
    roughness: 0.55,
    metalness: 0.02,
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  }
};
