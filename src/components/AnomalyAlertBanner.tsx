/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  X, 
  ArrowRight, 
  FlaskConical, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AnomalyAlert } from '../types';

interface AnomalyAlertBannerProps {
  alert: AnomalyAlert;
  onDismiss: () => void;
  onSendToSandbox?: (problemTitle: string) => void;
  onRetryWithSynergy?: () => void;
  sigmaMultiplier?: number;
  soundEnabled?: boolean;
  onToggleMute?: () => void;
}

export default function AnomalyAlertBanner({
  alert,
  onDismiss,
  onSendToSandbox,
  onRetryWithSynergy,
  sigmaMultiplier = 2.0,
  soundEnabled = true,
  onToggleMute,
}: AnomalyAlertBannerProps) {
  const isCritical = alert.severity === 'critical';
  const genLabel = `GEN_${alert.generation.toString().padStart(4, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-xl border p-4 md:p-5 relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all ${
        isCritical
          ? 'border-red-500/60 bg-[#160808]/95 shadow-[0_0_40px_rgba(239,68,68,0.25)]'
          : 'border-amber-500/60 bg-[#160f08]/95 shadow-[0_0_35px_rgba(245,158,11,0.2)]'
      }`}
    >
      {/* Top Background Alarm Wave / Radar Glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isCritical ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse' : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 animate-pulse'
      }`} />

      {/* Main Alert Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
            isCritical
              ? 'border-red-500/60 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-bounce'
              : 'border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
          }`}>
            {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
                isCritical 
                  ? 'border-red-500/50 bg-red-500/20 text-red-300' 
                  : 'border-amber-500/50 bg-amber-500/20 text-amber-300'
              }`}>
                {isCritical ? 'REGRESSÃO CRÍTICA DETECTADA' : 'ANOMALIA ESTATÍSTICA'}
              </span>

              <span className="text-[10px] font-mono text-white/50">
                Piso Histórico: <strong>-{sigmaMultiplier}σ (95%)</strong>
              </span>

              <span className="text-[10px] font-mono text-evolve-accent font-bold">
                {genLabel}
              </span>
            </div>

            <h3 className="text-xs md:text-sm font-mono font-bold text-white tracking-wide mt-1 flex items-center gap-1.5">
              <span>{alert.problemTitle}</span>
            </h3>
          </div>
        </div>

        {/* Controls: Audio Mute & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors ${
                soundEnabled 
                  ? 'border-evolve-accent/30 bg-evolve-accent/10 text-evolve-accent hover:bg-evolve-accent/20' 
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
              }`}
              title={soundEnabled ? 'Silenciar alertas sonoros' : 'Ativar alertas sonoros'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
              <span className="hidden sm:inline text-[9px]">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Dispensar Notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Narrative Explanation */}
      <p className="text-xs font-mono text-white/80 leading-relaxed bg-black/40 border border-white/5 p-2.5 rounded-lg mb-4">
        {alert.details}
      </p>

      {/* Metrics Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Metric 1: Taxa de Sucesso */}
        <div className={`p-3 rounded-lg border transition-all ${
          alert.metrics.success.isBreached
            ? 'border-red-500/50 bg-red-950/20'
            : 'border-white/10 bg-black/30'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <TrendingDown className={`w-3.5 h-3.5 ${alert.metrics.success.isBreached ? 'text-red-400' : 'text-evolve-accent'}`} />
              Taxa de Sucesso
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
              alert.metrics.success.isBreached
                ? 'border-red-500/60 bg-red-500/20 text-red-300'
                : 'border-evolve-accent/40 bg-evolve-accent/10 text-evolve-accent'
            }`}>
              {alert.metrics.success.isBreached ? `VIOLADO (${alert.metrics.success.sigmaDistance}σ)` : 'NORMAL'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-xl font-mono font-bold ${alert.metrics.success.isBreached ? 'text-red-400' : 'text-white'}`}>
              {alert.metrics.success.value}%
            </span>
            <div className="text-[9px] font-mono text-right text-white/50">
              <div>Limite (-{sigmaMultiplier}σ): <strong className="text-white/80">{alert.metrics.success.threshold}%</strong></div>
              <div>Média Histórica: <span className="text-white/70">{alert.metrics.success.mean}% (σ={alert.metrics.success.stdDev})</span></div>
            </div>
          </div>

          {/* Comparative Bar */}
          <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
            <div 
              className={`h-full rounded-full transition-all ${alert.metrics.success.isBreached ? 'bg-red-500' : 'bg-evolve-accent'}`}
              style={{ width: `${Math.min(100, alert.metrics.success.value)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Complexidade */}
        <div className={`p-3 rounded-lg border transition-all ${
          alert.metrics.complexity.isBreached
            ? 'border-red-500/50 bg-red-950/20'
            : 'border-white/10 bg-black/30'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Activity className={`w-3.5 h-3.5 ${alert.metrics.complexity.isBreached ? 'text-red-400' : 'text-cyan-400'}`} />
              Índice de Complexidade
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border ${
              alert.metrics.complexity.isBreached
                ? 'border-red-500/60 bg-red-500/20 text-red-300'
                : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
            }`}>
              {alert.metrics.complexity.isBreached ? `VIOLADO (${alert.metrics.complexity.sigmaDistance}σ)` : 'NORMAL'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-xl font-mono font-bold ${alert.metrics.complexity.isBreached ? 'text-red-400' : 'text-white'}`}>
              {alert.metrics.complexity.value}
            </span>
            <div className="text-[9px] font-mono text-right text-white/50">
              <div>Limite (-{sigmaMultiplier}σ): <strong className="text-white/80">{alert.metrics.complexity.threshold}</strong></div>
              <div>Média Histórica: <span className="text-white/70">{alert.metrics.complexity.mean} (σ={alert.metrics.complexity.stdDev})</span></div>
            </div>
          </div>

          {/* Comparative Bar */}
          <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
            <div 
              className={`h-full rounded-full transition-all ${alert.metrics.complexity.isBreached ? 'bg-red-500' : 'bg-cyan-400'}`}
              style={{ width: `${Math.min(100, alert.metrics.complexity.value)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Suggested Action & Resolution CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/70">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{alert.suggestedAction}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSendToSandbox && (
            <button
              onClick={() => onSendToSandbox(alert.problemTitle)}
              className="px-3 py-1.5 bg-amber-500 text-black rounded font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            >
              <FlaskConical className="w-3 h-3" />
              Isolar no Sandbox
            </button>
          )}

          {onRetryWithSynergy && (
            <button
              onClick={onRetryWithSynergy}
              className="px-3 py-1.5 bg-evolve-accent text-evolve-bg rounded font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-300 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Reiterar com Sinergia
            </button>
          )}

          <button
            onClick={onDismiss}
            className="px-3 py-1.5 border border-white/20 text-white/60 hover:text-white rounded font-mono text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all"
          >
            Reconhecer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
