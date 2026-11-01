// NXTPAK Studio - Live A/B Impact Benchmark Engine
// Side-by-side comparative drop physics: Toxic EPS Styrofoam vs. Circular Honeycomb Cardboard

import { PRESETS, MATERIALS } from './config.js';
import { sound } from './audio.js';
import { i18n } from './i18n.js';

export class BenchmarkEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  initCanvas(canvasElement) {
    this.canvas = canvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  // Generate complete side-by-side comparative analysis data using ASTM D1596 / Gibson-Ashby ODE solver
  computeBenchmark(presetKey, dropHeightM = 1.0, impactAngleKey = 'corner', physicsEngine = null) {
    const preset = PRESETS[presetKey] || PRESETS.tv;
    const safeG = preset.safeGMax;

    let epsPeakG, epsSafe, epsDurationMs, epsShockSeries;
    let honeyPeakG, honeySafe, honeyDurationMs, honeyShockSeries;

    if (physicsEngine && typeof physicsEngine.calculateImpactPhysics === 'function') {
      const epsRes = physicsEngine.calculateImpactPhysics(preset, 'eps', dropHeightM, impactAngleKey);
      const honeyRes = physicsEngine.calculateImpactPhysics(preset, 'honeycomb', dropHeightM, impactAngleKey);

      epsPeakG = epsRes.peakG;
      epsSafe = epsRes.isSafe;
      epsDurationMs = epsRes.impactDurationMs;
      epsShockSeries = epsRes.shockTimeSeries;

      honeyPeakG = honeyRes.peakG;
      honeySafe = honeyRes.isSafe;
      honeyDurationMs = honeyRes.impactDurationMs;
      honeyShockSeries = honeyRes.shockTimeSeries;
    } else {
      // Calibrated analytical fallback
      epsPeakG = parseFloat((safeG * 1.68 * (dropHeightM / 1.0)).toFixed(1));
      epsSafe = epsPeakG <= safeG;
      epsDurationMs = 11.5;
      epsShockSeries = null;

      honeyPeakG = parseFloat((safeG * 0.76 * (dropHeightM / 1.0)).toFixed(1));
      honeySafe = honeyPeakG <= safeG;
      honeyDurationMs = 24.0;
      honeyShockSeries = null;
    }

    // Savings calculations
    const epsCost = preset.epsBaseline.costEGP;
    const honeyCost = parseFloat((epsCost * 0.55).toFixed(2));
    const unitSavedEGP = parseFloat((epsCost - honeyCost).toFixed(2));
    const annualSavedEGP = Math.round(unitSavedEGP * 100000);

    return {
      preset,
      safeG,
      eps: {
        peakG: epsPeakG,
        isSafe: epsSafe,
        durationMs: epsDurationMs,
        shockTimeSeries: epsShockSeries,
        costEGP: epsCost,
        recyclability: '0% (Non-Recyclable Landfill)',
        failureMode: 'Brittle Cell Shatter & Rebound Shock',
        color: '#ef4444'
      },
      honeycomb: {
        peakG: honeyPeakG,
        isSafe: honeySafe,
        durationMs: honeyDurationMs,
        shockTimeSeries: honeyShockSeries,
        costEGP: honeyCost,
        recyclability: '100% Repulpable in Egypt',
        failureMode: 'Progressive Hydraulic Hex Buckling',
        color: '#10b981'
      },
      delta: {
        shockReductionPercent: Math.round(((epsPeakG - honeyPeakG) / epsPeakG) * 100),
        unitSavedEGP,
        annualSavedEGP
      }
    };
  }

  // Draw dual comparative shock pulse curves on the benchmark canvas
  drawDualShockCurves(data) {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#080d16';
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const maxG = Math.max(70, data.eps.peakG * 1.15);
    const zeroY = h - 28;
    const safeY = zeroY - (data.safeG / maxG) * (h - 48);

    // Draw Safe Fragility Threshold Line (Dashed Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(35, safeY);
    ctx.lineTo(w - 15, safeY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${i18n.t('fragilityLimit')} ${data.safeG} G`, w - 170, safeY - 6);

    // 1. Draw EPS Curve (Red, sharp spike from ODE time series)
    this.plotPulse(ctx, {
      peakG: data.eps.peakG,
      durationMs: data.eps.durationMs,
      shockTimeSeries: data.eps.shockTimeSeries,
      maxG, zeroY, w, h,
      color: '#ef4444',
      fillAlpha: 0.15,
      damp: 0.12,
      label: `EPS Styrofoam (${data.eps.peakG} G)`
    });

    // 2. Draw Honeycomb Curve (Green, smooth progressive cushion from ODE time series)
    this.plotPulse(ctx, {
      peakG: data.honeycomb.peakG,
      durationMs: data.honeycomb.durationMs,
      shockTimeSeries: data.honeycomb.shockTimeSeries,
      maxG, zeroY, w, h,
      color: '#10b981',
      fillAlpha: 0.28,
      damp: 0.38,
      label: `NXTPAK Honeycomb (${data.honeycomb.peakG} G)`
    });

    // Axis Legend
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('0G', 8, zeroY + 4);
    ctx.fillText(`${Math.round(maxG)}G`, 8, 20);
    ctx.fillText('0ms', 35, h - 8);
    ctx.fillText('30ms', w / 2 - 12, h - 8);
    ctx.fillText('60ms', w - 45, h - 8);
  }

  plotPulse(ctx, cfg) {
    const totalTime = 60; // ms window
    const points = [];

    if (cfg.shockTimeSeries && cfg.shockTimeSeries.length > 0) {
      cfg.shockTimeSeries.forEach((pt) => {
        const px = 35 + (pt.tMs / totalTime) * (cfg.w - 55);
        const py = cfg.zeroY - (pt.gVal / cfg.maxG) * (cfg.h - 48);
        points.push({ x: px, y: py, g: pt.gVal });
      });
    } else {
      const step = 0.5;
      for (let t = 0; t <= totalTime; t += step) {
        let g = 0;
        if (t >= 6 && t <= 6 + cfg.durationMs) {
          const pulseT = (t - 6) / cfg.durationMs;
          g = cfg.peakG * Math.sin(Math.PI * pulseT);
        } else if (t > 6 + cfg.durationMs) {
          const reboundT = t - (6 + cfg.durationMs);
          g = cfg.peakG * 0.25 * Math.sin(reboundT * 0.5) * Math.exp(-reboundT * cfg.damp * 0.18);
        }

        const px = 35 + (t / totalTime) * (cfg.w - 55);
        const py = cfg.zeroY - (g / cfg.maxG) * (cfg.h - 48);
        points.push({ x: px, y: py, g });
      }
    }

    // Stroke
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Fill
    ctx.fillStyle = cfg.color + '26';
    ctx.beginPath();
    ctx.moveTo(points[0].x, cfg.zeroY);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, cfg.zeroY);
    ctx.closePath();
    ctx.fill();

    // Peak circle & label
    const peakPt = points.reduce((prev, curr) => (curr.g > prev.g ? curr : prev), points[0]);
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(peakPt.x, peakPt.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 10px monospace';
    ctx.fillText(cfg.label, peakPt.x - 30, peakPt.y - 10);
  }
}
