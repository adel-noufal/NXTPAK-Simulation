// NXTPAK Studio - Bilingual Internationalization Engine (English & Arabic)
// Engineered for Elaraby Group Factory Engineers & Hackathon Judges (DMZ Cairo / Photon X)

export const TRANSLATIONS = {
  en: {
    // Header
    appTitle: 'NXTPAK',
    appTitleSuffix: 'STUDIO',
    appSub: 'Generative AI & 3D Digital Twin • Circular Structural Packaging',
    badgePartners: 'Co-Engineered for:',
    pitchDemo: 'Pitch Demo',
    presentationBtn: 'Pitch Deck & BMC',
    pitchBanner: 'LIVE PITCH DEMO RUNNING: Automated Generative AI & ISTA-1A Drop Simulation',
    dielineBtn: '2D CAD Dieline',
    arBtn: 'AR / Factory Floor',
    reportBtn: 'Export Report',
    cadExportBtn: 'Export 3D CAD',
    compareBtn: 'A/B Benchmark',
    uploadBtn: 'Upload 3D Model',
    langToggle: 'العربية',

    // Left Sidebar
    presetsTitle: 'Elaraby Appliance Presets',
    presetsCatalog: 'Factory Catalog',
    presetTV: '📺 Tornado 55" 4K Smart TV (14.5 kg)',
    presetMicrowave: '📻 Sharp Inverter Microwave 34L (16.0 kg)',
    presetBlender: '🌪️ Tornado Stand Blender 1.5L (4.2 kg)',
    presetCustom: '⚙️ Custom / Uploaded 3D Model',

    specsTitle: 'Physical Specifications',
    specsSub: 'CAD Dimensions',
    dimLength: 'Length (X):',
    dimWidth: 'Width / Depth (Z):',
    dimHeight: 'Height (Y):',
    dimWeight: 'Appliance Mass:',
    dimFragility: 'Fragility Index:',
    fragileRugged: 'Rugged (50G)',
    fragileOLED: 'Ultra-Fragile OLED (25G)',

    // Product Enclosure Material
    productMaterialTitle: 'Product Enclosure Material',
    productMaterialSub: 'Sheet Metal & Polymers',
    prodMatYield: 'Yield Strength:',
    prodMatFailure: 'Failure Mode:',
    prodMatUsage: 'Typical Appliance:',
    enclosureDamageLabel: 'Enclosure Failure:',
    compDamageTitle: 'Component Damage Breakdown:',
    togglePinsBtn: '3D Callouts',
    rootCauseTitle: 'Impact Failure Origin & Root Cause',
    impactZoneLabel: 'Impact Zone:',
    cushionFailLabel: 'Cushion State:',
    engineeringFixLabel: 'Engineering Patch / Fix:',
    applyPatchBtn: 'Apply Engineering Honeycomb Patch',

    materialTitle: 'Packaging Material',
    materialSub: 'Circular vs EPS',
    matHoneycomb: 'Honeycomb Cardboard',
    matHoneycombTag: 'Optimal',
    matHoneycombDesc: '15mm hexagonal kraft paperboard cells. 35% less mass, 100% recyclable in Egypt.',
    matOrigami: 'Origami Folded Flute',
    matOrigamiTag: 'Ultra-Light',
    matOrigamiDesc: 'Miura-ori 3D folded geometry. Zero-glue interlocking tabs.',
    matPulp: 'Molded Rice Straw Pulp',
    matPulpTag: 'Nile Delta',
    matPulpDesc: 'Upcycled Egyptian agricultural straw fibers. Solves local seasonal pollution.',
    matEPS: 'EPS Styrofoam',
    matEPSTag: 'Baseline (Toxic)',
    matEPSDesc: 'Expanded Polystyrene. Non-biodegradable (500 yrs in Egyptian landfills).',

    runAIBtn: 'Run AI Generative Design',
    runAISub: 'Synthesizes FEA Origami Topology & Cushion Lattice',

    // Center Viewport HUD
    camISO: 'ISO',
    camFront: 'FRONT',
    camTop: 'TOP',
    camSide: 'SIDE',
    camDrop: 'DROP',
    toggleWireframe: 'Toggle Structural Wireframe',
    toggleHeatmap: 'Toggle FEA Stress Heatmap',
    toggleCalipers: 'Toggle 3D Calipers',
    viewSolidBtn: 'Box Only',
    viewSolidTitle: 'Solid Sealed Box (Opaque Carton)',
    viewXrayBtn: 'X-Ray (Inside)',
    viewXrayTitle: 'See Product & Buffers Inside Box',
    viewProductBtn: 'Product Only',
    viewProductTitle: 'Product & Cushion Buffers Only (Hide Box)',
    explodeLabel: 'Explode:',

    // Drop Simulation Dock
    dropTitle: 'Physical Drop-Test Simulation Engine',
    dropStandard: 'ASTM D5276 / ISTA-1A',
    dropHeight: 'Height:',
    dropAngle: 'Angle:',
    angleFlat: 'Flat',
    angleCorner: '45° Corner',
    angleEdge: 'Edge',
    simulateDropBtn: 'Simulate Drop',
    destructiveDropBtn: '🔨 Destructive Drop (2.0m)',
    damageInspectorTitle: 'Damage & Fracture Inspector',
    integrityLabel: 'Structural Integrity:',
    debrisLabel: 'Fracture Debris:',
    crackScrubLabel: 'Scrub Crack Evolution:',
    resetDebrisBtn: 'Reset Shards',
    simSpeed: 'Speed:',
    speedRealtime: '1.0x Realtime',
    speedSlowMo: '0.25x Slow-Mo',
    speedUltraSlow: '0.1x Ultra-Slow',
    speedPhantom: '0.05x Phantom',
    camCinematic: 'Impact Cam',
    timelineTitle: 'LS-DYNA Impact Timeline:',
    stageApex: '0ms Apex',
    stageFreefall: '220ms Fall',
    stagePeakG: '280ms Crush',
    stageSlapDown: '340ms Slap',
    stageSettle: '500ms Rest',
    analogGaugeTitle: 'Dynamic Accelerometer',
    replayBtn: 'Replay Impact',

    // Right Sidebar: Telemetry
    telemetryTitle: 'Engineering Telemetry',
    telemetrySub: 'Live FEA Model',
    profileTitle: 'Dual-Trace Deceleration Profile',
    profileSub: 'G & Energy (J) vs Time (ms)',
    peakForceLabel: 'Peak Impact Force:',
    fragilityLimit: 'Limit:',
    compressionLabel: 'Buffer Compression:',
    crushType: 'Progressive Crush',
    energyLabel: 'Energy Dissipated:',
    energyAbsorbed: 'absorbed',
    statusSafe: 'PASSED — APPLIANCE SAFE (ISTA-1A)',
    statusCritical: 'CRITICAL IMPACT — STRESS EXCEEDED',

    // ROI & Circular Economy
    roiTitle: 'Elaraby Factory ROI & ESG',
    roiRunLabel: '100k Units/Yr (Quesna & Benha)',
    annualSavingsLabel: 'Projected Annual Cost Saved:',
    unitSavedLabel: 'Per Unit Saved:',
    vsEPS: 'vs EPS',
    massReductionLabel: 'Material Mass:',
    lessFuel: 'Less shipping fuel',
    plasticCutLabel: 'Plastic EPS Cut:',
    zeroLandfill: 'Zero toxic landfill',
    co2OffsetLabel: 'CO2 Offset:',
    treesEquiv: 'trees',
    circScoreLabel: 'Circularity Index:',
    repulpable: '100% Repulpable',
    logisticsLabel: 'Logistics Fleet Boost:',
    logisticsDesc: '+18% units per 40ft container',
    regulatoryTitle: 'Egyptian & EU Regulatory Alignment',
    reg1: '• Meets EU Packaging & Packaging Waste Directive (PPWR 2025).',
    reg2: '• Compatible with Quesna & Benha Elaraby automated packing lines.',

    // Upload Modal
    uploadModalTitle: 'Ingest 3D CAD Appliance Model (OBJ / STL / GLTF)',
    uploadDropzoneTitle: 'Drag & Drop your 3D CAD Model Here',
    uploadDropzoneSub: 'Supports .OBJ, .STL, .GLTF, .GLB from SolidWorks, Inventor, Rhino, Blender',
    browseFilesBtn: 'Browse Local CAD Files',
    sampleModelsTitle: 'Or Load Elaraby R&D Sample Appliances:',
    sampleWasher: 'Tornado Washing Machine 8kg (TWF-0800)',
    sampleAC: 'Sharp Inverter AC Outdoor Unit (AY-XP18UHE)',
    downloadSamplesBtn: 'Download Sample CAD Bundle (.ZIP)',
    uploadMassLabel: 'Project Mass (Appliance Weight):',
    uploadMassHelp: 'Enter product mass or leave blank for volume estimation',
    uploadFragilityLabel: 'Fragility Class (Tolerance):',
    uploadFragilityHelp: 'Critical G-Force threshold',

    // Modals
    aiModalTitle: 'NXTPAK AI Generative Topology Optimization Kernel',
    aiModalFooter: 'Processing Finite Element Stress Concentration & Origami Nodes',
    aiModalLocation: 'Elaraby R&D Complex',

    dielineModalTitle: '2D Unfolded Cut & Crease Dieline (Zünd / Kongsberg CNC Spec)',
    exportDxfSvg: 'Export SVG / DXF',

    arModalTitle: 'Augmented Reality & Factory Floor Inspection',
    arModalSub: 'Inspect 1:1 Scale Digital Twin on Elaraby Assembly Line',
    scanQRText: 'Scan with smartphone camera to view 1:1 scale 3D package in AR:',
    arSimulateBtn: 'Toggle Simulated Factory Conveyor Environment',

    compareModalTitle: 'Live A/B Impact Benchmark: Toxic EPS vs. NXTPAK Honeycomb Cardboard',
    epsFailureAlert: 'EPS Styrofoam experiences brittle fracture & transmits 54.8G destructive shock.',
    honeycombSuccessAlert: 'NXTPAK Honeycomb undergoes progressive cell buckling, dampening shock to 24.2G safe limit.',

    reportModalTitle: 'Product Test Report & Packaging Specification',
    printReportBtn: 'Print / Save PDF Specification',
    packSpecTitle: 'Carton & cushioning specification',
    runFullSuite: 'Run all package tests & create final report',
    packSpecHelp: 'Dimensions in mm. Included in the post-test report.',
    cushionThickness: 'Cushion thickness (mm)',
    cushionAmount: 'Cushion pieces',
    partitionLayout: 'Carton partition / layout',
    layoutTopTray: 'Top Accessory Tray (Remote, Cables & Manual)',
    layoutOpenCorners: '8 Corner Cushions + Open Cavity (Standard Clean)',
    layoutSideBay: 'Side Accessory Bay (Pedestal Stand & Brackets)',
    layoutEdgeRails: 'Perimeter Edge Protective Rails (Clamp & Strap Guard)',
    layoutBaseTray: 'Heavy-Duty Base Cushion Tray (Pallet & Forklift Guard)',
    roiAwaitingBadge: 'Awaiting API Access',
    connectFactoryBtn: '🔌 Simulate Elaraby ERP API Sync',
    erpSyncNote: 'Default: Standby (0) • Live sync upon Elaraby MES / SAP data clearance',
    roiAwaitingData: 'Awaiting line feed',
    logisticsStandby: 'Awaiting Factory Dispatch Data',
  },

  ar: {
    packSpecTitle: 'مواصفات الكرتونة ومواد الحماية',
    runFullSuite: 'شغّل كل اختبارات التغليف واطلع التقرير النهائي',
    packSpecHelp: 'أدخل الأبعاد بالملليمتر. ستظهر هذه البيانات في تقرير الاختبار.',
    cushionThickness: 'سمك مادة الحماية (مم)',
    cushionAmount: 'عدد قطع الحماية',
    partitionLayout: 'تصميم التوزيع وتقسيم الكرتونة الهندسية',
    layoutTopTray: 'صينية علوية للإكسسوارات والريموت والكابلات (Top Accessory Tray)',
    layoutOpenCorners: 'مصدات الأركان الثمانية + تجويف مفتوح (Standard 8-Corner)',
    layoutSideBay: 'مقصورة جانبية لقواعد التثبيت والملحقات (Side Accessory Bay)',
    layoutEdgeRails: 'قضبان حماية الحواف من أحزمة الربط والأوناش (Edge Rails)',
    layoutBaseTray: 'صينية وسادة القاعدة السفلية للشوك والمنصات (Base Skid Tray)',
    roiAwaitingBadge: 'في انتظار صلاحية الداتا',
    connectFactoryBtn: '🔌 محاكاة ربط بيانات مصانع العربي (API)',
    erpSyncNote: 'الوضع الافتراضي: متصفر (Standby) • يتم التحديث فور منح الصلاحية على أنظمة العربي',
    roiAwaitingData: 'في انتظار بيانات خط الإنتاج',
    logisticsStandby: 'في انتظار بيانات أسطول الشحن',
    // Header
    appTitle: 'نكست باك',
    appTitleSuffix: 'ستوديو',
    appSub: 'الذكاء الاصطناعي التوليدي والتوأم الرقمي ثلاثي الأبعاد • التغليف المستدام الدائري',
    badgePartners: 'تم التطوير بالشراكة مع:',
    pitchDemo: 'عرض التحكيم',
    presentationBtn: 'عرض التقديم و BMC',
    pitchBanner: 'جاري تشغيل العرض التقديمي الآلي للجنة التحكيم: التصميم التوليدي واختبار السقوط ISTA-1A',
    dielineBtn: 'مخطط القطع والطي 2D',
    arBtn: 'الواقع المعزز AR',
    reportBtn: 'تقرير هندسي',
    cadExportBtn: 'تصدير CAD 3D',
    compareBtn: 'مقارنة الفلين بالكرتون',
    uploadBtn: 'رفع نموذج 3D',
    langToggle: 'English',

    // Left Sidebar
    presetsTitle: 'أجهزة مجموعة العربي المعتمدة',
    presetsCatalog: 'كتالوج المصنع',
    presetTV: '📺 تلفزيون تورنيدو 55 بوصة ذكي 4K (14.5 كجم)',
    presetMicrowave: '📻 ميكروويف شارب إنفرتر 34 لتر (16.0 كجم)',
    presetBlender: '🌪️ خلاط تورنيدو ستاند 1.5 لتر (4.2 كجم)',
    presetCustom: '⚙️ نموذج مخصص / مستورد 3D',

    specsTitle: 'المواصفات الفيزيائية للجهاز',
    specsSub: 'أبعاد CAD الهندسية',
    dimLength: 'الطول (X):',
    dimWidth: 'العرض / العمق (Z):',
    dimHeight: 'الارتفاع (Y):',
    dimWeight: 'كتلة الجهاز:',
    dimFragility: 'مؤشر قابلية الكسر:',
    fragileRugged: 'متين (50G)',
    fragileOLED: 'شديد الحساسية OLED (25G)',

    // Product Enclosure Material
    productMaterialTitle: 'خامة غلاف وهيكل الجهاز',
    productMaterialSub: 'صاج وبوليمرات صناعية',
    prodMatYield: 'حد الخضوع (Yield):',
    prodMatFailure: 'نمط الانهيار الميكانيكي:',
    prodMatUsage: 'الأجهزة الشائعة بالعربي:',
    enclosureDamageLabel: 'حالة غلاف الجهاز:',
    compDamageTitle: 'تفصيل الأضرار بالمكونات:',
    togglePinsBtn: 'مؤشرات 3D',
    rootCauseTitle: 'تشخيص بؤرة الخلل وسبب الفشل',
    impactZoneLabel: 'منطقة الصدمة:',
    cushionFailLabel: 'حالة وسادة التغليف:',
    engineeringFixLabel: 'الحل الهندسي التعديلي المقترح:',
    applyPatchBtn: 'تطبيق التعديل الهندسي (Honeycomb)',

    materialTitle: 'مادة التغليف الوقائية',
    materialSub: 'الاقتصاد الدائري مقابل الفلين',
    matHoneycomb: 'كرتون قرص العسل المهندس',
    matHoneycombTag: 'الأمثل هندسياً',
    matHoneycombDesc: 'خلايا كرافت سداسية 15 مم. توفير 35% في الوزن، قابل لإعادة التدوير 100% بمصانع الورق المصرية.',
    matOrigami: 'كرتون الأوريجامي المطوي',
    matOrigamiTag: 'فائق الخفة',
    matOrigamiDesc: 'هندسة طي 3D مستوحاة من ميورا. ألسنة تعشيق ميكانيكية بدون غراء كيميائي.',
    matPulp: 'لب قش الأرز الزراعي المقولب',
    matPulpTag: 'دلتا النيل',
    matPulpDesc: 'ألياف زراعية معاد تدويرها محلياً. تحول أزمة السحابة السوداء بمصر إلى تغليف وقائي عالي المتانة.',
    matEPS: 'الفلين البلاستيكي التقليدي (EPS)',
    matEPSTag: 'الأساس الحالي (ملوث)',
    matEPSDesc: 'بوليستيرين ممدد سام. غير قابل للتحلل الحيوي (يستمر لأكثر من 500 عام في المقالب المصرية).',

    runAIBtn: '✨ تشغيل التصميم التوليدي بالذكاء الاصطناعي',
    runAISub: 'توليد طبولوجيا الطي الهندسي وشبكة امتصاص الصدمات',

    // Center Viewport HUD
    camISO: 'منظور',
    camFront: 'أمامي',
    camTop: 'علوي',
    camSide: 'جانبي',
    camDrop: 'السقوط',
    toggleWireframe: 'تبديل الشبكة الهيكلية Wireframe',
    toggleHeatmap: 'تبديل الخريطة الحرارية للإجهاد FEA',
    toggleCalipers: 'تبديل أبعاد القياس ثلاثية الأبعاد',
    viewSolidBtn: 'الكرتونة فقط',
    viewSolidTitle: 'الكرتونة مغلقة بالكامل (معتمة)',
    viewXrayBtn: 'المنتج بالداخل (X-Ray)',
    viewXrayTitle: 'رؤية المنتج ومصدات الحماية داخل الكرتونة',
    viewProductBtn: 'المنتج فقط',
    viewProductTitle: 'المنتج ومصدات الحماية فقط (إخفاء الكرتونة)',
    explodeLabel: 'تفكيك الأجزاء:',

    // Drop Simulation Dock
    dropTitle: 'محرك محاكاة السقوط الفيزيائي الديناميكي',
    dropStandard: 'المعيار الدولي ASTM D5276 / ISTA-1A',
    dropHeight: 'ارتفاع السقوط:',
    dropAngle: 'زاوية الاصطدام:',
    angleFlat: 'مسطح سفلي',
    angleCorner: '45° على الزاوية',
    angleEdge: 'على الحافة الطولية',
    simulateDropBtn: '💥 محاكاة السقوط',
    destructiveDropBtn: '🔨 اختبار الكسر والتدمير (2.0م)',
    damageInspectorTitle: 'مفتش الكسور والأضرار الهيكلية',
    integrityLabel: 'السلامة الهيكلية:',
    debrisLabel: 'الشظايا المتناثرة:',
    crackScrubLabel: 'فحص تطور الشروخ:',
    resetDebrisBtn: 'مسح الشظايا',
    simSpeed: 'سرعة العرض:',
    speedRealtime: '1.0x زمن حقيقي',
    speedSlowMo: '0.25x حركة بطيئة',
    speedUltraSlow: '0.1x تحليل فائق البطء',
    speedPhantom: '0.05x فائق البطء (1000 إطار)',
    camCinematic: 'كاميرا الصدمة',
    timelineTitle: 'المخطط الزمني للصدمة LS-DYNA:',
    stageApex: '0ms القمة',
    stageFreefall: '220ms سقوط',
    stagePeakG: '280ms ذروة الصدمة',
    stageSlapDown: '340ms ارتطام',
    stageSettle: '500ms استقرار',
    analogGaugeTitle: 'مقياس التسارع الديناميكي',
    replayBtn: 'إعادة الصدمة ⏪',

    // Right Sidebar: Telemetry
    telemetryTitle: 'القياسات الهندسية والتحليل الديناميكي',
    telemetrySub: 'نموذج العناصر المحدودة FEA المباشر',
    profileTitle: 'منحنى التباطؤ المزدوج والطاقة الممتصة',
    profileSub: 'قوة G والطاقة (جول) مقابل الزمن (ms)',
    peakForceLabel: 'أقصى قوة صدمة مسجلة:',
    fragilityLimit: 'حد الأمان للجهاز:',
    compressionLabel: 'انضغاط وتصادم الحواجز:',
    crushType: 'تشوه تدريجي ممتص للطاقة',
    energyLabel: 'الطاقة الممتصة بالكرتون:',
    energyAbsorbed: 'ممتصة بنجاح',
    statusSafe: 'ناجح — الجهاز في أمان تام (ISTA-1A)',
    statusCritical: 'خطر — تجاوز حد الإجهاد المسموح',

    // ROI & Circular Economy
    roiTitle: 'العائد المالي والاستدامة لمصانع العربي',
    roiRunLabel: 'تشغيلة 100 ألف جهاز سنويًا (قويسنا وبنها)',
    annualSavingsLabel: 'إجمالي الوفر المالي السنوي المتوقع:',
    unitSavedLabel: 'الوفر لكل كرتونة:',
    vsEPS: 'مقارنة بالفلين',
    massReductionLabel: 'تخفيض وزن المادة:',
    lessFuel: 'وفر في استهلاك وقود النقل',
    plasticCutLabel: 'بلاستيك فلين تم حذفه:',
    zeroLandfill: 'صفر نفايات سامة بالمدافن',
    co2OffsetLabel: 'خفض انبعاثات الكربون:',
    treesEquiv: 'شجرة مكافئة',
    circScoreLabel: 'مؤشر الاقتصاد الدائري:',
    repulpable: '100% قابل للتدوير بمصر',
    logisticsLabel: 'كفاءة أسطول النقل والشحن:',
    logisticsDesc: '+18% كراتين إضافية لكل حاوية 40 قدم',
    regulatoryTitle: 'التوافق مع الاشتراطات البيئية المصرية والأوروبية',
    reg1: '• متوافق مع توجيه الاتحاد الأوروبي الجديد للتغليف الأخضر (PPWR 2025).',
    reg2: '• جاهز للتطبيق على خطوط التعبئة بمجمعي قويسنا وبنها الصناعيين لمجموعة العربي.',

    // Upload Modal
    uploadModalTitle: 'استيراد نموذج 3D CAD لجهاز جديد (OBJ / STL / GLTF)',
    uploadDropzoneTitle: 'اسحب وأفلت ملف التصميم ثلاثي الأبعاد هنا',
    uploadDropzoneSub: 'يدعم صيغ .OBJ, .STL, .GLTF, .GLB من SolidWorks, Inventor, Rhino, Blender',
    browseFilesBtn: 'تصفح واختيار ملف من جهازك',
    sampleModelsTitle: 'أو قم بتحميل نماذج أجهزة جاهزة من بحوث وتطوير العربي:',
    sampleWasher: 'غسالة تورنيدو تحميل أمامي 8 كجم (TWF-0800)',
    sampleAC: 'وحدة تكييف شارب خارجية إنفرتر (AY-XP18UHE)',
    downloadSamplesBtn: 'تحميل حزمة ملفات الـ CAD التجريبية (.ZIP)',
    uploadMassLabel: 'كتلة ووزن المنتج الفعلي (Mass):',
    uploadMassHelp: 'أدخل الوزن بالكيلوجرام أو اتركه فارغاً للحساب التلقائي',
    uploadFragilityLabel: 'فئة الحساسية الميكانيكية:',
    uploadFragilityHelp: 'أقصى تسارع صدمة تتحمله البوردات والمكونات',

    // Modals
    aiModalTitle: 'نواة التحسين الطوبولوجي التوليدي الذكي NXTPAK AI',
    aiModalFooter: 'معالجة تركيزات الإجهاد الميكانيكي وعقد طي الأوريجامي',
    aiModalLocation: 'مجمع العربي للبحوث والتطوير (R&D)',

    dielineModalTitle: 'مخطط القطع والتجعيد ثنائي الأبعاد 2D (ماكينات القطع الرقمي Zünd / Kongsberg)',
    exportDxfSvg: 'تحميل ملف SVG / DXF للتصنيع',

    arModalTitle: 'معاينة الواقع المعزز AR في أرض المصنع',
    arModalSub: 'فحص التوأم الرقمي بمقياس رسم حقيقي 1:1 على خط تجميع العربي',
    scanQRText: 'امسح الرمز بكاميرا هاتفك المحمول لمعاينة الكرتونة بحجمها الحقيقي أمامك:',
    arSimulateBtn: 'تبديل بيئة سير التجميع الافتراضية في المصنع',

    compareModalTitle: 'مقارنة السقوط المباشرة A/B: الفلين الهش مقابل كرتون قرص العسل الذكي',
    epsFailureAlert: 'الفلين البلاستيكي يتعرض لكسر هش مباشر وينقل صدمة مدمرة بقوة 54.8G للجهاز!',
    honeycombSuccessAlert: 'كرتون قرص العسل ينهار تدريجيًا بامتصاص هيدروليكي آمن ويخفض الصدمة إلى 24.2G فقط.',

    reportModalTitle: 'تقرير اختبار المنتج ومواصفات التغليف',
    printReportBtn: 'طباعة / حفظ التقرير PDF'
  }
};

export class I18nManager {
  constructor(defaultLang = 'en') {
    this.currentLang = defaultLang;
  }

  setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.currentLang = lang;
    const isRTL = lang === 'ar';

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.body.classList.toggle('font-arabic', isRTL);

    this.applyTranslations();
  }

  toggleLanguage() {
    const nextLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  t(key) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  applyTranslations() {
    const dict = TRANSLATIONS[this.currentLang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerText = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.setAttribute('title', dict[key]);
      }
    });

    const btnToggle = document.getElementById('btn-toggle-lang');
    if (btnToggle) {
      btnToggle.innerText = this.t('langToggle');
    }
  }
}

export const i18n = new I18nManager('en');
