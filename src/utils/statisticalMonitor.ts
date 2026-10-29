/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProblemSolution, AnomalyAlert, MetricAnomalyDetail } from '../types';

export interface HistoricalStats {
  mean: number;
  variance: number;
  stdDev: number;
  threshold: number;
  min: number;
  max: number;
  count: number;
}

export interface MonitoringThresholds {
  sigmaMultiplier: number;
  success: HistoricalStats;
  complexity: HistoricalStats;
  sampleSize: number;
}

/**
 * Calculates mean, variance, and sample/population standard deviation
 */
export function computeStats(values: number[], sigmaMultiplier: number = 2.0, minStdDevFloor: number = 3.5): HistoricalStats {
  if (!values || values.length === 0) {
    return {
      mean: 80,
      variance: 25,
      stdDev: 5,
      threshold: 70,
      min: 80,
      max: 80,
      count: 0
    };
  }

  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = Number((sum / count).toFixed(2));

  // Compute variance
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = Number((squaredDiffs.reduce((acc, v) => acc + v, 0) / count).toFixed(2));
  
  // Standard deviation with minimum floor for small/uniform samples
  const rawStdDev = Math.sqrt(variance);
  const stdDev = Number(Math.max(rawStdDev, minStdDevFloor).toFixed(2));

  // Lower threshold = mean - (k * stdDev)
  const rawThreshold = mean - (sigmaMultiplier * stdDev);
  const threshold = Number(Math.max(10, Math.min(99, rawThreshold)).toFixed(2));

  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    mean,
    variance,
    stdDev,
    threshold,
    min,
    max,
    count
  };
}

/**
 * Extracts and computes historical thresholds from generation history
 */
export function getHistoricalThresholds(
  history: ProblemSolution[],
  sigmaMultiplier: number = 2.0
): MonitoringThresholds {
  const successValues = history.map(h => {
    if (typeof h.successRate === 'number' && !isNaN(h.successRate)) return h.successRate;
    return 75;
  });

  const complexityValues = history.map(h => {
    if (typeof h.complexityScore === 'number' && !isNaN(h.complexityScore)) return h.complexityScore;
    return 65;
  });

  const successStats = computeStats(successValues, sigmaMultiplier, 4.0);
  const complexityStats = computeStats(complexityValues, sigmaMultiplier, 5.0);

  return {
    sigmaMultiplier,
    success: successStats,
    complexity: complexityStats,
    sampleSize: history.length
  };
}

/**
 * Evaluates whether a new generation triggers a statistical regression anomaly alert
 */
export function evaluateGenerationAnomaly(
  newGen: ProblemSolution,
  priorHistory: ProblemSolution[],
  sigmaMultiplier: number = 2.0
): AnomalyAlert | null {
  // If no prior history, use baseline reference thresholds
  const effectiveHistory = priorHistory.length > 0 ? priorHistory : [newGen];
  const thresholds = getHistoricalThresholds(effectiveHistory, sigmaMultiplier);

  const successVal = typeof newGen.successRate === 'number' ? newGen.successRate : 75;
  const complexityVal = typeof newGen.complexityScore === 'number' ? newGen.complexityScore : 65;

  const successBreached = successVal < thresholds.success.threshold;
  const complexityBreached = complexityVal < thresholds.complexity.threshold;

  if (!successBreached && !complexityBreached) {
    return null;
  }

  // Calculate sigma distance: (value - mean) / stdDev (negative means below mean)
  const successSigmaDist = Number(((successVal - thresholds.success.mean) / Math.max(0.1, thresholds.success.stdDev)).toFixed(2));
  const complexitySigmaDist = Number(((complexityVal - thresholds.complexity.mean) / Math.max(0.1, thresholds.complexity.stdDev)).toFixed(2));

  let alertType: 'SUCCESS_DROP' | 'COMPLEXITY_DROP' | 'DUAL_DROP';
  if (successBreached && complexityBreached) {
    alertType = 'DUAL_DROP';
  } else if (successBreached) {
    alertType = 'SUCCESS_DROP';
  } else {
    alertType = 'COMPLEXITY_DROP';
  }

  const isSevere = (successBreached && successSigmaDist <= -2.8) || 
                   (complexityBreached && complexitySigmaDist <= -2.8) || 
                   (successBreached && complexityBreached);

  const successDetail: MetricAnomalyDetail = {
    value: successVal,
    mean: thresholds.success.mean,
    stdDev: thresholds.success.stdDev,
    threshold: thresholds.success.threshold,
    isBreached: successBreached,
    sigmaDistance: successSigmaDist
  };

  const complexityDetail: MetricAnomalyDetail = {
    value: complexityVal,
    mean: thresholds.complexity.mean,
    stdDev: thresholds.complexity.stdDev,
    threshold: thresholds.complexity.threshold,
    isBreached: complexityBreached,
    sigmaDistance: complexitySigmaDist
  };

  let detailsText = '';
  if (alertType === 'DUAL_DROP') {
    detailsText = `Queda dupla crítica na Geração GEN_${newGen.generation.toString().padStart(4, '0')}: Taxa de Sucesso (${successVal}%) e Complexidade (${complexityVal}) violaram simultaneamente o piso estatístico de -${sigmaMultiplier}σ da IA.`;
  } else if (alertType === 'SUCCESS_DROP') {
    detailsText = `Queda atípica na Taxa de Sucesso na Geração GEN_${newGen.generation.toString().padStart(4, '0')}: valor registrado (${successVal}%) está a ${Math.abs(successSigmaDist)}σ abaixo da média histórica (${thresholds.success.mean}%). Limite mínimo de tolerância: ${thresholds.success.threshold}%.`;
  } else {
    detailsText = `Queda atípica no Índice de Complexidade na Geração GEN_${newGen.generation.toString().padStart(4, '0')}: sofisticação registrada (${complexityVal}) está a ${Math.abs(complexitySigmaDist)}σ abaixo da média histórica (${thresholds.complexity.mean}). Limite mínimo de tolerância: ${thresholds.complexity.threshold}.`;
  }

  let suggestedAction = '';
  if (alertType === 'DUAL_DROP' || isSevere) {
    suggestedAction = 'Recomenda-se isolar esta solução e submetê-la ao Testing Sandbox para ciclos de desconstrução e estresse com coalizão forçada de subagentes.';
  } else if (alertType === 'SUCCESS_DROP') {
    suggestedAction = 'Recomenda-se integrar fontes de pesquisa externa (Grounding) ou sincronizar conhecimentos legados para elevar a consistência lógica.';
  } else {
    suggestedAction = 'Recomenda-se forçar a sinergia entre subagentes de campos opostos (ex: Quantum Mechanics + Filosofia) para enriquecer o arcabouço conceitual.';
  }

  return {
    id: `anomaly_${Date.now()}`,
    generation: newGen.generation,
    timestamp: new Date().toISOString(),
    type: alertType,
    severity: isSevere ? 'critical' : 'warning',
    problemTitle: newGen.problem || 'Geração Ativa',
    metrics: {
      success: successDetail,
      complexity: complexityDetail
    },
    details: detailsText,
    suggestedAction,
    dismissed: false
  };
}
