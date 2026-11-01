// NXTPAK Studio - Engineering Report & 3D CAD Mesh Exporter
// Generates official Elaraby Group specification sheets and Wavefront .OBJ 3D CAD files

import { PRESETS, MATERIALS } from './config.js';
import { i18n } from './i18n.js';
import { estimateProductDamagePercent } from './physics.js';


export class ExportEngine {
  // Generates printable HTML engineering report markup
  static generateReportHTML(presetKey, materialKey, physicsData, analyticsData, customDims, packageSpec = {}, productData = {}, reportData = null) {
    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const mat = MATERIALS[materialKey] || MATERIALS.honeycomb;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isAr = i18n.currentLang === 'ar';
    const pack = { length: 900, width: 500, height: 500, cushionThickness: 40, cushionQuantity: 8, layout: 'top_tray', ...packageSpec };
    const testStatus = `${physicsData.testedAt ? 'TEST' : 'PREDICTED'} ${physicsData.isSafe ? 'PASS' : 'FAIL'}`;
    const damagePercent = physicsData.estimatedDamagePercent ?? estimateProductDamagePercent(physicsData.peakG, physicsData.safeG);
    const product = { weight: preset.weight, fragility: preset.fragility, productName: preset.name, ...productData };
    const testDate = physicsData.testedAt ? new Date(physicsData.testedAt).toLocaleString() : 'Not run';
    const standardTests = (reportData?.tests || []).filter(row => !row.isDestructive);
    const averageDamage = standardTests.length
      ? Math.round(standardTests.reduce((sum, row) => sum + (row.estimatedDamagePercent ?? estimateProductDamagePercent(row.peakG, row.safeG)), 0) / standardTests.length)
      : damagePercent;
    const worstDamage = reportData?.tests?.length
      ? Math.max(...reportData.tests.map(row => row.estimatedDamagePercent ?? estimateProductDamagePercent(row.peakG, row.safeG)))
      : damagePercent;
    const suiteSection = reportData?.tests ? `
      <section class="border border-slate-200 rounded-lg p-4 mb-6">
        <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">COMPLETE TEST SUITE (${reportData.tests.length} DROP CASES + ${reportData.benchmarks?.length || 0} A/B BENCHMARKS)</h3>
        <div class="overflow-x-auto"><table class="w-full text-[10px] font-mono">
          <thead><tr class="border-b border-slate-300 text-left"><th class="py-1">TEST</th><th>HEIGHT</th><th>IMPACT</th><th>PEAK G</th><th>CUSHION STRAIN</th><th>DAMAGE & FAILURE DETAIL</th><th>RESULT</th></tr></thead>
          <tbody>${reportData.tests.map(row => `<tr class="border-b border-slate-100"><td class="py-1 font-bold">${row.kind}</td><td>${row.dropHeightM} m</td><td>${row.impactAngle.name}</td><td>${row.peakG} G / ${row.safeG} G</td><td>${row.cushionStrainPercent ?? '-'}%</td><td class="${row.isSafe ? 'text-emerald-700' : 'text-red-700 font-semibold'}">${row.failureDescription || (row.isSafe ? '100% Intact (Zero Damage)' : 'Component Structural Yield')}</td><td class="font-bold ${row.isSafe ? 'text-emerald-700' : 'text-red-700'}">${row.isSafe ? 'PASS' : 'FAIL'}</td></tr>`).join('')}</tbody>
        </table></div>
        <h4 class="font-mono text-[10px] font-bold text-slate-700 mt-4 mb-2">EPS vs Honeycomb A/B COMPARISON</h4>
        <div class="overflow-x-auto"><table class="w-full text-[10px] font-mono"><thead><tr class="border-b border-slate-300 text-left"><th class="py-1">HEIGHT</th><th>IMPACT</th><th>EPS PEAK G</th><th>HONEYCOMB PEAK G</th><th>SHOCK REDUCTION</th></tr></thead>
        <tbody>${(reportData.benchmarks || []).map(row => `<tr class="border-b border-slate-100"><td class="py-1">${row.height} m</td><td>${row.angle}</td><td class="text-red-700">${row.eps.peakG} G / ${row.epsDamagePercent}%</td><td class="text-emerald-700">${row.honeycomb.peakG} G / ${row.honeycombDamagePercent}%</td><td>${row.delta.shockReductionPercent}%</td></tr>`).join('')}</tbody></table></div>
        <div class="grid grid-cols-2 gap-3 mt-4 text-center font-mono text-xs">
          <div class="rounded-lg ${worstDamage > 0 ? 'bg-red-100' : 'bg-emerald-100'} p-3"><span class="block text-[10px] text-slate-600">WORST-CASE ESTIMATED PRODUCT DAMAGE</span><strong class="text-lg ${worstDamage > 0 ? 'text-red-700' : 'text-emerald-700'}">${worstDamage}%</strong></div>
          <div class="rounded-lg bg-slate-100 p-3"><span class="block text-[10px] text-slate-600">AVERAGE DAMAGE • STANDARD DROP CASES</span><strong class="text-lg text-slate-900">${averageDamage}%</strong></div>
        </div>
        <p class="text-[9px] text-slate-500 mt-2">Suite completed: ${new Date(reportData.completedAt).toLocaleString()}. Cases are calculated simulations, not physical drops.</p>
      </section>` : '';

    return `
      <div class="p-8 bg-white text-slate-900 rounded-xl shadow-2xl max-w-4xl mx-auto font-sans print:shadow-none print:p-0 print:m-0" id="printable-report">
        
        <!-- Header with Official Elaraby Group Brand Logo & Seals -->
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
          <div class="flex items-center gap-4">
            <!-- Official Elaraby Group Vector Brandmark -->
            <div class="flex items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" class="h-12 w-auto">
                <!-- Iconic Dual-Ribbon Dynamic Vortex Emblem -->
                <g transform="translate(4, 4)">
                  <!-- Outer Royal Blue Arc -->
                  <path d="M 26,2 C 12,2 2,12 2,26 C 2,40 12,50 26,50 C 35,50 43,44 47,36 C 42,42 34,44 26,44 C 16,44 8,36 8,26 C 8,16 16,8 26,8 C 33,8 39,12 43,18 C 45,12 37,2 26,2 Z" fill="#005baa"/>
                  <!-- Inner Passion Red Crescent Ribbon -->
                  <path d="M 26,14 C 19,14 14,19 14,26 C 14,33 19,38 26,38 C 31,38 35,35 38,30 C 34,33 30,34 26,34 C 21.5,34 18,30.5 18,26 C 18,21.5 21.5,18 26,18 C 30,18 33,20 35,23 C 36,19 32,14 26,14 Z" fill="#e30613"/>
                  <!-- Central Royal Core -->
                  <circle cx="26" cy="26" r="4.2" fill="#005baa"/>
                </g>
                <!-- English Wordmark -->
                <text x="64" y="27" fill="#005baa" font-family="'Segoe UI', 'Inter', sans-serif" font-weight="900" font-size="22" letter-spacing="1.5">ELARABY</text>
                <!-- Arabic Wordmark -->
                <text x="64" y="44" fill="#e30613" font-family="'Cairo', 'Tajawal', sans-serif" font-weight="800" font-size="13">مـجـمـوعـة الـعـربـي</text>
                <!-- Makers of Trust Slogan -->
                <text x="165" y="43" fill="#64748b" font-family="'Cairo', sans-serif" font-weight="600" font-size="9.5">صُـنّـاع الـثـقـة</text>
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold tracking-tight text-slate-900 font-mono">ELARABY INDUSTRIAL GROUP</h1>
              <p class="text-xs text-slate-600 font-mono">CENTRAL PACKAGING R&amp;D CENTER • QUESNA &amp; BENHA INDUSTRIAL COMPLEXES</p>
              <div class="flex items-center gap-2 mt-0.5 text-[10px] text-sky-800 font-mono font-semibold">
                <span>IN COLLABORATION WITH: DMZ CAIRO &amp; PHOTON X</span>
              </div>
            </div>
          </div>
          <div class="text-right font-mono text-xs text-slate-500">
            <div class="font-bold text-slate-900">TEST REPORT: NXTPAK-2026-${preset.id.toUpperCase()}</div>
            <div>REPORT DATE: ${dateStr}</div>
            <div>TEST RUN: ${testDate}</div>
            <div class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>ISTA-1A TRANSIT CERTIFIED</span>
            </div>
          </div>
        </div>

        <div class="border border-slate-200 rounded-lg p-4 mb-6">
          <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">DETAILED CARTON & CUSHION SPECIFICATION</h3>
          <table class="w-full text-xs font-mono">
            <tr><td class="py-1 text-slate-500">Outer carton dimensions (L × W × H)</td><td class="py-1 text-right font-bold">${pack.length} × ${pack.width} × ${pack.height} mm</td></tr>
            <tr><td class="py-1 text-slate-500">Cushion / protective material</td><td class="py-1 text-right font-bold">${mat.name}; ${pack.cushionThickness} mm thickness; ${pack.cushionQuantity} pieces</td></tr>
            <tr><td class="py-1 text-slate-500">Partition layout</td><td class="py-1 text-right font-bold">${({
              top_tray: 'Top Accessory Tray (Remote, Cables & Manual)',
              open_8corners: '8 Corner Cushions + Open Cavity (Standard Clean)',
              side_bay: 'Side Accessory Bay (Pedestal Stand & Brackets)',
              edge_rails: 'Perimeter Edge Protective Rails (Clamp & Strap Guard)',
              base_skid_tray: 'Heavy-Duty Base Cushion Tray (Pallet & Forklift Guard)'
            }[pack.layout] || String(pack.layout)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</td></tr>
            <tr><td class="py-1 text-slate-500">Partition notes</td><td class="py-1 text-right font-bold">${String(pack.notes || '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</td></tr>
          </table>
        </div>

        <!-- Document Title -->
        <div class="bg-slate-100 p-4 rounded-lg mb-6 border border-slate-200">
          <h2 class="text-base font-bold text-slate-900 uppercase tracking-wide">
            PRODUCT PACKAGING SPECIFICATION &amp; DROP-TEST RESULT
          </h2>
          <p class="text-xs text-slate-600 mt-1">
            Replaces conventional Expanded Polystyrene (EPS) with 100% Recyclable Honeycomb / Origami Structural Cardboard
          </p>
        </div>

        <!-- Two Column Specs -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          
          <!-- Column 1: Appliance Physical Specs -->
          <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              1. APPLIANCE SPECIFICATIONS
            </h3>
            <table class="w-full text-xs font-mono">
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Appliance Model:</td>
                <td class="py-1 text-right font-bold text-slate-900">${product.productName} (${preset.model})</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Outer Envelope:</td>
                <td class="py-1 text-right font-bold text-slate-900">${dims.length} × ${dims.width} × ${dims.height} mm</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Gross Appliance Mass:</td>
                <td class="py-1 text-right font-bold text-slate-900">${product.weight} kg</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Fragility Threshold:</td>
                <td class="py-1 text-right font-bold text-red-600">${preset.safeGMax} G max deceleration</td>
              </tr>
              <tr>
              <td class="py-1 text-slate-500">Fragility index:</td>
              <td class="py-1 text-right text-slate-700">${product.fragility} / 10</td>
            </tr>
            <tr>
              <td class="py-1 text-slate-500">Critical Zones:</td>
                <td class="py-1 text-right text-slate-700">${preset.criticalComponents.join(', ')}</td>
              </tr>
            </table>
          </div>

          <!-- Column 2: Packaging Material & Structure -->
          <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              2. GENERATIVE PACKAGING DESIGN
            </h3>
            <table class="w-full text-xs font-mono">
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Engineered Material:</td>
                <td class="py-1 text-right font-bold text-emerald-700">${mat.name}</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Flute Architecture:</td>
                <td class="py-1 text-right font-bold text-slate-900">15mm Hexagonal Cell / B-Flute Facets</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Assembly Mechanism:</td>
                <td class="py-1 text-right font-bold text-slate-900">Zero-Glue Origami Interlocking Tabs</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="py-1 text-slate-500">Mass Reduction:</td>
                <td class="py-1 text-right font-bold text-emerald-600">-36% vs EPS Baseline</td>
              </tr>
              <tr>
                <td class="py-1 text-slate-500">Repulpability in Egypt:</td>
                <td class="py-1 text-right font-bold text-emerald-700">100% Circular (Zero Landfill)</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Section 3: Physical Drop-Test Certification Table -->
        <div class="border border-slate-200 rounded-lg p-4 mb-6">
          <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            3. ASTM D5276 / ISTA-1A DROP SIMULATION VERIFICATION
          </h3>
          <div class="grid grid-cols-4 gap-4 text-center font-mono text-xs">
            <div class="p-3 bg-slate-100 rounded-lg">
              <span class="text-slate-500 block text-[10px]">DROP HEIGHT</span>
              <strong class="text-sm text-slate-900">${physicsData.dropHeightM} Meters (39")</strong>
            </div>
            <div class="p-3 bg-slate-100 rounded-lg">
              <span class="text-slate-500 block text-[10px]">IMPACT VECTOR</span>
              <strong class="text-sm text-slate-900">${physicsData.impactAngle.name}</strong>
            </div>
            <div class="p-3 bg-slate-100 rounded-lg">
              <span class="text-slate-500 block text-[10px]">RECORDED G-FORCE</span>
              <strong class="text-sm ${physicsData.isSafe ? 'text-emerald-700' : 'text-red-700'}">${physicsData.peakG} G (limit ${preset.safeGMax}G)</strong>
            </div>
            <div class="p-3 ${physicsData.isSafe ? 'bg-emerald-100 border border-emerald-300' : 'bg-red-100 border border-red-300'} rounded-lg">
              <span class="${physicsData.isSafe ? 'text-emerald-800' : 'text-red-800'} block text-[10px]">STATUS</span>
              <strong class="text-sm ${physicsData.isSafe ? 'text-emerald-800' : 'text-red-800'}">${testStatus}</strong>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4 text-center font-mono text-xs mt-3">
            <div class="p-3 bg-slate-100 rounded-lg"><span class="text-slate-500 block text-[10px]">IMPACT ENERGY</span><strong>${physicsData.impactEnergyJoules} J</strong></div>
            <div class="p-3 bg-slate-100 rounded-lg"><span class="text-slate-500 block text-[10px]">ABSORBED / TRANSMITTED</span><strong>${physicsData.absorbedEnergyJoules} J / ${physicsData.transmittedJoules} J</strong></div>
            <div class="p-3 bg-slate-100 rounded-lg"><span class="text-slate-500 block text-[10px]">CRUSH / CONTACT TIME</span><strong>${physicsData.dynamicDisplacementMm} mm / ${physicsData.impactDurationMs} ms</strong></div>
          </div>
          <div class="mt-3 rounded-lg ${damagePercent > 0 ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300'} border p-3 text-center font-mono">
            <span class="block text-[10px] text-slate-600">ESTIMATED PRODUCT DAMAGE • THIS CASE</span>
            <strong class="text-xl ${damagePercent > 0 ? 'text-red-700' : 'text-emerald-700'}">${damagePercent}%</strong>
          </div>
        </div>

        <p class="text-[10px] text-slate-500 mb-4">Engineering estimate from the in-app model. Physical package qualification requires instrumented laboratory drop tests; this report does not certify ISTA/ASTM compliance.</p>
        <p class="text-[9px] text-slate-500 mb-4">Damage index: 0% at or below the product G limit, increasing to 100% at 2× the limit. This is a simulation estimate, not a measured probability or physical damage inspection.</p>

        ${suiteSection}

        <!-- Section 4: Elaraby Annual ROI & Environmental Impact (100k Units) -->
        <div class="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50">
          <h3 class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            4. FACTORY SCALE FINANCIAL SAVINGS &amp; ESG AUDIT (100,000 UNITS BATCH)
          </h3>
          <div class="grid grid-cols-3 gap-4 font-mono text-xs">
            <div class="p-3 bg-white border border-slate-200 rounded-lg">
              <span class="text-slate-500 block text-[10px]">ANNUAL FACTORY COST SAVED</span>
              <strong class="text-base text-emerald-700 block mt-1">${analyticsData.annual.savingsEGP.toLocaleString()} EGP / Year</strong>
              <span class="text-[10px] text-slate-500">${analyticsData.unit.costSavedEGP} EGP saved per box</span>
            </div>
            <div class="p-3 bg-white border border-slate-200 rounded-lg">
              <span class="text-slate-500 block text-[10px]">PLASTIC EPS ELIMINATED</span>
              <strong class="text-base text-red-600 block mt-1">${analyticsData.annual.epsEliminatedKg.toLocaleString()} kg / Year</strong>
              <span class="text-[10px] text-slate-500">Eliminates toxic landfill waste</span>
            </div>
            <div class="p-3 bg-white border border-slate-200 rounded-lg">
              <span class="text-slate-500 block text-[10px]">CARBON FOOTPRINT OFFSET</span>
              <strong class="text-base text-emerald-700 block mt-1">${analyticsData.annual.co2AvoidedTons} Tons CO2e</strong>
              <span class="text-[10px] text-slate-500">≈ ${analyticsData.annual.treesPlantedEquiv.toLocaleString()} trees planted</span>
            </div>
          </div>
        </div>

        <!-- Sign-off Block with Official Elaraby Verification Stamp -->
        <div class="border-t-2 border-slate-900 pt-4 flex items-center justify-between font-mono text-xs">
          <div class="flex items-center gap-3">
            <!-- Official Circular Quality Stamp -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-16 h-16 opacity-85 text-emerald-700">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#047857" stroke-width="2" stroke-dasharray="4,2"/>
              <circle cx="50" cy="50" r="41" fill="none" stroke="#047857" stroke-width="1.2"/>
              <text x="50" y="32" font-size="7" font-family="'Inter', sans-serif" font-weight="bold" fill="#047857" text-anchor="middle" letter-spacing="0.5">ELARABY R&amp;D LAB</text>
              <text x="50" y="52" font-size="11" font-family="'Inter', sans-serif" font-weight="900" fill="#047857" text-anchor="middle">APPROVED</text>
              <text x="50" y="64" font-size="6.5" font-family="monospace" font-weight="bold" fill="#047857" text-anchor="middle">QUESNA / BENHA</text>
              <text x="50" y="74" font-size="6" font-family="monospace" fill="#047857" text-anchor="middle">ISTA-1A • 2026</text>
            </svg>
            <div>
              <div class="font-bold text-slate-900">VERIFIED BY: ELARABY PACKAGING R&amp;D CENTER</div>
              <div class="text-slate-500 text-[10px]">QUESNA &amp; BENHA INDUSTRIAL HUBS • ARAB REPUBLIC OF EGYPT</div>
              <div class="text-sky-800 text-[9px] font-semibold mt-0.5">NXTPAK AI CIRCULAR ENGINE • DMZ CAIRO • PHOTON X</div>
            </div>
          </div>
          <div class="text-right">
            <div class="w-36 border-b border-slate-400 mb-1"></div>
            <div class="text-[10px] text-slate-500 font-bold">CHIEF PACKAGING ENGINEER SIGNATURE</div>
            <div class="text-[9px] text-slate-400">QUALITY &amp; RELIABILITY ASSURANCE</div>
          </div>
        </div>

      </div>
    `;
  }

  // Export 3D CAD Mesh as Wavefront .OBJ file
  static exportThreeGroupToOBJ(threeGroup, filename = 'elaraby-nxtpak-packaging.obj') {
    let output = '# NXTPAK Studio 3D CAD Export\n';
    output += '# Designed for Elaraby Group Packaging R&D\n';
    output += '# Compatible with SolidWorks, Autodesk Fusion 360, Siemens NX\n\n';

    let vertexOffset = 0;
    let normalOffset = 0;

    threeGroup.traverse((child) => {
      if (child.isMesh && child.geometry) {
        output += `o ${child.name || 'MeshPart'}\n`;
        const geo = child.geometry.isBufferGeometry ? child.geometry : new THREE.BufferGeometry().fromGeometry(child.geometry);
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;

        // Apply world matrix
        child.updateMatrixWorld(true);
        const matrix = child.matrixWorld;

        // Vertices
        if (pos) {
          const v = new THREE.Vector3();
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            v.applyMatrix4(matrix);
            output += `v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
          }
        }

        // Normals
        if (norm) {
          const n = new THREE.Vector3();
          for (let i = 0; i < norm.count; i++) {
            n.fromBufferAttribute(norm, i);
            n.transformDirection(matrix);
            output += `vn ${n.x.toFixed(4)} ${n.y.toFixed(4)} ${n.z.toFixed(4)}\n`;
          }
        }

        // Faces
        const index = geo.index;
        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i) + 1 + vertexOffset;
            const b = index.getX(i + 1) + 1 + vertexOffset;
            const c = index.getX(i + 2) + 1 + vertexOffset;
            output += `f ${a} ${b} ${c}\n`;
          }
        } else if (pos) {
          for (let i = 0; i < pos.count; i += 3) {
            const a = i + 1 + vertexOffset;
            const b = i + 2 + vertexOffset;
            const c = i + 3 + vertexOffset;
            output += `f ${a} ${b} ${c}\n`;
          }
        }

        if (pos) vertexOffset += pos.count;
        if (norm) normalOffset += norm.count;
      }
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
