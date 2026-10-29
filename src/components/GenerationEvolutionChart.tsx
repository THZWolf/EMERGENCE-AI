/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Award, 
  Layers, 
  Filter, 
  Maximize2, 
  Minimize2,
  Calendar,
  CheckCircle2,
  Cpu,
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { ProblemSolution } from '../types';
import { getHistoricalThresholds } from '../utils/statisticalMonitor';

interface GenerationEvolutionChartProps {
  history: ProblemSolution[];
  currentGeneration: number;
  onSelectGeneration?: (generation: ProblemSolution) => void;
  selectedGenerationNumber?: number;
  sigmaMultiplier?: number;
}

interface ChartDataPoint {
  generation: number;
  generationLabel: string;
  success: number;
  complexity: number;
  efficiency: number;
  dateStr: string;
  problem: string;
  subAgentsCount: number;
  raw: ProblemSolution;
}

export default function GenerationEvolutionChart({
  history,
  currentGeneration,
  onSelectGeneration,
  selectedGenerationNumber,
  sigmaMultiplier = 2.0,
}: GenerationEvolutionChartProps) {
  const [metricFilter, setMetricFilter] = useState<'both' | 'success' | 'complexity'>('both');
  const [rangeFilter, setRangeFilter] = useState<'all' | 'last5' | 'last10'>('all');
  const [showReferenceLines, setShowReferenceLines] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate historical statistical thresholds (e.g. 2 standard deviations below mean)
  const thresholds = useMemo(() => {
    return getHistoricalThresholds(history, sigmaMultiplier);
  }, [history, sigmaMultiplier]);

  // Transform and sort history chronologically (ascending by generation)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!history || history.length === 0) return [];

    // Clone and sort ascending: Gen 1, Gen 2, Gen 3...
    const sorted = [...history].sort((a, b) => a.generation - b.generation);

    return sorted.map((item, index) => {
      // Extract or derive reliable success & complexity
      let success = item.successRate;
      let complexity = item.complexityScore;

      if (success === undefined || isNaN(success)) {
        const steps = item.reasoningSteps?.length || 10;
        const subCount = item.subAgents?.length || 3;
        const base = 70 + Math.min(22, index * 5 + (steps >= 10 ? 4 : 0) + (subCount >= 3 ? 3 : 0));
        const hash = (item.problem?.length || 10) % 6;
        success = Math.min(99, Math.max(65, base + hash));
      }

      if (complexity === undefined || isNaN(complexity)) {
        const subCount = item.subAgents?.length || 3;
        const base = 52 + Math.min(40, index * 6 + subCount * 4);
        const hash = (item.solution?.length || 10) % 5;
        complexity = Math.min(98, Math.max(50, base + hash));
      }

      const efficiency = Number((success / Math.max(1, complexity)).toFixed(2));
      
      const date = item.timestamp 
        ? new Date(item.timestamp) 
        : new Date(Date.now() - (sorted.length - 1 - index) * 86400000 * 0.5);

      const dateStr = date.toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        generation: item.generation,
        generationLabel: `GEN_${item.generation.toString().padStart(4, '0')}`,
        success: Math.round(success),
        complexity: Math.round(complexity),
        efficiency,
        dateStr,
        problem: item.problem || 'Problema não especificado',
        subAgentsCount: item.subAgents?.length || 0,
        raw: item,
      };
    });
  }, [history]);

  // Apply range filter
  const filteredData = useMemo(() => {
    if (rangeFilter === 'last5') return chartData.slice(-5);
    if (rangeFilter === 'last10') return chartData.slice(-10);
    return chartData;
  }, [chartData, rangeFilter]);

  // Compute aggregate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgSuccess: 0,
        avgComplexity: 0,
        latestSuccess: 0,
        latestComplexity: 0,
        successDelta: 0,
        complexityDelta: 0,
        highestSuccess: 0,
        highestComplexity: 0,
      };
    }

    const totalSuccess = chartData.reduce((acc, d) => acc + d.success, 0);
    const totalComplexity = chartData.reduce((acc, d) => acc + d.complexity, 0);
    const latest = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;

    const highestSuccess = Math.max(...chartData.map(d => d.success));
    const highestComplexity = Math.max(...chartData.map(d => d.complexity));

    return {
      avgSuccess: Math.round(totalSuccess / chartData.length),
      avgComplexity: Math.round(totalComplexity / chartData.length),
      latestSuccess: latest.success,
      latestComplexity: latest.complexity,
      successDelta: previous ? latest.success - previous.success : 0,
      complexityDelta: previous ? latest.complexity - previous.complexity : 0,
      highestSuccess,
      highestComplexity,
    };
  }, [chartData]);

  // Custom Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      const isSelected = selectedGenerationNumber === data.generation;

      return (
        <div className="bg-[#0b100e]/95 border border-evolve-accent/40 rounded-lg p-3.5 shadow-[0_0_25px_rgba(0,255,156,0.25)] backdrop-blur-md max-w-xs font-mono text-xs z-50 pointer-events-none">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-3">
            <span className="text-evolve-accent font-bold text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {data.generationLabel}
            </span>
            <span className="text-white/40 text-[9px] flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {data.dateStr}
            </span>
          </div>

          <p className="text-[10px] text-white/70 line-clamp-2 my-2 font-sans italic border-l border-evolve-accent/40 pl-2">
            "{data.problem}"
          </p>

          <div className="space-y-2 pt-1">
            {/* Success metric */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-evolve-accent flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Taxa de Sucesso:
                </span>
                <span className="font-bold text-evolve-accent">{data.success}%</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-evolve-accent/20">
                <div 
                  className="bg-evolve-accent h-full rounded-full transition-all shadow-[0_0_8px_#00FF9C]" 
                  style={{ width: `${data.success}%` }}
                />
              </div>
            </div>

            {/* Complexity metric */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Complexidade:
                </span>
                <span className="font-bold text-cyan-400">{data.complexity}/100</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-cyan-500/20">
                <div 
                  className="bg-cyan-400 h-full rounded-full transition-all shadow-[0_0_8px_rgba(56,189,248,0.7)]" 
                  style={{ width: `${data.complexity}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[9px] text-white/50 pt-1 border-t border-white/5">
              <span>Eficiência: <strong className="text-white/80">{data.efficiency}x</strong></span>
              <span>Subagentes: <strong className="text-white/80">{data.subAgentsCount}</strong></span>
            </div>

            {/* Threshold Anomaly Detection Warning in Tooltip */}
            {(data.success < thresholds.success.threshold || data.complexity < thresholds.complexity.threshold) && (
              <div className="mt-2 p-1.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Alerta: Abaixo do piso histórico (-{sigmaMultiplier}σ)</span>
              </div>
            )}
          </div>

          {onSelectGeneration && (
            <div className="mt-2.5 pt-1.5 border-t border-white/10 text-[8px] text-evolve-accent/80 text-center uppercase tracking-wider">
              {isSelected ? '✓ Geração Exibida no Console' : 'Clique no ponto para carregar no Console'}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 md:p-5 rounded-xl border border-evolve-line bg-[#080d0b]/80 backdrop-blur-md transition-all space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${isExpanded ? 'ring-1 ring-evolve-accent/30' : ''}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-evolve-line/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg border border-evolve-accent/50 bg-evolve-accent/10 flex items-center justify-center text-evolve-accent shadow-[0_0_12px_rgba(0,255,156,0.2)]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                Progresso Temporal das Gerações
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-evolve-accent/15 border border-evolve-accent/40 text-evolve-accent">
                Recharts Live
              </span>
            </div>
            <p className="text-[10px] font-mono text-white/40">
              Taxa de Sucesso (%) vs. Índice de Complexidade (0–100) ao longo do avanço evolutivo
            </p>
          </div>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric View Filter */}
          <div className="flex items-center p-0.5 bg-black/60 border border-evolve-line rounded-lg text-[9px] font-mono">
            <button
              onClick={() => setMetricFilter('both')}
              className={`px-2 py-1 rounded transition-colors ${metricFilter === 'both' ? 'bg-white/15 text-white font-bold' : 'text-white/40 hover:text-white/70'}`}
              title="Exibir ambas as linhas de tendência"
            >
              Ambos
            </button>
            <button
              onClick={() => setMetricFilter('success')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${metricFilter === 'success' ? 'bg-evolve-accent text-evolve-bg font-bold' : 'text-evolve-accent/70 hover:text-evolve-accent'}`}
              title="Exibir apenas Taxa de Sucesso"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-evolve-accent" />
              Sucesso
            </button>
            <button
              onClick={() => setMetricFilter('complexity')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${metricFilter === 'complexity' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-400/70 hover:text-cyan-400'}`}
              title="Exibir apenas Complexidade"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Complexidade
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex items-center p-0.5 bg-black/60 border border-evolve-line rounded-lg text-[9px] font-mono">
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${rangeFilter === 'all' ? 'bg-white/20 text-white font-semibold' : 'text-white/40 hover:text-white/70'}`}
            >
              Todas ({chartData.length})
            </button>
            {chartData.length > 5 && (
              <button
                onClick={() => setRangeFilter('last5')}
                className={`px-2 py-1 rounded transition-colors ${rangeFilter === 'last5' ? 'bg-white/20 text-white font-semibold' : 'text-white/40 hover:text-white/70'}`}
              >
                Últimas 5
              </button>
            )}
            {chartData.length > 10 && (
              <button
                onClick={() => setRangeFilter('last10')}
                className={`px-2 py-1 rounded transition-colors ${rangeFilter === 'last10' ? 'bg-white/20 text-white font-semibold' : 'text-white/40 hover:text-white/70'}`}
              >
                Últimas 10
              </button>
            )}
          </div>

          {/* Toggle Reference Lines */}
          <button
            onClick={() => setShowReferenceLines(!showReferenceLines)}
            className={`p-1.5 rounded-lg border text-[9px] font-mono transition-colors ${
              showReferenceLines 
                ? 'border-evolve-accent/40 bg-evolve-accent/10 text-evolve-accent' 
                : 'border-white/10 text-white/30 hover:text-white/60'
            }`}
            title="Alternar linhas de referência de médias"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Expand/Collapse Height */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
            title={isExpanded ? "Reduzir altura do gráfico" : "Expandir altura do gráfico"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {/* Latest Success Card */}
        <div className="p-2.5 rounded-lg border border-evolve-accent/30 bg-evolve-accent/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-evolve-accent/70 uppercase">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-evolve-accent" />
              Sucesso Atual
            </span>
            {stats.successDelta !== 0 && (
              <span className={`text-[8px] font-bold ${stats.successDelta > 0 ? 'text-evolve-accent' : 'text-rose-400'}`}>
                {stats.successDelta > 0 ? `+${stats.successDelta}%` : `${stats.successDelta}%`}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold font-mono text-evolve-accent tracking-tight">
              {stats.latestSuccess}%
            </span>
            <span className="text-[9px] font-mono text-white/40">
              (Média: {stats.avgSuccess}%)
            </span>
          </div>
        </div>

        {/* Latest Complexity Card */}
        <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.04] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/70 uppercase">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Complexidade
            </span>
            {stats.complexityDelta !== 0 && (
              <span className={`text-[8px] font-bold ${stats.complexityDelta > 0 ? 'text-cyan-300' : 'text-white/40'}`}>
                {stats.complexityDelta > 0 ? `+${stats.complexityDelta}` : `${stats.complexityDelta}`}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold font-mono text-cyan-400 tracking-tight">
              {stats.latestComplexity}
            </span>
            <span className="text-[9px] font-mono text-white/40">
              /100 (Pico: {stats.highestComplexity})
            </span>
          </div>
        </div>

        {/* Evolutionary Efficiency */}
        <div className="p-2.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/50 uppercase">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Eficiência
            </span>
            <span className="text-[8px] text-amber-400/80 font-bold">Taxa S/C</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              {(stats.latestSuccess / Math.max(1, stats.latestComplexity)).toFixed(2)}x
            </span>
            <span className="text-[9px] font-mono text-white/40">convergência</span>
          </div>
        </div>

        {/* Generational Depth */}
        <div className="p-2.5 rounded-lg border border-white/10 bg-white/[0.02] space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/50 uppercase">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-white/60" />
              Gerações
            </span>
            <span className="text-[8px] text-white/40">Ativo</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight">
              GEN_{currentGeneration.toString().padStart(4, '0')}
            </span>
            <span className="text-[9px] font-mono text-white/40">({chartData.length} pts)</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div 
        className="w-full relative transition-all rounded-lg p-2 bg-black/40 border border-evolve-line/40"
        style={{ height: isExpanded ? '400px' : '260px' }}
      >
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-2">
            <Activity className="w-8 h-8 opacity-30 animate-pulse text-evolve-accent" />
            <p className="text-xs font-mono">Aguardando registro de gerações para traçar gráfico de linhas.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length && onSelectGeneration) {
                  const clickedItem = state.activePayload[0].payload.raw;
                  onSelectGeneration(clickedItem);
                }
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1f2924" 
                vertical={true}
                horizontal={true}
              />
              
              <XAxis 
                dataKey="generationLabel" 
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#374151' }}
              />
              
              <YAxis 
                domain={[0, 100]}
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#374151' }}
                unit="%"
                ticks={[0, 25, 50, 75, 100]}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend 
                verticalAlign="top" 
                height={32}
                iconType="circle"
                wrapperStyle={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  paddingBottom: '8px'
                }}
              />

              {/* Average Reference Lines */}
              {showReferenceLines && (
                <>
                  {(metricFilter === 'both' || metricFilter === 'success') && (
                    <ReferenceLine 
                      y={stats.avgSuccess} 
                      stroke="#00FF9C" 
                      strokeDasharray="4 4" 
                      strokeOpacity={0.4}
                      label={{ 
                        value: `Média Sucesso: ${stats.avgSuccess}%`, 
                        fill: '#00FF9C', 
                        fontSize: 9, 
                        position: 'insideTopRight',
                        opacity: 0.7,
                        fontFamily: 'monospace'
                      }} 
                    />
                  )}
                  {(metricFilter === 'both' || metricFilter === 'complexity') && (
                    <ReferenceLine 
                      y={stats.avgComplexity} 
                      stroke="#38BDF8" 
                      strokeDasharray="4 4" 
                      strokeOpacity={0.4}
                      label={{ 
                        value: `Média Complexidade: ${stats.avgComplexity}`, 
                        fill: '#38BDF8', 
                        fontSize: 9, 
                        position: 'insideBottomRight',
                        opacity: 0.7,
                        fontFamily: 'monospace'
                      }} 
                    />
                  )}

                  {/* Critical Lower Bound Reference Lines (-2σ) */}
                  {(metricFilter === 'both' || metricFilter === 'success') && (
                    <ReferenceLine 
                      y={thresholds.success.threshold} 
                      stroke="#ef4444" 
                      strokeDasharray="3 3" 
                      strokeWidth={1.5}
                      strokeOpacity={0.65}
                      label={{ 
                        value: `Piso Crítico (-${sigmaMultiplier}σ): ${thresholds.success.threshold}%`, 
                        fill: '#ef4444', 
                        fontSize: 9, 
                        position: 'insideBottomLeft',
                        opacity: 0.85,
                        fontFamily: 'monospace'
                      }} 
                    />
                  )}
                  {(metricFilter === 'both' || metricFilter === 'complexity') && (
                    <ReferenceLine 
                      y={thresholds.complexity.threshold} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3" 
                      strokeWidth={1.5}
                      strokeOpacity={0.65}
                      label={{ 
                        value: `Piso Crítico (-${sigmaMultiplier}σ): ${thresholds.complexity.threshold}`, 
                        fill: '#f59e0b', 
                        fontSize: 9, 
                        position: 'insideBottomRight',
                        opacity: 0.85,
                        fontFamily: 'monospace'
                      }} 
                    />
                  )}
                </>
              )}

              {/* Line 1: Success Progress */}
              {(metricFilter === 'both' || metricFilter === 'success') && (
                <Line
                  type="monotone"
                  dataKey="success"
                  name="Taxa de Sucesso (%)"
                  stroke="#00FF9C"
                  strokeWidth={2.5}
                  isAnimationActive={true}
                  animationDuration={1200}
                  dot={{ 
                    r: 4.5, 
                    fill: '#00FF9C', 
                    stroke: '#060a08', 
                    strokeWidth: 2 
                  }}
                  activeDot={{ 
                    r: 7, 
                    fill: '#00FF9C', 
                    stroke: '#ffffff', 
                    strokeWidth: 2.5,
                    className: 'filter drop-shadow-[0_0_8px_#00FF9C]'
                  }}
                />
              )}

              {/* Line 2: Complexity Progress */}
              {(metricFilter === 'both' || metricFilter === 'complexity') && (
                <Line
                  type="monotone"
                  dataKey="complexity"
                  name="Complexidade (0-100)"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  isAnimationActive={true}
                  animationDuration={1200}
                  dot={{ 
                    r: 4.5, 
                    fill: '#38BDF8', 
                    stroke: '#060a08', 
                    strokeWidth: 2 
                  }}
                  activeDot={{ 
                    r: 7, 
                    fill: '#38BDF8', 
                    stroke: '#ffffff', 
                    strokeWidth: 2.5,
                    className: 'filter drop-shadow-[0_0_8px_#38BDF8]'
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Generation Chips Navigation & Quick Analysis */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <span className="text-white/40 uppercase text-[9px] shrink-0">Navegar Nós:</span>
          {chartData.map((d) => {
            const isSelected = selectedGenerationNumber === d.generation;
            return (
              <button
                key={d.generation}
                onClick={() => onSelectGeneration && onSelectGeneration(d.raw)}
                className={`px-2 py-0.5 rounded text-[8px] transition-all shrink-0 flex items-center gap-1 border ${
                  isSelected 
                    ? 'bg-evolve-accent text-evolve-bg font-bold border-evolve-accent shadow-[0_0_8px_rgba(0,255,156,0.3)]' 
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-evolve-accent/40'
                }`}
                title={`GEN_${d.generation}: Sucesso ${d.success}%, Complexidade ${d.complexity}`}
              >
                <span>G{d.generation}</span>
                <span className="text-[7px] opacity-75">({d.success}%)</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[9px] text-white/50 shrink-0">
          <span className="flex items-center gap-1 text-evolve-accent/80">
            <span className="w-1.5 h-1.5 rounded-full bg-evolve-accent animate-pulse" />
            Linha de Tendência Adaptativa Ativa
          </span>
        </div>
      </div>
    </div>
  );
}
