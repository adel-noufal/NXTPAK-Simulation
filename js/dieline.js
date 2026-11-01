// NXTPAK Studio - 2D Unfolded Dieline CAD Blueprint Generator
// Generates parametric vector cut & crease blueprints for factory digital cutting tables (Zünd / Kongsberg)

import { PRESETS, MATERIALS } from './config.js';

export class DielineGenerator {
  // Generate clean SVG markup of the unfolded modular corner buffer & tray dieline
  static generateSVG(presetKey, materialKey, customDims = null) {
    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const mat = MATERIALS[materialKey] || MATERIALS.honeycomb;

    // Parametric dieline dimensions based on appliance size
    const bufferThick = 45; // mm cushion
    const flapWidth = Math.min(180, Math.max(90, Math.round(dims.width * 0.4)));
    const tabHeight = 60; // mm interlocking tab
    const totalW = flapWidth * 4 + 80;
    const totalH = flapWidth * 3 + tabHeight * 2 + 100;

    const viewBoxW = 1000;
    const viewBoxH = 750;
    const scale = Math.min((viewBoxW - 140) / totalW, (viewBoxH - 180) / totalH);

    const ox = 120;
    const oy = 110;

    // SVG Canvas
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}" class="w-full h-full select-none" id="dieline-svg">
      <defs>
        <!-- Engineering Grid Pattern -->
        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.7"/>
        </pattern>
        <!-- Blue Cut line style, Green Crease line style -->
        <style>
          .cad-cut { stroke: #ef4444; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
          .cad-crease { stroke: #10b981; stroke-width: 1.8; stroke-dasharray: 6,4; fill: none; }
          .cad-perf { stroke: #06b6d4; stroke-width: 1.5; stroke-dasharray: 3,3; fill: none; }
          .cad-dim { stroke: #94a3b8; stroke-width: 1; fill: none; }
          .cad-dim-text { fill: #94a3b8; font-family: monospace; font-size: 11px; }
          .cad-label { fill: #f8fafc; font-family: sans-serif; font-size: 13px; font-weight: bold; }
          .cad-watermark { fill: #334155; font-family: monospace; font-size: 10px; }
          .cad-tab { fill: rgba(16, 185, 129, 0.08); }
        </style>
      </defs>

      <!-- Background Grid -->
      <rect width="100%" height="100%" fill="#0a0f18"/>
      <rect width="100%" height="100%" fill="url(#cadGrid)"/>

      <!-- Engineering Blueprint Title Block (Bottom Right) -->
      <g transform="translate(${viewBoxW - 360}, ${viewBoxH - 120})">
        <rect width="330" height="100" fill="#111827" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="0" y1="28" x2="330" y2="28" stroke="#1e293b" stroke-width="1"/>
        <line x1="0" y1="64" x2="330" y2="64" stroke="#1e293b" stroke-width="1"/>
        <line x1="160" y1="28" x2="160" y2="100" stroke="#1e293b" stroke-width="1"/>

        <text x="12" y="20" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="12">ELARABY GROUP R&amp;D • NXTPAK STUDIO</text>
        <text x="12" y="44" fill="#f8fafc" font-family="sans-serif" font-size="11">PART: 3D ORIGAMI CORNER BUFFER</text>
        <text x="12" y="58" fill="#94a3b8" font-family="monospace" font-size="9">DWG NO: ELR-${preset.id.toUpperCase()}-2026-REV3</text>
        
        <text x="170" y="44" fill="#10b981" font-family="sans-serif" font-size="10">MATERIAL: ${mat.name.toUpperCase()}</text>
        <text x="170" y="58" fill="#94a3b8" font-family="monospace" font-size="9">THICKNESS: 15mm HONEYCOMB</text>

        <text x="12" y="82" fill="#94a3b8" font-family="monospace" font-size="9">SCALE: 1:1 CNC CUT</text>
        <text x="12" y="94" fill="#94a3b8" font-family="monospace" font-size="9">UNITS: MILLIMETERS (mm)</text>
        <text x="170" y="82" fill="#38bdf8" font-family="monospace" font-size="9">STANDARDS: ISTA-1A / FEFCO</text>
        <text x="170" y="94" fill="#f59e0b" font-family="monospace" font-size="9">ZERO-GLUE INTERLOCKING</text>
      </g>

      <!-- Legend (Top Left) -->
      <g transform="translate(30, 25)">
        <rect width="360" height="42" fill="#111827" stroke="#334155" rx="4"/>
        <!-- Cut line legend -->
        <line x1="15" y1="21" x2="45" y2="21" class="cad-cut"/>
        <text x="52" y="25" fill="#f8fafc" font-family="monospace" font-size="11">CUT (Through)</text>

        <!-- Crease line legend -->
        <line x1="150" y1="21" x2="185" y2="21" class="cad-crease"/>
        <text x="192" y="25" fill="#10b981" font-family="monospace" font-size="11">CREASE (Fold)</text>

        <!-- Perforation legend -->
        <line x1="285" y1="21" x2="315" y2="21" class="cad-perf"/>
        <text x="322" y="25" fill="#06b6d4" font-family="monospace" font-size="11">SLOT</text>
      </g>

      <!-- Flat Unfolded Cardboard Pattern (Center) -->
      <g id="dieline-geometry">
    `;

    // Coordinates for unfolded flat cross / 3D origami buffer cap
    const pw = flapWidth * 1.4;
    const ph = flapWidth * 1.4;
    const cx = viewBoxW / 2 - 40;
    const cy = viewBoxH / 2 - 20;

    // Center socket base panel
    svg += `
      <!-- Base Center Socket Panel -->
      <rect x="${cx - pw/2}" y="${cy - ph/2}" width="${pw}" height="${ph}" class="cad-tab" />
      <text x="${cx}" y="${cy}" text-anchor="middle" class="cad-watermark">APPLIANCE CORNER SEAT</text>

      <!-- Crease boundary lines (green dashed) -->
      <line x1="${cx - pw/2}" y1="${cy - ph/2}" x2="${cx + pw/2}" y2="${cy - ph/2}" class="cad-crease"/>
      <line x1="${cx - pw/2}" y1="${cy + ph/2}" x2="${cx + pw/2}" y2="${cy + ph/2}" class="cad-crease"/>
      <line x1="${cx - pw/2}" y1="${cy - ph/2}" x2="${cx - pw/2}" y2="${cy + ph/2}" class="cad-crease"/>
      <line x1="${cx + pw/2}" y1="${cy - ph/2}" x2="${cx + pw/2}" y2="${cy + ph/2}" class="cad-crease"/>

      <!-- Diagonal Origami Crease lines (Yoshimura crumple pattern) -->
      <line x1="${cx - pw/2}" y1="${cy - ph/2}" x2="${cx}" y2="${cy}" class="cad-crease"/>
      <line x1="${cx + pw/2}" y1="${cy - ph/2}" x2="${cx}" y2="${cy}" class="cad-crease"/>
      <line x1="${cx - pw/2}" y1="${cy + ph/2}" x2="${cx}" y2="${cy}" class="cad-crease"/>
      <line x1="${cx + pw/2}" y1="${cy + ph/2}" x2="${cx}" y2="${cy}" class="cad-crease"/>

      <!-- Top Flap + Interlocking Tongue -->
      <path d="
        M ${cx - pw/2} ${cy - ph/2}
        L ${cx - pw/2 + 25} ${cy - ph/2 - ph * 0.7}
        L ${cx - 20} ${cy - ph/2 - ph * 0.7}
        L ${cx - 20} ${cy - ph/2 - ph * 0.7 - 28}
        L ${cx + 20} ${cy - ph/2 - ph * 0.7 - 28}
        L ${cx + 20} ${cy - ph/2 - ph * 0.7}
        L ${cx + pw/2 - 25} ${cy - ph/2 - ph * 0.7}
        L ${cx + pw/2} ${cy - ph/2}
      " class="cad-cut"/>
      <text x="${cx}" y="${cy - ph/2 - 35}" text-anchor="middle" class="cad-watermark">TOP FOLD FLAP</text>

      <!-- Bottom Flap + Interlocking Locking Slot -->
      <path d="
        M ${cx - pw/2} ${cy + ph/2}
        L ${cx - pw/2 + 25} ${cy + ph/2 + ph * 0.7}
        L ${cx + pw/2 - 25} ${cy + ph/2 + ph * 0.7}
        L ${cx + pw/2} ${cy + ph/2}
      " class="cad-cut"/>
      <!-- Slot for top tongue -->
      <rect x="${cx - 22}" y="${cy + ph/2 + 20}" width="44" height="6" class="cad-cut"/>
      <text x="${cx}" y="${cy + ph/2 + 45}" text-anchor="middle" class="cad-watermark">MORTISE &amp; TENON SLOT</text>

      <!-- Left Flap with Creased Wings -->
      <path d="
        M ${cx - pw/2} ${cy - ph/2}
        L ${cx - pw/2 - ph * 0.75} ${cy - ph/2 + 20}
        L ${cx - pw/2 - ph * 0.75} ${cy + ph/2 - 20}
        L ${cx - pw/2} ${cy + ph/2}
      " class="cad-cut"/>
      <line x1="${cx - pw/2 - 30}" y1="${cy - ph/2 + 10}" x2="${cx - pw/2 - 30}" y2="${cy + ph/2 - 10}" class="cad-crease"/>
      <text x="${cx - pw/2 - 40}" y="${cy}" text-anchor="middle" class="cad-watermark" transform="rotate(-90 ${cx - pw/2 - 40} ${cy})">LEFT WING</text>

      <!-- Right Flap with Creased Wings -->
      <path d="
        M ${cx + pw/2} ${cy - ph/2}
        L ${cx + pw/2 + ph * 0.75} ${cy - ph/2 + 20}
        L ${cx + pw/2 + ph * 0.75} ${cy + ph/2 - 20}
        L ${cx + pw/2} ${cy + ph/2}
      " class="cad-cut"/>
      <line x1="${cx + pw/2 + 30}" y1="${cy - ph/2 + 10}" x2="${cx + pw/2 + 30}" y2="${cy + ph/2 - 10}" class="cad-crease"/>
      <text x="${cx + pw/2 + 40}" y="${cy}" text-anchor="middle" class="cad-watermark" transform="rotate(90 ${cx + pw/2 + 40} ${cy})">RIGHT WING</text>

      <!-- Internal Honeycomb Vent & Weight Reduction Cutouts (Circular Circular Economy Hexagon Array) -->
      ${[
        [-25, -25], [25, -25], [0, 0], [-25, 25], [25, 25]
      ].map(([dx, dy]) => {
        const hx = cx + dx;
        const hy = cy + dy;
        const r = 9;
        return `
          <polygon points="
            ${hx + r*Math.cos(0)},${hy + r*Math.sin(0)}
            ${hx + r*Math.cos(Math.PI/3)},${hy + r*Math.sin(Math.PI/3)}
            ${hx + r*Math.cos(2*Math.PI/3)},${hy + r*Math.sin(2*Math.PI/3)}
            ${hx + r*Math.cos(Math.PI)},${hy + r*Math.sin(Math.PI)}
            ${hx + r*Math.cos(4*Math.PI/3)},${hy + r*Math.sin(4*Math.PI/3)}
            ${hx + r*Math.cos(5*Math.PI/3)},${hy + r*Math.sin(5*Math.PI/3)}
          " class="cad-cut" />
        `;
      }).join('')}

      <!-- CAD Dimension Calipers -->
      <!-- Width Dimension Line -->
      <line x1="${cx - pw/2}" y1="${cy + ph/2 + ph * 0.7 + 25}" x2="${cx + pw/2}" y2="${cy + ph/2 + ph * 0.7 + 25}" class="cad-dim"/>
      <line x1="${cx - pw/2}" y1="${cy + ph/2 + ph * 0.7 + 20}" x2="${cx - pw/2}" y2="${cy + ph/2 + ph * 0.7 + 30}" class="cad-dim"/>
      <line x1="${cx + pw/2}" y1="${cy + ph/2 + ph * 0.7 + 20}" x2="${cx + pw/2}" y2="${cy + ph/2 + ph * 0.7 + 30}" class="cad-dim"/>
      <text x="${cx}" y="${cy + ph/2 + ph * 0.7 + 42}" text-anchor="middle" class="cad-dim-text">BUFFER SPAN: ${dims.length > 800 ? '240 mm' : '160 mm'}</text>

      <!-- Height Dimension Line -->
      <line x1="${cx - pw/2 - ph * 0.75 - 25}" y1="${cy - ph/2}" x2="${cx - pw/2 - ph * 0.75 - 25}" y2="${cy + ph/2}" class="cad-dim"/>
      <line x1="${cx - pw/2 - ph * 0.75 - 30}" y1="${cy - ph/2}" x2="${cx - pw/2 - ph * 0.75 - 20}" y2="${cy - ph/2}" class="cad-dim"/>
      <line x1="${cx - pw/2 - ph * 0.75 - 30}" y1="${cy + ph/2}" x2="${cx - pw/2 - ph * 0.75 - 20}" y2="${cy + ph/2}" class="cad-dim"/>
      <text x="${cx - pw/2 - ph * 0.75 - 35}" y="${cy + 4}" text-anchor="end" class="cad-dim-text">DEPTH: ${dims.width} mm</text>
    `;

    svg += `
      </g>
    </svg>`;

    return svg;
  }

  // Download the SVG file for CNC cutting tables
  static downloadSVG(svgString, filename = 'elaraby-nxtpak-dieline.svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
