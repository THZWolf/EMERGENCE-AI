/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  BellRing, 
  Clock, 
  X, 
  ArrowRight, 
  Cpu, 
  FlaskConical, 
  Activity, 
  ShieldCheck, 
  ShieldAlert,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { ScheduledReminder, AppState } from '../types';

interface ScheduledReminderBannerProps {
  reminder: ScheduledReminder;
  appState: AppState;
  onDismiss: () => void;
  onNavigate: (view: 'core' | 'sandbox') => void;
  onSnooze: (minutes: number) => void;
}

export default function ScheduledReminderBanner({
  reminder,
  appState,
  onDismiss,
  onNavigate,
  onSnooze,
}: ScheduledReminderBannerProps) {
  const latestSolution = appState.history[0];
  const genString = `GEN_${appState.currentGeneration.toString().padStart(4, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl border border-cyan-500/50 bg-[#071318]/95 p-5 relative overflow-hidden backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.25)] font-sans"
    >
      {/* Top Gradient Highlight Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 animate-pulse" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-bounce">
            <BellRing className="w-5 h-5 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                LEMBRETE EVOLUTIVO PROGRAMADO
              </span>
              <span className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Horário Agendado: <strong className="text-white">{reminder.time}</strong>
              </span>
            </div>

            <h3 className="text-sm md:text-base font-mono font-bold text-white tracking-wide mt-1">
              {reminder.title}
            </h3>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Dispensar Lembrete"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Narrative or Instruction Note */}
      {reminder.note && (
        <p className="text-xs font-mono text-cyan-100/90 leading-relaxed bg-black/40 border border-cyan-500/20 p-3 rounded-xl mb-4">
          💡 <strong>Diretriz Agendada:</strong> {reminder.note}
        </p>
      )}

      {/* Telemetry Snapshot: Current State of AI Evolution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-[10px]">
        <div className="p-2.5 rounded-lg border border-white/10 bg-black/30">
          <span className="text-white/40 block">Geração Atual</span>
          <span className="text-sm font-bold text-evolve-accent">{genString}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-white/10 bg-black/30">
          <span className="text-white/40 block">Último Sucesso</span>
          <span className="text-sm font-bold text-white">
            {latestSolution ? `${latestSolution.successRate}%` : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg border border-white/10 bg-black/30">
          <span className="text-white/40 block">Complexidade</span>
          <span className="text-sm font-bold text-cyan-400">
            {latestSolution ? latestSolution.complexityScore : 'N/A'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg border border-white/10 bg-black/30">
          <span className="text-white/40 block">Status de Monitor</span>
          <div className="flex items-center gap-1 mt-0.5">
            {appState.activeAnomaly ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                Alerta -2σ
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Estável
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSnooze(15)}
            className="px-3 py-1.5 border border-white/20 text-white/70 hover:text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all"
            title="Lembrar novamente daqui a 15 minutos"
          >
            Adiar (+15 min)
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('core')}
            className={`px-3.5 py-1.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              reminder.focusTarget === 'core'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-400'
                : 'border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Checar Framework</span>
          </button>

          <button
            onClick={() => onNavigate('sandbox')}
            className={`px-3.5 py-1.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              reminder.focusTarget === 'sandbox'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-400'
                : 'border border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <FlaskConical className="w-3 h-3" />
            <span>Checar Sandbox</span>
          </button>

          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] uppercase tracking-wider transition-all"
          >
            Reconhecer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
