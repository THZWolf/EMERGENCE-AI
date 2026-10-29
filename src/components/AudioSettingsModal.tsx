/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Volume1, 
  X, 
  Play, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  Check, 
  RotateCcw,
  Smartphone,
  Info
} from 'lucide-react';
import { AudioSettings } from '../types';
import { 
  playGenerationCompleteSound, 
  playAnomalyAlertSound, 
  DEFAULT_AUDIO_SETTINGS 
} from '../utils/soundEffects';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AudioSettings;
  onUpdateSettings: (newSettings: AudioSettings) => void;
}

export default function AudioSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: AudioSettingsModalProps) {
  const [activeTest, setActiveTest] = useState<'generation' | 'anomaly' | null>(null);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const updated: AudioSettings = {
      ...settings,
      soundEnabled: !settings.soundEnabled,
    };
    onUpdateSettings(updated);
    if (!settings.soundEnabled) {
      // Play a very subtle test chime when unmuting
      playGenerationCompleteSound(updated);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const updated: AudioSettings = {
      ...settings,
      volume: newVolume,
    };
    onUpdateSettings(updated);
  };

  const handleToggleHaptics = () => {
    const updated: AudioSettings = {
      ...settings,
      hapticsEnabled: !settings.hapticsEnabled,
    };
    onUpdateSettings(updated);
  };

  const handleResetDefaults = () => {
    onUpdateSettings({ ...DEFAULT_AUDIO_SETTINGS });
    playGenerationCompleteSound(DEFAULT_AUDIO_SETTINGS);
  };

  const testSound = (type: 'generation' | 'anomaly') => {
    setActiveTest(type);
    if (type === 'generation') {
      playGenerationCompleteSound({ ...settings, soundEnabled: true });
    } else {
      playAnomalyAlertSound({ ...settings, soundEnabled: true });
    }

    setTimeout(() => {
      setActiveTest(null);
    }, 600);
  };

  const volumePercent = Math.round(settings.volume * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-[#0c120f] border border-evolve-line/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-evolve-line bg-black/40">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
              settings.soundEnabled 
                ? 'bg-evolve-accent/15 border-evolve-accent/40 text-evolve-accent' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                Configurações de Áudio & Haptics
                <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                  settings.soundEnabled 
                    ? 'bg-evolve-accent/20 text-evolve-accent border border-evolve-accent/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {settings.soundEnabled ? 'ÁUDIO ATIVO' : 'SILENCIADO'}
                </span>
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                Sinais acústicos discretos e vibrações táticas para eventos críticos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Master Sound Switch */}
          <div className="p-4 rounded-xl border border-evolve-line bg-black/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Efeitos Sonoros do Sistema
                </span>
                {settings.soundEnabled && (
                  <span className="w-2 h-2 rounded-full bg-evolve-accent animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-white/50">
                Emite beeps e acordes sutis ao concluir gerações e disparar anomalias estatísticas.
              </p>
            </div>

            <button
              onClick={handleToggleSound}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.soundEnabled
                  ? 'bg-evolve-accent border-evolve-accent shadow-[0_0_15px_rgba(0,255,156,0.4)]'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#0c120f] shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  settings.soundEnabled ? 'translate-x-6 text-evolve-accent' : 'translate-x-0 text-white/40'
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className={`p-4 rounded-xl border border-evolve-line bg-black/30 space-y-3 transition-opacity ${
            settings.soundEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-evolve-accent" />
                <label htmlFor="volume-slider" className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Volume dos Sinais Sonoros
                </label>
              </div>
              <span className="text-xs font-mono font-bold text-evolve-accent bg-evolve-accent/10 px-2 py-0.5 rounded border border-evolve-accent/20">
                {volumePercent}% {volumePercent <= 25 ? '(Discreto)' : volumePercent <= 50 ? '(Moderado)' : '(Alto)'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Volume1 className="w-4 h-4 text-white/40" />
              <input
                id="volume-slider"
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-evolve-accent focus:outline-none"
              />
              <Volume2 className="w-4 h-4 text-white/70" />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-white/40">
              <button 
                onClick={() => handleVolumeChange(0.15)} 
                className="hover:text-evolve-accent underline underline-offset-2 transition-colors"
              >
                Ultra-sutil (15%)
              </button>
              <button 
                onClick={() => handleVolumeChange(0.25)} 
                className="hover:text-evolve-accent underline underline-offset-2 transition-colors font-bold text-white/60"
              >
                Recomendado (25%)
              </button>
              <button 
                onClick={() => handleVolumeChange(0.50)} 
                className="hover:text-evolve-accent underline underline-offset-2 transition-colors"
              >
                Médio (50%)
              </button>
            </div>
          </div>

          {/* Haptics Switch */}
          <div className="p-4 rounded-xl border border-evolve-line bg-black/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-evolve-accent" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Feedback Háptico / Vibração
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Emite pulso de vibração sutil ao concluir tarefas ou registrar alertas em hardware compatível.
              </p>
            </div>

            <button
              onClick={handleToggleHaptics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.hapticsEnabled
                  ? 'bg-evolve-accent border-evolve-accent'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0c120f] shadow transition duration-200 ease-in-out ${
                  settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interactive Test Bench */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-evolve-accent" />
                Bancada de Teste Acústico (Prévia em Tempo Real)
              </h3>
              <span className="text-[10px] font-mono text-white/40">Clique para testar cada efeito</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Test Generation Sound */}
              <div className="p-3.5 rounded-xl border border-evolve-line bg-black/20 hover:border-evolve-accent/40 transition-all flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-evolve-accent/15 border border-evolve-accent/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-evolve-accent" />
                    </div>
                    <span className="text-xs font-mono font-bold text-white">Geração Concluída</span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Acorde harmônico cristalino e suave (C5-E5-G5, ~250ms). Disparado ao sintetizar uma nova geração com sucesso.
                  </p>
                </div>

                <button
                  onClick={() => testSound('generation')}
                  className={`w-full py-2 px-3 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTest === 'generation'
                      ? 'bg-evolve-accent text-evolve-bg border-evolve-accent shadow-[0_0_15px_rgba(0,255,156,0.4)]'
                      : 'bg-evolve-accent/10 border-evolve-accent/30 text-evolve-accent hover:bg-evolve-accent/20'
                  }`}
                >
                  <Play className={`w-3 h-3 ${activeTest === 'generation' ? 'animate-spin' : ''}`} />
                  <span>{activeTest === 'generation' ? 'Reproduzindo...' : 'Testar Som de Sucesso'}</span>
                </button>
              </div>

              {/* Test Anomaly Alert Sound */}
              <div className="p-3.5 rounded-xl border border-evolve-line bg-black/20 hover:border-red-500/40 transition-all flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                      <ShieldAlert className="w-3 h-3 text-red-400" />
                    </div>
                    <span className="text-xs font-mono font-bold text-red-300">Alerta de Anomalia (-2σ)</span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Pulso sonar tático discreto de advertência (310Hz → 240Hz). Disparado quando métricas caem abaixo do limite histórico.
                  </p>
                </div>

                <button
                  onClick={() => testSound('anomaly')}
                  className={`w-full py-2 px-3 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTest === 'anomaly'
                      ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  <AlertTriangle className={`w-3 h-3 ${activeTest === 'anomaly' ? 'animate-bounce' : ''}`} />
                  <span>{activeTest === 'anomaly' ? 'Reproduzindo...' : 'Testar Som de Alerta'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Technical Info Banner */}
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-start gap-2.5 text-[11px] text-white/50 font-mono">
            <Info className="w-4 h-4 text-evolve-accent shrink-0 mt-0.5" />
            <p>
              Os sons utilizam síntese aditiva direta pela <strong className="text-white/80">Web Audio API</strong> nativa do navegador, operando sem dependências de arquivos de áudio externos com latência inferior a 5ms.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-evolve-line bg-black/40">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-evolve-accent text-evolve-bg font-mono text-xs font-bold uppercase tracking-wider hover:bg-evolve-accent/90 shadow-[0_0_15px_rgba(0,255,156,0.3)] transition-all flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Concluir</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
