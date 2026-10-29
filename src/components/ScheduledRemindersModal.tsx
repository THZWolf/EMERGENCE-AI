/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  FlaskConical, 
  Cpu, 
  Sparkles, 
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react';
import { ScheduledReminder } from '../types';
import { 
  DEFAULT_REMINDERS, 
  requestBrowserNotificationPermission,
  getCurrentTimeString 
} from '../utils/reminders';

interface ScheduledRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ScheduledReminder[];
  onUpdateReminders: (updated: ScheduledReminder[]) => void;
  onTriggerTestReminder: (reminder: ScheduledReminder) => void;
}

export default function ScheduledRemindersModal({
  isOpen,
  onClose,
  reminders,
  onUpdateReminders,
  onTriggerTestReminder,
}: ScheduledRemindersModalProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState(() => {
    // Default to 1 hour from now
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return getCurrentTimeString(d);
  });
  const [newDays, setNewDays] = useState<'daily' | 'weekdays' | 'weekend'>('daily');
  const [newFocusTarget, setNewFocusTarget] = useState<'core' | 'sandbox'>('core');
  const [newNote, setNewNote] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return null;
  });

  if (!isOpen) return null;

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    onUpdateReminders(updated);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    onUpdateReminders(updated);
  };

  const handleResetDefaults = () => {
    onUpdateReminders([...DEFAULT_REMINDERS]);
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime) return;

    const newReminder: ScheduledReminder = {
      id: `rem_${Date.now()}`,
      title: newTitle.trim(),
      time: newTime,
      enabled: true,
      days: newDays,
      focusTarget: newFocusTarget,
      note: newNote.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onUpdateReminders([...reminders, newReminder]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewNote('');
  };

  const handleAddQuickPreset = (title: string, time: string, focusTarget: 'core' | 'sandbox') => {
    const newReminder: ScheduledReminder = {
      id: `rem_${Date.now()}`,
      title,
      time,
      enabled: true,
      days: 'daily',
      focusTarget,
      note: 'Lembrete gerado via predefinição rápida.',
      createdAt: new Date().toISOString()
    };
    onUpdateReminders([...reminders, newReminder]);
  };

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    if (perm) {
      setNotificationPermission(perm);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#0c120f] border border-evolve-line/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-evolve-line bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-evolve-accent/15 border border-evolve-accent/40 text-evolve-accent flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                Agendador de Lembretes Evolutivos
                <span className="text-[9px] px-2 py-0.5 rounded font-mono bg-evolve-accent/20 text-evolve-accent border border-evolve-accent/30">
                  {reminders.filter(r => r.enabled).length} ATIVOS
                </span>
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                Notificações programadas para monitorar convergência, anomalias e novas gerações
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
          {/* Browser Notification Permission Banner */}
          <div className="p-3.5 rounded-xl border border-evolve-line bg-black/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-evolve-accent shrink-0" />
              <div>
                <span className="text-white font-bold">Notificações Nativas do Sistema:</span>{' '}
                <span className={
                  notificationPermission === 'granted' ? 'text-emerald-400 font-bold' :
                  notificationPermission === 'denied' ? 'text-red-400 font-bold' : 'text-amber-400'
                }>
                  {notificationPermission === 'granted' ? 'Permissão Concedida' :
                   notificationPermission === 'denied' ? 'Bloqueada nas configurações do navegador' : 'Pendente de Ativação'}
                </span>
              </div>
            </div>

            {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 rounded-lg border border-evolve-accent/40 bg-evolve-accent/10 text-evolve-accent hover:bg-evolve-accent/20 transition-all text-[10px] font-bold uppercase tracking-wider shrink-0"
              >
                Permitir no Navegador
              </button>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-evolve-accent" />
                Predefinições Rápidas de Horário
              </span>
              <span className="text-[10px] font-mono text-white/40">Clique para adicionar instantaneamente</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleAddQuickPreset('Inspeção Matinal', '09:00', 'core')}
                className="p-2 border border-evolve-line rounded-lg text-left bg-black/20 hover:border-evolve-accent/50 hover:bg-evolve-accent/5 transition-all text-[10px] font-mono"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>09:00</span>
                  <span className="text-[8px] text-evolve-accent">CORE</span>
                </div>
                <div className="text-white/40 truncate">Inspeção Matinal</div>
              </button>

              <button
                onClick={() => handleAddQuickPreset('Revisão do Sandbox', '14:00', 'sandbox')}
                className="p-2 border border-evolve-line rounded-lg text-left bg-black/20 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-[10px] font-mono"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>14:00</span>
                  <span className="text-[8px] text-amber-400">SANDBOX</span>
                </div>
                <div className="text-white/40 truncate">Revisão do Sandbox</div>
              </button>

              <button
                onClick={() => handleAddQuickPreset('Auditoria de Anomalias', '18:30', 'core')}
                className="p-2 border border-evolve-line rounded-lg text-left bg-black/20 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-[10px] font-mono"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>18:30</span>
                  <span className="text-[8px] text-red-400">AUDIT</span>
                </div>
                <div className="text-white/40 truncate">Auditoria -2σ</div>
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setMinutes(d.getMinutes() + 15);
                  handleAddQuickPreset('Checagem Rápida (+15 min)', getCurrentTimeString(d), 'core');
                }}
                className="p-2 border border-evolve-line rounded-lg text-left bg-black/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-[10px] font-mono"
              >
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>+15 min</span>
                  <span className="text-[8px] text-cyan-400">TESTE</span>
                </div>
                <div className="text-white/40 truncate">Lembrete Curto</div>
              </button>
            </div>
          </div>

          {/* Reminders List Header & Add Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-evolve-accent" />
                Lembretes Configurados ({reminders.length})
              </h3>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-evolve-accent/15 border border-evolve-accent/40 text-evolve-accent hover:bg-evolve-accent/25 transition-all text-xs font-mono font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Cancelar' : 'Novo Lembrete'}</span>
              </button>
            </div>

            {/* Add New Reminder Form (Collapsible) */}
            <AnimatePresence>
              {isAddingNew && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateReminder}
                  className="p-4 rounded-xl border border-evolve-accent/40 bg-black/50 space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono uppercase text-white/50">Título do Lembrete</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Checagem de Estabilidade do Ciclo"
                        className="w-full bg-[#121c17] border border-evolve-line rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-evolve-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-white/50">Horário (24h)</label>
                      <input
                        type="time"
                        required
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-[#121c17] border border-evolve-line rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-evolve-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-white/50">Frequência</label>
                      <select
                        value={newDays}
                        onChange={(e: any) => setNewDays(e.target.value)}
                        className="w-full bg-[#121c17] border border-evolve-line rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-evolve-accent"
                      >
                        <option value="daily">Diariamente (Todos os dias)</option>
                        <option value="weekdays">Dias Úteis (Segunda a Sexta)</option>
                        <option value="weekend">Fim de Semana (Sábado e Domingo)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-white/50">Área de Foco</label>
                      <div className="flex gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setNewFocusTarget('core')}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                            newFocusTarget === 'core'
                              ? 'bg-evolve-accent text-evolve-bg border-evolve-accent font-bold'
                              : 'bg-black/30 border-evolve-line text-white/50'
                          }`}
                        >
                          <Cpu className="w-3 h-3" />
                          Framework
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewFocusTarget('sandbox')}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                            newFocusTarget === 'sandbox'
                              ? 'bg-amber-500 text-black border-amber-500 font-bold'
                              : 'bg-black/30 border-evolve-line text-white/50'
                          }`}
                        >
                          <FlaskConical className="w-3 h-3" />
                          Sandbox
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-white/50">Nota / Instrução (Opcional)</label>
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ex: Verificar se a taxa de sucesso mantém-se acima de 80%"
                      className="w-full bg-[#121c17] border border-evolve-line rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-evolve-accent"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-white/40 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-evolve-accent text-evolve-bg text-xs font-mono font-bold uppercase tracking-wider hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,156,0.3)]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Salvar Lembrete
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Reminders */}
            <div className="space-y-2">
              {reminders.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-evolve-line rounded-xl text-white/40 font-mono text-xs">
                  Nenhum lembrete configurado. Use as predefinições acima ou crie um novo.
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      reminder.enabled
                        ? 'bg-black/40 border-evolve-line hover:border-evolve-accent/40'
                        : 'bg-black/20 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Toggle Button */}
                      <button
                        onClick={() => handleToggleReminder(reminder.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          reminder.enabled
                            ? 'bg-evolve-accent border-evolve-accent text-evolve-bg'
                            : 'border-white/20 text-transparent hover:border-white/40'
                        }`}
                        title={reminder.enabled ? 'Desativar Lembrete' : 'Ativar Lembrete'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Time Badge */}
                      <div className="font-mono text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded border border-white/10">
                        {reminder.time}
                      </div>

                      {/* Info & Labels */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {reminder.title}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase border ${
                            reminder.focusTarget === 'core'
                              ? 'border-evolve-accent/30 bg-evolve-accent/10 text-evolve-accent'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          }`}>
                            {reminder.focusTarget === 'core' ? 'Framework' : 'Sandbox'}
                          </span>
                          <span className="text-[9px] font-mono text-white/40">
                            {reminder.days === 'daily' ? 'Diário' : reminder.days === 'weekdays' ? 'Dias úteis' : 'Fim de semana'}
                          </span>
                        </div>
                        {reminder.note && (
                          <p className="text-[10px] text-white/50 font-mono truncate mt-0.5">
                            {reminder.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Test and Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onTriggerTestReminder(reminder)}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-evolve-accent/40 text-white/40 hover:text-evolve-accent bg-white/5 transition-all"
                        title="Testar disparo deste lembrete agora"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir lembrete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
