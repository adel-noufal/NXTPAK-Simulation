// NXTPAK Studio - Circular Economy Analytics & Elaraby ROI Calculator
// Computes unit savings, annual factory cost reduction in EGP, EPS plastic eliminated, and CO2 offset

import { PRESETS, MATERIALS } from './config.js';

export class AnalyticsEngine {
  constructor() {
    this.annualProductionUnits = 100000; // Elaraby standard batch run (100k units/yr)
  }

  setAnnualUnits(units) {
    this.annualProductionUnits = Math.max(1000, parseInt(units) || 100000);
  }

  // Calculate comparative analytics between EPS Styrofoam baseline and Generative Cardboard
  computeComparison(presetKey, materialKey, customDims = null, customWeight = null) {
    const preset = PRESETS[presetKey] || PRESETS.tv;
    const dims = customDims || preset.dimensions;
    const applianceWeight = customWeight || preset.weight;
    const selectedMat = MATERIALS[materialKey] || MATERIALS.honeycomb;
    const epsMat = MATERIALS.eps;

    // 1. Packaging Material Mass Calculation
    // Total buffer volume (liters)
    const applianceVolumeL = (dims.length * dims.width * dims.height) / 1e6;
    
    // EPS baseline buffer volume is high (bulky corners)
    const epsVolumeL = preset.epsBaseline.volumeLiters;
    const epsBufferWeightKg = preset.epsBaseline.weightKg;
    const epsUnitCostEGP = preset.epsBaseline.costEGP;
    const epsUnitCO2Kg = preset.epsBaseline.co2Kg;

    // AI Generative Honeycomb / Origami topology optimizes cushion distribution
    // Reduces buffer volume by 32% - 40%
    let volumeReductionRatio = 0.36; // 36% volume reduction
    let densityMultiplier = 1.0;

    if (materialKey === 'origami') {
      volumeReductionRatio = 0.42; // Origami ultra-light folding geometry
    } else if (materialKey === 'pulp') {
      volumeReductionRatio = 0.30;
    } else if (materialKey === 'eps') {
      volumeReductionRatio = 0.0; // Baseline
    }

    const aiVolumeL = epsVolumeL * (1.0 - volumeReductionRatio);
    // Calculated AI buffer mass
    const aiBufferWeightKg = parseFloat((epsBufferWeightKg * (1.0 - volumeReductionRatio * 0.7)).toFixed(2));
    
    // Unit costs in EGP
    let aiUnitCostEGP = parseFloat((aiBufferWeightKg * selectedMat.costPerKgEGP * 1.35).toFixed(2)); // + fabrication factor
    if (materialKey === 'eps') {
      aiUnitCostEGP = epsUnitCostEGP;
    }

    // Cost saved per unit (EGP)
    const unitCostSavedEGP = Math.max(0, parseFloat((epsUnitCostEGP - aiUnitCostEGP).toFixed(2)));
    const percentCostSaved = epsUnitCostEGP > 0 ? Math.round((unitCostSavedEGP / epsUnitCostEGP) * 100) : 0;

    // Weight saved (%)
    const weightReductionPercent = materialKey === 'eps' ? 0 : Math.round(volumeReductionRatio * 100);

    // Carbon Footprint (kg CO2e per unit)
    const aiUnitCO2Kg = parseFloat((aiBufferWeightKg * selectedMat.co2PerKg).toFixed(2));
    const co2SavedPerUnitKg = Math.max(0, parseFloat((epsUnitCO2Kg - aiUnitCO2Kg).toFixed(2)));

    // Annual Scaled Factory Metrics (for Elaraby Group 100,000 units factory run)
    const annualUnits = this.annualProductionUnits;
    const annualSavingsEGP = Math.round(unitCostSavedEGP * annualUnits);
    const annualEPSEliminatedKg = materialKey === 'eps' ? 0 : Math.round(epsBufferWeightKg * annualUnits);
    const annualCO2AvoidedTons = materialKey === 'eps' ? 0 : parseFloat(((co2SavedPerUnitKg * annualUnits) / 1000).toFixed(1));
    const treeEquivalent = Math.round(annualCO2AvoidedTons * 45); // ~45 trees absorb 1 metric ton of CO2/yr

    return {
      preset,
      selectedMat,
      annualUnits,
      // Unit metrics
      unit: {
        epsCostEGP: epsUnitCostEGP,
        aiCostEGP: aiUnitCostEGP,
        costSavedEGP: unitCostSavedEGP,
        percentCostSaved,
        epsWeightKg: epsBufferWeightKg,
        aiWeightKg: aiBufferWeightKg,
        weightReductionPercent,
        epsCO2Kg: epsUnitCO2Kg,
        aiCO2Kg: aiUnitCO2Kg,
        co2SavedKg: co2SavedPerUnitKg
      },
      // Annual metrics
      annual: {
        savingsEGP: annualSavingsEGP,
        epsEliminatedKg: annualEPSEliminatedKg,
        co2AvoidedTons: annualCO2AvoidedTons,
        treesPlantedEquiv: treeEquivalent
      },
      circularScore: selectedMat.circularScore,
      recyclabilityPercent: Math.round(selectedMat.recyclability * 100)
    };
  }

  // Format large numbers in Egyptian currency (e.g. 3,850,000 EGP)
  static formatEGP(amount) {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}
