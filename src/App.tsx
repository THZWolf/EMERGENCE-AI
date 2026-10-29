/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Brain, 
  Zap, 
  History, 
  Globe, 
  Dna, 
  Sparkles, 
  Search, 
  AlertTriangle, 
  ChevronRight, 
  Terminal, 
  Layers, 
  Fingerprint, 
  Database,
  FlaskConical,
  ExternalLink,
  BookOpen,
  Library,
  Atom,
  Clock,
  CheckCircle2,
  Award,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Gauge,
  Save,
  HardDrive,
  RotateCcw,
  Volume2,
  VolumeX,
  Volume1,
  SlidersHorizontal,
  Bell,
  BellRing,
  Target,
  FileText
} from 'lucide-react';
import { evolveAI } from './services/geminiService';
import { 
  AppState, 
  ProblemSolution, 
  SubAgentVision, 
  LegacyKnowledge, 
  KnowledgeEntry,
  SandboxHypothesis,
  AnomalyAlert,
  AudioSettings,
  ScheduledReminder,
  CreativeHypothesis
} from './types';
import { INITIAL_MEMORY, SUB_AGENTS, INITIAL_HISTORY, INITIAL_CREATIVE_HYPOTHESES } from './constants';
import MemoryBridge from './components/MemoryBridge';
import ExternalKnowledgeModal from './components/ExternalKnowledgeModal';
import TestingSandbox from './components/TestingSandbox';
import GenerationEvolutionChart from './components/GenerationEvolutionChart';
import AnomalyAlertBanner from './components/AnomalyAlertBanner';
import AudioSettingsModal from './components/AudioSettingsModal';
import ScheduledRemindersModal from './components/ScheduledRemindersModal';
import ScheduledReminderBanner from './components/ScheduledReminderBanner';
import MemoryManager from './components/MemoryManager';
import HypothesisModule from './components/HypothesisModule';
import { evaluateGenerationAnomaly, getHistoricalThresholds } from './utils/statisticalMonitor';
import { loadPersistedState, persistState, clearPersistedState } from './utils/storage';
import { 
  loadAudioSettings, 
  persistAudioSettings, 
  playGenerationCompleteSound, 
  playAnomalyAlertSound,
  playReminderChimeSound
} from './utils/soundEffects';
import { 
  DEFAULT_REMINDERS, 
  checkDueReminders, 
  getTodayDateString, 
  getCurrentTimeString, 
  sendBrowserNotification, 
  getNextUpcomingReminder 
} from './utils/reminders';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const persisted = loadPersistedState();
    const defaultAudio = loadAudioSettings();
    if (persisted) {
      return {
        currentGeneration: persisted.currentGeneration ?? (INITIAL_HISTORY.length > 0 ? INITIAL_HISTORY[0].generation + 1 : 1),
        knowledgeBank: persisted.knowledgeBank ?? INITIAL_MEMORY,
        history: persisted.history ?? INITIAL_HISTORY,
        isThinking: false,
        currentProcess: persisted.currentProcess ?? (persisted.history?.[0] || INITIAL_HISTORY[0] || null),
        legacyKnowledge: persisted.legacyKnowledge ?? [],
        sandboxHypotheses: persisted.sandboxHypotheses ?? [],
        creativeHypotheses: persisted.creativeHypotheses ?? INITIAL_CREATIVE_HYPOTHESES,
        activeAnomaly: persisted.activeAnomaly ?? null,
        sigmaMultiplier: persisted.sigmaMultiplier ?? 2.0,
        audioSettings: persisted.audioSettings ?? defaultAudio,
        scheduledReminders: persisted.scheduledReminders && persisted.scheduledReminders.length > 0 ? persisted.scheduledReminders : DEFAULT_REMINDERS,
        activeReminderNotification: null,
      };
    }
    return {
      currentGeneration: INITIAL_HISTORY.length > 0 ? INITIAL_HISTORY[0].generation + 1 : 1,
      knowledgeBank: INITIAL_MEMORY,
      history: INITIAL_HISTORY,
      isThinking: false,
      currentProcess: INITIAL_HISTORY[0] || null,
      legacyKnowledge: [],
      sandboxHypotheses: [],
      creativeHypotheses: INITIAL_CREATIVE_HYPOTHESES,
      activeAnomaly: null,
      sigmaMultiplier: 2.0,
      audioSettings: defaultAudio,
      scheduledReminders: DEFAULT_REMINDERS,
      activeReminderNotification: null,
    };
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date>(() => new Date());
  const stateRef = useRef(state);
  stateRef.current = state;

  const [activeView, setActiveView] = useState<'core' | 'memories' | 'hypotheses' | 'sandbox'>('core');
  const [input, setInput] = useState('');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [contributorFilter, setContributorFilter] = useState('All');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [systemNotification, setSystemNotification] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleUpdateAudioSettings = (newSettings: AudioSettings) => {
    setState(prev => ({ ...prev, audioSettings: newSettings }));
    persistAudioSettings(newSettings);
  };

  const handleToggleAudioMute = () => {
    const current = state.audioSettings || loadAudioSettings();
    const updated: AudioSettings = { ...current, soundEnabled: !current.soundEnabled };
    handleUpdateAudioSettings(updated);
    showNotification(updated.soundEnabled ? 'Sinais sonoros do sistema ativados.' : 'Áudio do sistema silenciado.');
    if (updated.soundEnabled) {
      playGenerationCompleteSound(updated);
    }
  };

  const handleUpdateReminders = (updated: ScheduledReminder[]) => {
    setState(prev => ({ ...prev, scheduledReminders: updated }));
    showNotification(`${updated.length} lembretes atualizados.`);
  };

  const handleTriggerTestReminder = (reminder: ScheduledReminder) => {
    setState(prev => ({
      ...prev,
      activeReminderNotification: reminder
    }));
    playReminderChimeSound(state.audioSettings);
    sendBrowserNotification(reminder, state.currentGeneration);
    showNotification(`⏰ Lembrete disparado: ${reminder.title}`);
  };

  const handleSnoozeReminder = (minutes: number = 15) => {
    const current = state.activeReminderNotification;
    if (!current) return;

    const snoozeDate = new Date();
    snoozeDate.setMinutes(snoozeDate.getMinutes() + minutes);
    const snoozeTimeStr = getCurrentTimeString(snoozeDate);

    const snoozedReminder: ScheduledReminder = {
      ...current,
      id: `rem_snooze_${Date.now()}`,
      title: `[Adiado] ${current.title}`,
      time: snoozeTimeStr,
      enabled: true,
      lastTriggeredDate: undefined
    };

    setState(prev => ({
      ...prev,
      activeReminderNotification: null,
      scheduledReminders: [...(prev.scheduledReminders || []), snoozedReminder]
    }));

    showNotification(`Lembrete adiado para às ${snoozeTimeStr}.`);
  };

  const handleNavigateFromReminder = (view: 'core' | 'sandbox') => {
    setActiveView(view);
    setState(prev => ({ ...prev, activeReminderNotification: null }));
  };

  // Scheduled Reminders Ticker: checks every 10 seconds for due scheduled reminders
  useEffect(() => {
    const reminderTicker = setInterval(() => {
      const reminders = stateRef.current.scheduledReminders || [];
      const due = checkDueReminders(reminders, new Date());
      if (due) {
        const todayStr = getTodayDateString(new Date());
        const updated = reminders.map(r => r.id === due.id ? { ...r, lastTriggeredDate: todayStr } : r);
        setState(prev => ({
          ...prev,
          scheduledReminders: updated,
          activeReminderNotification: due
        }));

        playReminderChimeSound(stateRef.current.audioSettings);
        sendBrowserNotification(due, stateRef.current.currentGeneration);
      }
    }, 10000);

    return () => clearInterval(reminderTicker);
  }, []);

  // Notify user if session was restored from localStorage on mount
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted && persisted.history && persisted.history.length > 0) {
      showNotification(`Sessão restaurada do cache local (GEN_${persisted.currentGeneration?.toString().padStart(4, '0')}).`);
    }
  }, []);

  // Periodic Auto-Save: persists every 5 seconds to prevent data loss
  useEffect(() => {
    const intervalTimer = setInterval(() => {
      setSaveStatus('saving');
      const result = persistState(stateRef.current);
      if (result.success) {
        setSaveStatus('saved');
        setLastSavedTime(new Date(result.timestamp));
      } else {
        setSaveStatus('error');
      }
    }, 5000);

    return () => clearInterval(intervalTimer);
  }, []);

  // Debounced auto-save on every state modification
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSaveStatus('saving');
      const result = persistState(state);
      if (result.success) {
        setSaveStatus('saved');
        setLastSavedTime(new Date(result.timestamp));
      } else {
        setSaveStatus('error');
      }
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [state]);

  // Before-unload guarantee: flush latest state before session termination or page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistState(stateRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleManualSave = () => {
    setSaveStatus('saving');
    const result = persistState(state);
    if (result.success) {
      setSaveStatus('saved');
      setLastSavedTime(new Date(result.timestamp));
      showNotification(`Estado da Super IA sincronizado no LocalStorage às ${new Date().toLocaleTimeString()}.`);
    } else {
      setSaveStatus('error');
      showNotification('Falha ao gravar no armazenamento local.');
    }
  };

  const handleResetStorage = () => {
    if (window.confirm("Deseja redefinir o estado da Super IA para as configurações originais e limpar o cache local?")) {
      clearPersistedState();
      setState({
        currentGeneration: INITIAL_HISTORY.length > 0 ? INITIAL_HISTORY[0].generation + 1 : 1,
        knowledgeBank: INITIAL_MEMORY,
        history: INITIAL_HISTORY,
        isThinking: false,
        currentProcess: INITIAL_HISTORY[0] || null,
        legacyKnowledge: [],
        sandboxHypotheses: [],
        activeAnomaly: null,
        sigmaMultiplier: 2.0,
        audioSettings: loadAudioSettings(),
        scheduledReminders: DEFAULT_REMINDERS,
        activeReminderNotification: null,
      });
      showNotification("Cache local limpo. Estado restaurado para as definições de fábrica.");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.currentProcess]);

  const showNotification = (msg: string) => {
    setSystemNotification(msg);
    setTimeout(() => {
      setSystemNotification(null);
    }, 5000);
  };

  const validateInput = (val: string) => {
    if (!val.trim()) {
      return "O problema não pode estar vazio.";
    }
    if (val.trim().length < 10) {
      return "O problema deve ter pelo menos 10 caracteres para uma análise evolutiva consistente.";
    }
    if (val.trim().length > 500) {
      return "O problema não pode exceder 500 caracteres (máximo permitido).";
    }
    return null;
  };

  const handleEvolve = async () => {
    const validationError = validateInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setState(prev => ({ ...prev, isThinking: true }));

    try {
      const solution = await evolveAI(
        input, 
        state.currentGeneration, 
        state.knowledgeBank, 
        selectedAgents,
        useSearchGrounding
      );
      
      const newKnowledge: KnowledgeEntry[] = [
        {
          id: `know_${Date.now()}_1`,
          content: solution.solution,
          contributor: selectedAgents.length > 0 ? `Synergy [${selectedAgents.join("+")}]` : 'Integration',
          timestamp: new Date().toISOString(),
          tags: ['Solução', `Gen_${state.currentGeneration}`, ...selectedAgents],
          sourceType: 'generation'
        },
        {
          id: `know_${Date.now()}_2`,
          content: solution.improvement,
          contributor: 'System',
          timestamp: new Date().toISOString(),
          tags: ['Aprimoramento', 'Recursão'],
          sourceType: 'system'
        }
      ];

      const enrichedSolution: ProblemSolution = {
        ...solution,
        generation: state.currentGeneration,
        successRate: typeof solution.successRate === 'number' ? solution.successRate : Math.floor(82 + Math.random() * 15),
        complexityScore: typeof solution.complexityScore === 'number' ? solution.complexityScore : Math.floor(70 + Math.random() * 22),
        timestamp: solution.timestamp || new Date().toISOString()
      };

      // Run statistical monitoring inspection against historical baseline (-2σ)
      const anomaly = evaluateGenerationAnomaly(enrichedSolution, state.history, state.sigmaMultiplier || 2.0);

      setState(prev => ({
        ...prev,
        currentGeneration: prev.currentGeneration + 1,
        history: [enrichedSolution, ...prev.history],
        knowledgeBank: [...newKnowledge, ...prev.knowledgeBank],
        currentProcess: enrichedSolution,
        activeAnomaly: anomaly || prev.activeAnomaly,
        isThinking: false
      }));

      setInput('');
      setSelectedAgents([]);

      if (anomaly) {
        playAnomalyAlertSound(state.audioSettings);
        showNotification(`⚠️ ALERTA DE REGRESSÃO: Geração ${state.currentGeneration} violou o limite estatístico (-${state.sigmaMultiplier || 2.0}σ)!`);
      } else {
        playGenerationCompleteSound(state.audioSettings);
        showNotification(`Evolução concluída. Geração avançou para GEN_${(state.currentGeneration + 1).toString().padStart(4, '0')}.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na evolução generativa.');
      setState(prev => ({ ...prev, isThinking: false }));
    }
  };

  const handleIngestExternalKnowledge = (newEntries: KnowledgeEntry[]) => {
    setState(prev => ({
      ...prev,
      knowledgeBank: [...newEntries, ...prev.knowledgeBank],
    }));
    showNotification(`${newEntries.length} clusters de literatura externa integrados ao Banco de Conhecimento.`);
  };

  const handlePromoteHypothesis = (
    hypothesis: SandboxHypothesis,
    knowledgeEntry: KnowledgeEntry,
    promotedSolution: ProblemSolution
  ) => {
    const anomaly = evaluateGenerationAnomaly(promotedSolution, state.history, state.sigmaMultiplier || 2.0);

    setState(prev => ({
      ...prev,
      currentGeneration: prev.currentGeneration + 1,
      knowledgeBank: [knowledgeEntry, ...prev.knowledgeBank],
      history: [promotedSolution, ...prev.history],
      currentProcess: promotedSolution,
      sandboxHypotheses: [hypothesis, ...(prev.sandboxHypotheses || [])],
      activeAnomaly: anomaly || prev.activeAnomaly
    }));
    
    if (anomaly) {
      playAnomalyAlertSound(state.audioSettings);
      showNotification(`⚠️ Hipótese promovida com alerta de regressão estatística (-${state.sigmaMultiplier || 2.0}σ).`);
    } else {
      playGenerationCompleteSound(state.audioSettings);
      showNotification(`Hipótese "${hypothesis.title}" promovida com sucesso para o Framework Principal (Geração ${state.currentGeneration + 1})!`);
    }
    setActiveView('core');
  };

  // Diagnostic Test: Simulates a generation with metrics dropping below historical -2 sigma
  const handleSimulateAnomalyTest = () => {
    const testGenNumber = state.currentGeneration;
    const testDegradedSolution: ProblemSolution = {
      generation: testGenNumber,
      problem: "Injeção de Ruído Térmico e Instabilidade Dialética em Redes de Decisão",
      subAgents: SUB_AGENTS.slice(0, 2),
      reasoningSteps: [
        { type: 'UNDERSTAND', title: 'Perturbação Induzida', content: 'Injeção de divergência semântica para verificação do monitor estatístico.' },
        { type: 'LIMITATION', title: 'Perda de Coerência', content: 'Decaimento acentuado de consistência lógica frente aos axiomas anteriores.' },
        { type: 'HYPOTHESIS', title: 'Premissa Inconsistente', content: 'Tentativa de síntese sem acoplamento termodinâmico.' },
        { type: 'QUESTION', title: 'Contenção Requerida', content: 'Como reestabelecer o limiar mínimo de convergência?' }
      ],
      solution: "[SOLUÇÃO COM REGRESSÃO ESTATÍSTICA] A convergência lógica falhou em 48% dos testes de verificação cruzada, caracterizando uma degradação do modelo abaixo do piso histórico de tolerância.",
      analysis: "Taxa de Sucesso (52%) e Complexidade (46) colapsaram abaixo de 2 desvios padrão da média histórica dos ancestrais.",
      nextQuestion: "Como isolar esta regressão no Testing Sandbox antes de contaminar a árvore geracional?",
      improvement: "Disparo do sistema de monitoramento estatístico para isolamento imediato da anomalia.",
      successRate: 52, // well below mean (~84%) and threshold (~73%)
      complexityScore: 46, // well below mean (~73) and threshold (~58)
      timestamp: new Date().toISOString()
    };

    const anomaly = evaluateGenerationAnomaly(testDegradedSolution, state.history, state.sigmaMultiplier || 2.0);
    if (anomaly) {
      playAnomalyAlertSound(state.audioSettings);
      setState(prev => ({
        ...prev,
        activeAnomaly: anomaly,
        currentProcess: testDegradedSolution,
        history: [testDegradedSolution, ...prev.history],
        currentGeneration: prev.currentGeneration + 1
      }));
      showNotification(`⚠️ ALERTA DISPARADO: Regressão estatística detectada (Sucesso: 52%, Limite: ${anomaly.metrics.success.threshold}%)!`);
    }
  };

  const handleSendAlertToSandbox = (problemTitle: string) => {
    setActiveView('sandbox');
    showNotification(`Problema "${problemTitle.slice(0, 35)}..." isolado para validação no Testing Sandbox.`);
  };

  const handleRetryWithSynergy = () => {
    if (state.activeAnomaly) {
      setInput(state.activeAnomaly.problemTitle.replace(/\[.*?\]\s*/g, ''));
      setSelectedAgents(["Quantum Mechanics", "Filosofia", "Física"]);
      setState(prev => ({ ...prev, activeAnomaly: null }));
      showNotification(`Parâmetros de sinergia forçada aplicados. Pronto para re-evoluir.`);
    }
  };

  const handleSetSigmaMultiplier = (sigma: number) => {
    setState(prev => ({ ...prev, sigmaMultiplier: sigma }));
    showNotification(`Sensibilidade do monitor estatístico ajustada para ${sigma}σ.`);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (error) setError(null);
  };

  const toggleAgent = (specialty: string) => {
    setSelectedAgents(prev => 
      prev.includes(specialty) 
        ? prev.filter(a => a !== specialty) 
        : [...prev, specialty]
    );
  };

  const handleIntegrateLegacy = (legacy: LegacyKnowledge) => {
    const newEntries: KnowledgeEntry[] = legacy.findings.map((f, i) => ({
      id: `legacy_${Date.now()}_${i}`,
      content: f,
      contributor: legacy.source,
      timestamp: legacy.timestamp,
      tags: ['Legacy', 'Integration', legacy.source.split(' ')[0]],
      sourceType: 'legacy'
    }));

    setState(prev => ({
      ...prev,
      legacyKnowledge: [...prev.legacyKnowledge, legacy],
      knowledgeBank: [...newEntries, ...prev.knowledgeBank]
    }));
    showNotification(`Legado de ${legacy.source} sincronizado com sucesso.`);
  };

  const filterKnowledge = (bank: KnowledgeEntry[], query: string, contributor: string) => {
    return bank.filter(k => {
      const q = query.toLowerCase().trim();
      const matchesQuery = !q || (
        k.content.toLowerCase().includes(q) || 
        k.tags.some(t => t.toLowerCase().includes(q)) ||
        k.contributor.toLowerCase().includes(q)
      );
      
      const matchesContributor = contributor === 'All' || 
        (contributor === 'External Sources' && ['journal', 'archive', 'encyclopedia'].includes(k.sourceType || '')) ||
        (contributor === 'Sandbox' && k.sourceType === 'sandbox') ||
        k.contributor.toLowerCase().includes(contributor.toLowerCase());

      return matchesQuery && matchesContributor;
    });
  };

  const filteredKnowledge = filterKnowledge(state.knowledgeBank, knowledgeSearch, contributorFilter);
  const baseContributors = Array.from(new Set(state.knowledgeBank.map(k => k.contributor)));
  const contributors = ['All', 'External Sources', 'Sandbox', ...baseContributors];

  // Dynamic historical threshold computation for anomaly detection (-2σ)
  const monitoringThresholds = useMemo(() => {
    return getHistoricalThresholds(state.history, state.sigmaMultiplier || 2.0);
  }, [state.history, state.sigmaMultiplier]);

  // Compute next upcoming reminder for header telemetry
  const nextReminderInfo = useMemo(() => {
    return getNextUpcomingReminder(state.scheduledReminders || [], new Date());
  }, [state.scheduledReminders]);

  return (
    <div className="flex flex-col h-screen bg-evolve-bg text-evolve-text font-sans antialiased selection:bg-evolve-accent selection:text-evolve-bg overflow-hidden">
      {/* Memory Bridge Modal */}
      <MemoryBridge 
        isOpen={isBridgeOpen}
        onClose={() => setIsBridgeOpen(false)}
        onImport={handleIntegrateLegacy}
      />

      {/* External Knowledge Ingestion Modal */}
      <ExternalKnowledgeModal
        isOpen={isExternalModalOpen}
        onClose={() => setIsExternalModalOpen(false)}
        onIngestKnowledge={handleIngestExternalKnowledge}
      />

      {/* Audio & Haptic Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        settings={state.audioSettings || loadAudioSettings()}
        onUpdateSettings={handleUpdateAudioSettings}
      />

      {/* Scheduled Reminders Configuration Modal */}
      <ScheduledRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={state.scheduledReminders || DEFAULT_REMINDERS}
        onUpdateReminders={handleUpdateReminders}
        onTriggerTestReminder={handleTriggerTestReminder}
      />

      {/* High-Priority Active Scheduled Reminder Banner (Floating Notification) */}
      <AnimatePresence>
        {state.activeReminderNotification && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-auto">
            <ScheduledReminderBanner
              reminder={state.activeReminderNotification}
              appState={state}
              onDismiss={() => setState(prev => ({ ...prev, activeReminderNotification: null }))}
              onNavigate={handleNavigateFromReminder}
              onSnooze={handleSnoozeReminder}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {systemNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-lg border border-evolve-accent/40 bg-[#0c120f]/95 text-evolve-accent font-mono text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,156,0.2)] backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-evolve-accent" />
            <span>{systemNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Header Rail */}
      <header className="h-14 border-b border-evolve-line flex items-center justify-between px-6 bg-evolve-bg/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-evolve-accent flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(0,255,156,0.3)]">
              <Cpu className="w-4 h-4 text-evolve-accent" />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold tracking-widest text-white uppercase">Emergence AI</h1>
              <p className="text-[10px] font-mono text-evolve-accent/70">GEN_{state.currentGeneration.toString().padStart(4, '0')}</p>
            </div>
          </div>

          {/* Core Framework vs Memory Manager vs Hypothesis Module vs Testing Sandbox View Switcher */}
          <div className="hidden sm:flex items-center p-1 bg-black/40 border border-evolve-line rounded-lg">
            <button
              id="view-tab-core"
              onClick={() => setActiveView('core')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeView === 'core'
                  ? 'bg-evolve-accent text-evolve-bg font-bold shadow-[0_0_10px_rgba(0,255,156,0.2)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Cpu className="w-3 h-3" />
              Framework Principal
            </button>
            <button
              id="view-tab-memories"
              onClick={() => setActiveView('memories')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeView === 'memories'
                  ? 'bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-white/50 hover:text-indigo-400'
              }`}
            >
              <Database className="w-3 h-3" />
              Gerenciador de Memória
            </button>
            <button
              id="view-tab-hypotheses"
              onClick={() => setActiveView('hypotheses')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeView === 'hypotheses'
                  ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-white/50 hover:text-amber-400'
              }`}
            >
              <Target className="w-3 h-3" />
              Módulo de Hipóteses
            </button>
            <button
              id="view-tab-sandbox"
              onClick={() => setActiveView('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all relative ${
                activeView === 'sandbox'
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-white/50 hover:text-cyan-400'
              }`}
            >
              <FlaskConical className="w-3 h-3" />
              Testing Sandbox
            </button>
          </div>
        </div>
        
        {/* Actions & Telemetry */}
        <div className="flex gap-3 md:gap-5 items-center">
          <button 
            id="btn-open-external-knowledge"
            onClick={() => setIsExternalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-evolve-accent/40 rounded-lg text-[9px] uppercase tracking-wider text-evolve-accent hover:bg-evolve-accent/10 transition-all font-mono"
            title="Expandir banco de conhecimento com periódicos científicos, arquivos históricos e enciclopédias"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">Ingerir Fontes Externas</span>
            <span className="sm:hidden">Fontes</span>
          </button>

          <button 
            id="btn-sync-luna"
            onClick={() => setIsBridgeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-[9px] uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-all font-mono"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">Sync Legacy</span>
          </button>

          {state.activeAnomaly ? (
            <button
              onClick={() => setActiveView('core')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 font-mono text-[9px] font-bold animate-pulse hover:bg-red-500/30 transition-all"
              title="Visualizar Alerta de Regressão Estatística"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Regressão Disparada</span>
              <span className="sm:hidden">-2σ</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 border border-evolve-line/60 rounded-lg text-[9px] font-mono text-white/50">
              <ShieldCheck className="w-3 h-3 text-evolve-accent" />
              <span>Monitor -{state.sigmaMultiplier || 2.0}σ Ativo</span>
            </div>
          )}

          {/* Auto-Save Persistence Telemetry & Actions */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-evolve-line/60 rounded-lg bg-black/40 text-[9px] font-mono">
            <div className="flex items-center gap-1.5" title={`Última persistência automática: ${lastSavedTime.toLocaleTimeString()}`}>
              {saveStatus === 'saving' ? (
                <HardDrive className="w-3 h-3 text-amber-400 animate-spin" />
              ) : saveStatus === 'error' ? (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              ) : (
                <HardDrive className="w-3 h-3 text-evolve-accent" />
              )}
              <span className="hidden xl:inline text-white/40">Auto-save:</span>
              <span className={`font-bold ${
                saveStatus === 'saving' ? 'text-amber-400' :
                saveStatus === 'error' ? 'text-red-400' : 'text-evolve-accent'
              }`}>
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'error' ? 'Falha' : 'Persistido'}
              </span>
            </div>

            <button 
              id="btn-force-save"
              onClick={handleManualSave}
              className="text-white/40 hover:text-evolve-accent p-0.5 rounded transition-colors ml-1"
              title="Forçar salvamento imediato no localStorage"
            >
              <Save className="w-3 h-3" />
            </button>
            <button 
              id="btn-reset-cache"
              onClick={handleResetStorage}
              className="text-white/30 hover:text-red-400 p-0.5 rounded transition-colors"
              title="Redefinir e limpar cache do localStorage"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Audio Feedback & Mute Settings Control */}
          <div className="flex items-center gap-1 border border-evolve-line/60 rounded-lg bg-black/40 p-1 text-[9px] font-mono">
            <button
              id="btn-toggle-audio-mute"
              onClick={handleToggleAudioMute}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${
                (state.audioSettings?.soundEnabled ?? true)
                  ? 'text-evolve-accent hover:bg-evolve-accent/15'
                  : 'text-red-400 hover:bg-red-500/15'
              }`}
              title={(state.audioSettings?.soundEnabled ?? true) ? 'Áudio do Sistema Ativo (clique para silenciar)' : 'Áudio Silenciado (clique para ativar beeps)'}
            >
              {(state.audioSettings?.soundEnabled ?? true) ? (
                <Volume2 className="w-3.5 h-3.5 text-evolve-accent" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className="hidden xl:inline font-bold">
                {(state.audioSettings?.soundEnabled ?? true) ? 'Áudio On' : 'Silenciado'}
              </span>
            </button>
            <button
              id="btn-open-audio-settings"
              onClick={() => setIsAudioModalOpen(true)}
              className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Configurações de Áudio & Telemetria Háptica"
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>

          {/* Scheduled Reminders Control */}
          <button
            id="btn-open-reminders-modal"
            onClick={() => setIsRemindersModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-evolve-line/60 rounded-lg bg-black/40 hover:bg-black/60 hover:border-cyan-500/50 text-[9px] font-mono transition-all text-white/70 hover:text-white group"
            title={nextReminderInfo ? `Próximo lembrete: ${nextReminderInfo.reminder.title} (${nextReminderInfo.label})` : 'Configurar Lembretes Agendados de Evolução'}
          >
            <div className="relative">
              <Bell className={`w-3.5 h-3.5 transition-colors ${
                (state.scheduledReminders?.some(r => r.enabled))
                  ? 'text-cyan-400 group-hover:text-cyan-300' 
                  : 'text-white/40'
              }`} />
              {(state.scheduledReminders?.some(r => r.enabled)) && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
            <span className="hidden xl:inline text-white/60">
              {nextReminderInfo ? (
                <>
                  <span>Lembrete:</span>{' '}
                  <strong className="text-cyan-300">{nextReminderInfo.reminder.time}</strong>
                </>
              ) : (
                <span>Lembretes</span>
              )}
            </span>
          </button>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-tighter opacity-40">Clusters Ativos</span>
            <span className="text-[11px] font-mono text-white font-bold">{state.knowledgeBank.length}</span>
          </div>

          <div className="h-2 w-2 rounded-full bg-evolve-accent shadow-[0_0_8px_#00FF9C]" />
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Side: Ancestry & Knowledge Bank */}
        <aside className="w-72 border-r border-evolve-line hidden lg:flex flex-col p-4 gap-5 bg-[#090b0e]/70">
          {/* View Switcher for smaller sidebar visibility */}
          <div className="sm:hidden flex flex-col gap-1 p-1 bg-black/40 border border-evolve-line rounded-lg">
            <button
              onClick={() => setActiveView('core')}
              className={`px-2 py-1 text-[9px] font-mono uppercase rounded ${activeView === 'core' ? 'bg-evolve-accent text-evolve-bg font-bold' : 'text-white/50'}`}
            >
              Framework Principal
            </button>
            <button
              onClick={() => setActiveView('memories')}
              className={`px-2 py-1 text-[9px] font-mono uppercase rounded ${activeView === 'memories' ? 'bg-indigo-500 text-white font-bold' : 'text-white/50'}`}
            >
              Gerenciador de Memória
            </button>
            <button
              onClick={() => setActiveView('hypotheses')}
              className={`px-2 py-1 text-[9px] font-mono uppercase rounded ${activeView === 'hypotheses' ? 'bg-amber-500 text-black font-bold' : 'text-white/50'}`}
            >
              Módulo de Hipóteses
            </button>
            <button
              onClick={() => setActiveView('sandbox')}
              className={`px-2 py-1 text-[9px] font-mono uppercase rounded ${activeView === 'sandbox' ? 'bg-cyan-500 text-black font-bold' : 'text-white/50'}`}
            >
              Testing Sandbox
            </button>
          </div>

          {state.legacyKnowledge.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3 h-3 text-evolve-accent" />
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-evolve-accent">Legacy Cores</h2>
              </div>
              <div className="space-y-1.5">
                {state.legacyKnowledge.map((lk, i) => (
                  <div key={i} className="p-2 border border-evolve-accent/20 bg-evolve-accent/5 rounded text-[10px]">
                    <div className="flex justify-between text-evolve-accent/80 mb-1">
                      <span>{lk.source}</span>
                      <span>SYNC_OK</span>
                    </div>
                    <p className="line-clamp-2 text-white/50">{lk.results}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ancestry Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <History className="w-3 h-3 text-white/50" />
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-white/50">Ancestry</h2>
              </div>
              <span className="text-[9px] font-mono text-white/30">{state.history.length} Gens</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {state.history.length === 0 && (
                <p className="text-[10px] italic opacity-30">No previous generations recorded.</p>
              )}
              {state.history.map((h, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setState(prev => ({ ...prev, currentProcess: h }));
                    setActiveView('core');
                  }}
                  className="p-2 border border-evolve-line rounded text-[10px] hover:border-evolve-accent/40 bg-white/[0.01] hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between text-evolve-accent mb-1 font-mono text-[9px]">
                    <span>GEN_{h.generation.toString().padStart(4, '0')}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="line-clamp-1 text-white/70">{h.problem}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Bank Section */}
          <div className="flex-1 overflow-hidden flex flex-col pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView('memories')}>
                <Dna className="w-3 h-3 text-evolve-accent group-hover:scale-110 transition-transform" />
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-evolve-accent transition-colors">
                  Knowledge Bank
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveView('memories')}
                  className="text-[8px] font-mono text-indigo-400 hover:underline uppercase"
                  title="Abrir Gerenciador de Memória Completo"
                >
                  Gerenciar
                </button>
                <button 
                  onClick={() => setIsExternalModalOpen(true)}
                  className="text-[8px] font-mono text-evolve-accent hover:underline uppercase flex items-center gap-1"
                >
                  + Ingerir
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="relative">
                <input 
                  id="input-search-knowledge"
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Pesquisar clusters, tags, autores..."
                  className="w-full bg-white/5 border border-evolve-line rounded px-2.5 py-1.5 text-[9px] text-white/80 placeholder:text-white/20 outline-none focus:border-evolve-accent/40 transition-all font-mono"
                />
                <Search className="w-3 h-3 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <select 
                id="select-contributor-filter"
                value={contributorFilter}
                onChange={(e) => setContributorFilter(e.target.value)}
                className="w-full bg-[#0a0d10] border border-evolve-line rounded px-2 py-1 text-[8px] text-white/70 outline-none focus:border-evolve-accent/40 font-mono"
              >
                {contributors.map(c => (
                  <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>
                ))}
              </select>
            </div>

            {/* Clusters List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {filteredKnowledge.map((k) => (
                <div key={k.id} className="border-l-2 border-evolve-accent/30 pl-2.5 py-1 space-y-1 group hover:border-evolve-accent transition-colors">
                  <div className="flex gap-2 items-center justify-between text-[8px] font-mono">
                    <span className="text-evolve-accent/80 uppercase font-semibold truncate max-w-[100px]">
                      {k.contributor}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {k.status && (
                        <span className={`text-[7px] px-1 py-0.2 rounded border uppercase font-bold ${
                          k.status === 'herdadas' ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10' :
                          k.status === 'adquiridas' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' :
                          k.status === 'úteis' ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' :
                          k.status === 'obsoletas' ? 'border-amber-500/30 text-amber-300 bg-amber-500/10' :
                          'border-rose-500/30 text-rose-300 bg-rose-500/10'
                        }`}>
                          {k.status}
                        </span>
                      )}
                      {k.sourceType && (
                        <span className={`text-[7px] px-1 py-0.2 rounded border uppercase ${
                          k.sourceType === 'sandbox' 
                            ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                            : k.sourceType === 'journal' || k.sourceType === 'archive' || k.sourceType === 'encyclopedia'
                            ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10'
                            : 'border-white/10 text-white/40'
                        }`}>
                          {k.sourceType}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] font-mono leading-relaxed text-white/60 group-hover:text-white/80 transition-colors">
                    {k.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                    <div className="flex flex-wrap gap-1">
                      {k.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[7px] px-1 py-0.5 bg-white/5 text-white/40 rounded border border-white/5">
                          #{t}
                        </span>
                      ))}
                    </div>
                    {k.sourceUrl && (
                      <a 
                        href={k.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[8px] font-mono text-evolve-accent/60 hover:text-evolve-accent flex items-center gap-0.5"
                        title="Ver referência original"
                      >
                        Ref <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {filteredKnowledge.length === 0 && (
                <p className="text-[9px] opacity-30 italic text-center py-4">Nenhum cluster encontrado.</p>
              )}
            </div>
          </div>
        </aside>

        {/* View Routing: Core Framework vs Memory Manager vs Hypothesis Module vs Testing Sandbox */}
        {activeView === 'memories' ? (
          <MemoryManager
            knowledgeBank={state.knowledgeBank}
            history={state.history}
            currentGeneration={state.currentGeneration}
            onUpdateMemoryBank={(newBank) => {
              setState(prev => ({ ...prev, knowledgeBank: newBank }));
            }}
            audioSettings={state.audioSettings}
            showNotification={showNotification}
          />
        ) : activeView === 'hypotheses' ? (
          <HypothesisModule
            knowledgeBank={state.knowledgeBank}
            currentGeneration={state.currentGeneration}
            hypotheses={state.creativeHypotheses || INITIAL_CREATIVE_HYPOTHESES}
            onUpdateHypotheses={(newHypotheses) => {
              setState(prev => ({ ...prev, creativeHypotheses: newHypotheses }));
            }}
            onPromoteToMemory={(newEntry) => {
              setState(prev => ({
                ...prev,
                knowledgeBank: [newEntry, ...prev.knowledgeBank],
              }));
            }}
            audioSettings={state.audioSettings}
            showNotification={showNotification}
          />
        ) : activeView === 'sandbox' ? (
          <TestingSandbox
            onPromoteHypothesis={handlePromoteHypothesis}
            knowledgeBank={state.knowledgeBank}
            currentGeneration={state.currentGeneration}
          />
        ) : (
          /* Center: Active Evolution Console (Core Operational Framework) */
          <div className="flex-1 flex flex-col relative overflow-hidden bg-evolve-bg">
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
              <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,255,156,0.1)_0%,transparent_50%)] animate-[spin_60s_linear_infinite]" />
            </div>

            {/* Content Display Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              <div className="max-w-4xl mx-auto space-y-5">
                {/* Sistema de Notificação Visual de Regressão / Anomalia Estatística */}
                <AnimatePresence>
                  {state.activeAnomaly && (
                    <AnomalyAlertBanner
                      alert={state.activeAnomaly}
                      onDismiss={() => setState(prev => ({ ...prev, activeAnomaly: null }))}
                      onSendToSandbox={handleSendAlertToSandbox}
                      onRetryWithSynergy={handleRetryWithSynergy}
                      sigmaMultiplier={state.sigmaMultiplier || 2.0}
                      soundEnabled={state.audioSettings?.soundEnabled ?? true}
                      onToggleMute={handleToggleAudioMute}
                    />
                  )}
                </AnimatePresence>

                {/* Barra de Status do Sistema de Monitoramento Estatístico */}
                <div className="p-3 rounded-xl border border-evolve-line/70 bg-[#070b09]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shadow-sm">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {state.activeAnomaly ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 border border-red-500/60 text-red-300 font-bold animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>REGRESSÃO DISPARADA</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-evolve-accent shrink-0" />
                        <span>MONITOR HISTÓRICO ATIVO</span>
                      </div>
                    )}

                    <div className="hidden sm:flex items-center gap-2 text-white/50 text-[9px]">
                      <span>Piso Sucesso (-{state.sigmaMultiplier || 2.0}σ): <strong className="text-evolve-accent font-bold">{monitoringThresholds.success.threshold}%</strong></span>
                      <span>•</span>
                      <span>Piso Complexidade (-{state.sigmaMultiplier || 2.0}σ): <strong className="text-cyan-400 font-bold">{monitoringThresholds.complexity.threshold}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Indicador e Alternador de Áudio/Haptics do Monitor */}
                    <button
                      id="btn-monitor-audio-toggle"
                      onClick={handleToggleAudioMute}
                      className={`px-2 py-1 border rounded transition-all flex items-center gap-1.5 text-[9px] font-mono ${
                        (state.audioSettings?.soundEnabled ?? true)
                          ? 'border-evolve-accent/40 bg-evolve-accent/10 text-evolve-accent hover:bg-evolve-accent/20 shadow-[0_0_8px_rgba(0,255,156,0.15)]'
                          : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                      }`}
                      title={(state.audioSettings?.soundEnabled ?? true) ? 'Sinal sonoro ativo. Clique para silenciar áudio.' : 'Sinal sonoro silenciado. Clique para ativar áudio.'}
                    >
                      {(state.audioSettings?.soundEnabled ?? true) ? (
                        <Volume2 className="w-3 h-3 text-evolve-accent" />
                      ) : (
                        <VolumeX className="w-3 h-3 text-red-400" />
                      )}
                      <span className="hidden md:inline">
                        {(state.audioSettings?.soundEnabled ?? true) ? 'Sinal Sonoro Ativo' : 'Sinal Mudo'}
                      </span>
                    </button>

                    {/* Indicador de Lembretes Agendados na Barra de Monitoramento */}
                    <button
                      id="btn-monitor-reminders"
                      onClick={() => setIsRemindersModalOpen(true)}
                      className="px-2 py-1 rounded border border-white/10 hover:border-cyan-500/40 bg-black/40 hover:bg-cyan-500/5 text-white/50 hover:text-white transition-all flex items-center gap-1.5 text-[9px] font-mono"
                      title="Abrir Agendador de Lembretes"
                    >
                      <Bell className="w-3 h-3 text-cyan-400" />
                      <span className="hidden lg:inline">
                        {nextReminderInfo ? `Próximo: ${nextReminderInfo.reminder.time}` : 'Agendar Lembrete'}
                      </span>
                    </button>

                    {/* Selector de Sensibilidade (Desvios Padrão) */}
                    <div className="flex items-center p-0.5 bg-black/60 border border-evolve-line rounded text-[9px]">
                      <span className="px-1.5 text-white/30 text-[8px] uppercase">Tolerância:</span>
                      {[1.5, 2.0, 2.5].map((sig) => (
                        <button
                          key={sig}
                          id={`btn-sigma-${sig}`}
                          onClick={() => handleSetSigmaMultiplier(sig)}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            (state.sigmaMultiplier || 2.0) === sig
                              ? 'bg-evolve-accent text-evolve-bg font-bold shadow-[0_0_8px_rgba(0,255,156,0.3)]'
                              : 'text-white/40 hover:text-white'
                          }`}
                          title={`Disparar notificação se cair ${sig} desvios padrão abaixo da média`}
                        >
                          {sig.toFixed(1)}σ
                        </button>
                      ))}
                    </div>

                    {/* Botão de Teste Diagnóstico da Notificação Visual */}
                    <button
                      id="btn-simulate-anomaly"
                      onClick={handleSimulateAnomalyTest}
                      className="px-2.5 py-1 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 rounded transition-all flex items-center gap-1.5 text-[9px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                      title="Dispara uma simulação de geração com métricas inferiores ao piso estatístico (-2σ) para testar a notificação visual"
                    >
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span>Simular Regressão (-2σ)</span>
                    </button>
                  </div>
                </div>

                {/* Visualização de Dados Recharts: Progresso de Sucesso e Complexidade por Geração */}
                <GenerationEvolutionChart
                  history={state.history}
                  currentGeneration={state.currentGeneration}
                  selectedGenerationNumber={state.currentProcess?.generation}
                  sigmaMultiplier={state.sigmaMultiplier || 2.0}
                  onSelectGeneration={(gen) => {
                    setState(prev => ({ ...prev, currentProcess: gen }));
                  }}
                />

                {!state.currentProcess && !state.isThinking && (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto py-8">
                    <div className="w-12 h-12 rounded-xl border border-evolve-line flex items-center justify-center text-evolve-accent">
                      <Brain className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-mono font-bold tracking-wider uppercase text-white">
                        Super IA Evolutiva Pronta
                      </h2>
                      <p className="text-xs text-white/50 leading-relaxed font-sans">
                        Apresente um desafio científico ou filosófico. A IA sintetizará memória herdada, consultará seus subagentes e formulará um avanço geracional permanente.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setInput("Como unificar a termodinâmica de não-equilíbrio com o processamento de informação neural?")}
                        className="text-[10px] font-mono px-3 py-1.5 rounded border border-white/10 text-white/60 hover:border-evolve-accent/40 hover:text-evolve-accent bg-white/[0.02] transition-all text-left"
                      >
                        "Como unificar termodinâmica e cognição neural?"
                      </button>
                      <button
                        onClick={() => setActiveView('sandbox')}
                        className="text-[10px] font-mono px-3 py-1.5 rounded border border-amber-500/30 text-amber-400/80 hover:bg-amber-500/10 transition-all flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3 h-3" />
                        Explorar Testing Sandbox
                      </button>
                    </div>
                  </div>
                )}

                {state.isThinking && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border border-evolve-accent/20 border-t-evolve-accent animate-spin" />
                      <Sparkles className="w-6 h-6 text-evolve-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-mono text-evolve-accent tracking-widest uppercase">
                        Processando Evolução Geracional...
                      </p>
                      <p className="text-[10px] font-mono text-white/40">
                        Consultando subagentes, aplicando sinergias e formulando avanço permanente.
                      </p>
                    </div>
                  </div>
                )}

                {state.currentProcess && !state.isThinking && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                  {/* Problem & Generation Card */}
                  <div className="p-6 rounded-xl border border-evolve-line bg-black/40 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-evolve-accent font-bold">GEN_{state.currentProcess.generation.toString().padStart(4, '0')}</span>
                      <span className="text-white/40 uppercase">Solução Estabelecida</span>
                    </div>
                    <h3 className="text-base font-mono font-bold text-white tracking-wide">
                      {state.currentProcess.problem}
                    </h3>
                    <p className="text-xs text-white/80 leading-relaxed font-sans font-medium">
                      {state.currentProcess.solution}
                    </p>
                  </div>

                  {/* SubAgents Vision Flow */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" /> Visões dos Subagentes Nesta Geração
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {state.currentProcess.subAgents.map((sa, i) => (
                        <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-evolve-accent font-bold">{sa.specialty}</span>
                            <span className="text-white/30">{sa.id}</span>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed font-sans">{sa.vision}</p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sa.patterns.map((p, pIdx) => (
                              <span key={pIdx} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evolution Reasoning Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/50">
                      Fluxo de Raciocínio Dialético (10 Passos)
                    </h4>
                    <div className="space-y-2 border-l border-white/10 pl-4">
                      {state.currentProcess.reasoningSteps.map((step, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="text-evolve-accent">{step.type}</span>
                            <span className="text-white/40">• {step.title}</span>
                          </div>
                          <p className="text-xs text-white/70 font-sans leading-relaxed">
                            {step.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analysis & Future Vector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.01] space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-evolve-accent">
                        Análise Crítica
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">
                        {state.currentProcess.analysis}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.01] space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-evolve-accent">
                        Próxima Questão Geracional
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">
                        {state.currentProcess.nextQuestion}
                      </p>
                      <button
                        onClick={() => setInput(state.currentProcess?.nextQuestion || '')}
                        className="text-[9px] font-mono text-evolve-accent hover:underline uppercase pt-1 inline-flex items-center gap-1"
                      >
                        Herdar esta questão <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              </div>
            </div>

            {/* Bottom Input Console */}
            <div className="p-4 md:p-6 border-t border-evolve-line bg-evolve-bg/95 backdrop-blur-md">
              <div className="max-w-4xl mx-auto space-y-3">
                {/* Agent Synergy Controls & Options */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                      Sinergia Forçada de Agentes:
                    </span>
                    {selectedAgents.length > 0 && (
                      <button 
                        onClick={() => setSelectedAgents([])}
                        className="text-[8px] font-mono text-evolve-accent hover:underline"
                      >
                        Limpar ({selectedAgents.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-toggle-grounding"
                      onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                      className={`text-[9px] font-mono uppercase px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 ${
                        useSearchGrounding
                          ? 'border-evolve-accent bg-evolve-accent/15 text-evolve-accent font-bold'
                          : 'border-white/10 text-white/40 hover:text-white/70'
                      }`}
                      title="Ativar verificação web e pesquisa empírica durante a evolução"
                    >
                      <Globe className="w-3 h-3" />
                      {useSearchGrounding ? "Pesquisa Grounded Ativa" : "Ativar Grounding"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                  {SUB_AGENTS.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.specialty)}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all border ${
                        selectedAgents.includes(agent.specialty)
                          ? 'bg-evolve-accent/20 border-evolve-accent text-evolve-accent font-bold shadow-[0_0_8px_rgba(0,255,156,0.2)]'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                      }`}
                    >
                      {agent.specialty}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input 
                      id="input-problem-statement"
                      type="text"
                      value={input}
                      onChange={onInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleEvolve()}
                      maxLength={550}
                      placeholder="Apresente um mistério, problema ou hipótese à Super IA..."
                      className={`w-full bg-white/5 border ${error ? 'border-evolve-error/50' : 'border-evolve-line'} focus:border-evolve-accent/50 focus:ring-0 rounded-lg px-4 py-3 text-xs md:text-sm text-white placeholder:text-white/20 transition-all outline-none pr-24 font-mono`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <span className={`text-[9px] font-mono transition-colors ${input.length > 500 ? 'text-evolve-error' : 'opacity-30'}`}>
                        {input.length}/500
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono opacity-20 hidden md:inline">ENTER</span>
                        <div className="w-1.5 h-3 bg-evolve-accent animate-[pulse_1s_infinite]" />
                      </div>
                    </div>
                  </div>
                  <button 
                    id="btn-evolve-submit"
                    onClick={handleEvolve}
                    disabled={state.isThinking}
                    className="bg-evolve-accent text-evolve-bg px-6 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,156,0.2)]"
                  >
                    {state.isThinking ? <Zap className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Evoluir
                  </button>
                </div>

                {error && (
                  <p className="text-[10px] font-mono text-evolve-error uppercase tracking-widest pl-2">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Meta Rail */}
      <footer className="h-8 border-t border-evolve-line flex items-center justify-between px-6 text-[9px] uppercase font-mono tracking-widest bg-evolve-bg">
        <div className="flex gap-4">
          <span className="text-evolve-accent">SYSTEM_LIVE: OK</span>
          <span className="text-white/40">MODE: {activeView.toUpperCase()}</span>
          <span className="text-white/40">STORAGE: LOCAL_PERSISTED</span>
          <span className="text-white/40">CLUSTERS: {state.knowledgeBank.length}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-white/40">LAST_SAVE: {lastSavedTime.toLocaleTimeString()}</span>
          <span className="text-white/40">TIME: {new Date().toLocaleTimeString()}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-1 h-1 rounded-full ${i <= 3 ? 'bg-evolve-accent shadow-[0_0_4px_#00FF9C]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
