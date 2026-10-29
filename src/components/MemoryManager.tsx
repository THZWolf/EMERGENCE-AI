/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Search, 
  Filter, 
  Tag, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Archive, 
  Cpu, 
  Link2, 
  GitBranch, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Brain, 
  ShieldAlert, 
  Sliders, 
  Eye, 
  Activity,
  Hash,
  Share2,
  Trash2,
  Edit3
} from 'lucide-react';
import { 
  KnowledgeEntry, 
  MemoryStatus, 
  MemoryConnection, 
  ProblemSolution,
  AudioSettings
} from '../types';
import { analyzeMemoryPatternsAndLimitations } from '../services/geminiService';
import { playGenerationCompleteSound, triggerHaptic } from '../utils/soundEffects';

interface MemoryManagerProps {
  knowledgeBank: KnowledgeEntry[];
  history: ProblemSolution[];
  currentGeneration: number;
  onUpdateMemoryBank: (newBank: KnowledgeEntry[]) => void;
  onSelectProblemOrGeneration?: (gen: number) => void;
  audioSettings?: AudioSettings;
  showNotification: (msg: string) => void;
}

const STATUS_CONFIG: Record<MemoryStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  description: string;
  icon: any;
}> = {
  herdadas: {
    label: 'Herdadas',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    description: 'Memórias herdadas de núcleos ancestrais e gerações predecessoras.',
    icon: Database,
  },
  adquiridas: {
    label: 'Adquiridas',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Memórias adquiridas através de sínteses geracionais e validações empíricas.',
    icon: Sparkles,
  },
  úteis: {
    label: 'Úteis',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Axiomas e heurísticas de alto impacto com taxa de acerto comprovada.',
    icon: CheckCircle2,
  },
  obsoletas: {
    label: 'Obsoletas',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Premissas superadas por avanços epistemológicos posteriores.',
    icon: Archive,
  },
  problemáticas: {
    label: 'Problemáticas',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Heurísticas que induziram erros, mínimos locais ou anomalias estatísticas.',
    icon: AlertTriangle,
  },
};

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  fundamenta: { label: 'Fundamenta', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/40' },
  contradiz: { label: 'Contradiz', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/40' },
  complementa: { label: 'Complementa', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/40' },
  generaliza: { label: 'Generaliza', color: 'text-indigo-400', badge: 'bg-indigo-500/20 border-indigo-500/40' },
  substitui: { label: 'Substitui', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/40' },
};

export default function MemoryManager({
  knowledgeBank,
  history,
  currentGeneration,
  onUpdateMemoryBank,
  audioSettings,
  showNotification,
}: MemoryManagerProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MemoryStatus | 'todas'>('todas');
  const [selectedTheme, setSelectedTheme] = useState<string>('todos');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('todas');
  const [onlyWithConnections, setOnlyWithConnections] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'connections' | 'patterns'>('cards');

  // Selected memory for connection modal / detail
  const [activeConnectingMemory, setActiveConnectingMemory] = useState<KnowledgeEntry | null>(null);
  const [connectionTargetId, setConnectionTargetId] = useState<string>('');
  const [connectionRelation, setConnectionRelation] = useState<'fundamenta' | 'contradiz' | 'complementa' | 'generaliza' | 'substitui'>('complementa');
  const [connectionDesc, setConnectionDesc] = useState('');

  // New Memory Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newContributor, setNewContributor] = useState('Super IA Core');
  const [newStatus, setNewStatus] = useState<MemoryStatus>('adquiridas');
  const [newTheme, setNewTheme] = useState('Termodinâmica & Entropia');
  const [newTagsStr, setNewTagsStr] = useState('Evolução, Síntese');
  const [newGen, setNewGen] = useState(currentGeneration);
  const [newRecurrentPattern, setNewRecurrentPattern] = useState('');
  const [newPastLimitation, setNewPastLimitation] = useState('');

  // AI Metamemory Analysis State
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [patternsAnalysisResult, setPatternsAnalysisResult] = useState<{
    recurrentPatterns: { pattern: string; occurrenceCount: number; description: string; implications?: string }[];
    pastLimitations: { limitation: string; generationObserved: number; impact: string; mitigation: string }[];
    epistemicHealthScore: number;
    recommendations: string[];
  } | null>(null);

  // Extract unique themes and generations
  const availableThemes = useMemo(() => {
    const set = new Set<string>();
    knowledgeBank.forEach(m => {
      if (m.theme) set.add(m.theme);
      else if (m.tags && m.tags[0]) set.add(m.tags[0]);
    });
    return Array.from(set);
  }, [knowledgeBank]);

  const availableGenerations = useMemo(() => {
    const set = new Set<number>();
    knowledgeBank.forEach(m => {
      if (typeof m.generation === 'number') set.add(m.generation);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [knowledgeBank]);

  // Statistics
  const stats = useMemo(() => {
    const counts: Record<MemoryStatus, number> = {
      herdadas: 0,
      adquiridas: 0,
      úteis: 0,
      obsoletas: 0,
      problemáticas: 0,
    };
    let totalConnections = 0;
    knowledgeBank.forEach(m => {
      const status = m.status || (m.sourceType === 'legacy' ? 'herdadas' : 'adquiridas');
      if (counts[status] !== undefined) counts[status]++;
      if (m.connections && m.connections.length > 0) {
        totalConnections += m.connections.length;
      }
    });
    return { counts, totalConnections, total: knowledgeBank.length };
  }, [knowledgeBank]);

  // Filtered Memories
  const filteredMemories = useMemo(() => {
    return knowledgeBank.filter(m => {
      const effectiveStatus: MemoryStatus = m.status || (m.sourceType === 'legacy' ? 'herdadas' : 'adquiridas');
      
      // Status filter
      if (selectedStatus !== 'todas' && effectiveStatus !== selectedStatus) {
        return false;
      }

      // Theme filter
      if (selectedTheme !== 'todos') {
        const theme = m.theme || (m.tags && m.tags[0]) || '';
        if (theme.toLowerCase() !== selectedTheme.toLowerCase()) return false;
      }

      // Generation filter
      if (selectedGeneration !== 'todas') {
        const gen = m.generation ?? 1;
        if (gen.toString() !== selectedGeneration) return false;
      }

      // Only with connections
      if (onlyWithConnections && (!m.connections || m.connections.length === 0)) {
        return false;
      }

      // Keyword query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inContent = m.content.toLowerCase().includes(q);
        const inTags = m.tags?.some(t => t.toLowerCase().includes(q));
        const inContributor = m.contributor.toLowerCase().includes(q);
        const inPattern = m.recurrentPatternNote?.toLowerCase().includes(q);
        const inLimitation = m.pastLimitationNote?.toLowerCase().includes(q);
        const inTheme = m.theme?.toLowerCase().includes(q);
        if (!inContent && !inTags && !inContributor && !inPattern && !inLimitation && !inTheme) {
          return false;
        }
      }

      return true;
    });
  }, [knowledgeBank, selectedStatus, selectedTheme, selectedGeneration, onlyWithConnections, searchQuery]);

  // Update memory status directly
  const handleUpdateStatus = (memoryId: string, newStatus: MemoryStatus) => {
    const updated = knowledgeBank.map(m => {
      if (m.id === memoryId) {
        return { ...m, status: newStatus };
      }
      return m;
    });
    onUpdateMemoryBank(updated);
    triggerHaptic([30, 20], audioSettings?.hapticsEnabled ?? true);
    showNotification(`Status da memória atualizado para "${STATUS_CONFIG[newStatus].label}".`);
  };

  // Add new connection between memories
  const handleCreateConnection = () => {
    if (!activeConnectingMemory || !connectionTargetId) return;
    if (activeConnectingMemory.id === connectionTargetId) {
      showNotification('Uma memória não pode ser conectada a si mesma.');
      return;
    }

    const newConnection: MemoryConnection = {
      targetMemoryId: connectionTargetId,
      relationship: connectionRelation,
      description: connectionDesc.trim() || undefined,
    };

    const updated = knowledgeBank.map(m => {
      if (m.id === activeConnectingMemory.id) {
        const existing = m.connections || [];
        // Avoid duplicate connection
        if (existing.some(c => c.targetMemoryId === connectionTargetId)) {
          return m;
        }
        return {
          ...m,
          connections: [...existing, newConnection],
        };
      }
      return m;
    });

    onUpdateMemoryBank(updated);
    setActiveConnectingMemory(null);
    setConnectionTargetId('');
    setConnectionDesc('');
    showNotification(`Conexão criada: ${RELATIONSHIP_LABELS[connectionRelation].label}.`);
  };

  // Remove connection
  const handleRemoveConnection = (sourceMemoryId: string, targetMemoryId: string) => {
    const updated = knowledgeBank.map(m => {
      if (m.id === sourceMemoryId && m.connections) {
        return {
          ...m,
          connections: m.connections.filter(c => c.targetMemoryId !== targetMemoryId),
        };
      }
      return m;
    });
    onUpdateMemoryBank(updated);
    showNotification('Conexão removida.');
  };

  // Create new Memory
  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const tags = newTagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const newEntry: KnowledgeEntry = {
      id: `mem_${Date.now()}`,
      content: newContent.trim(),
      contributor: newContributor.trim() || 'Super IA Core',
      timestamp: new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['Evolução'],
      generation: Number(newGen) || currentGeneration,
      status: newStatus,
      theme: newTheme.trim() || 'Geral',
      connections: [],
      utilityScore: 85,
      recurrentPatternNote: newRecurrentPattern.trim() || undefined,
      pastLimitationNote: newPastLimitation.trim() || undefined,
      sourceType: 'manual',
    };

    onUpdateMemoryBank([newEntry, ...knowledgeBank]);
    setIsAddModalOpen(false);
    setNewContent('');
    setNewRecurrentPattern('');
    setNewPastLimitation('');
    playGenerationCompleteSound(audioSettings);
    showNotification(`Nova memória indexada com sucesso como "${STATUS_CONFIG[newStatus].label}".`);
  };

  // Delete memory
  const handleDeleteMemory = (id: string) => {
    const updated = knowledgeBank.filter(m => m.id !== id);
    onUpdateMemoryBank(updated);
    showNotification('Memória removida do banco permanente.');
  };

  // AI-Powered Pattern & Limitation Analysis
  const handleTriggerAnalysis = async () => {
    setIsAnalyzingPatterns(true);
    try {
      const result = await analyzeMemoryPatternsAndLimitations(knowledgeBank, history);
      setPatternsAnalysisResult(result);
      setActiveTab('patterns');
      playGenerationCompleteSound(audioSettings);
      showNotification('Análise de padrões recorrentes e limitações concluída!');
    } catch (err: any) {
      console.error('Falha na análise de padrões:', err);
      showNotification(`Falha na análise: ${err.message || 'Erro de rede'}`);
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-evolve-bg text-evolve-text">
      {/* Top Telemetry & Control Bar */}
      <div className="p-4 md:p-6 border-b border-evolve-line bg-black/40 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-evolve-accent/10 border border-evolve-accent/30 text-evolve-accent">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  Gerenciador de Memória Epistêmica
                  <span className="text-[10px] px-2 py-0.5 rounded bg-evolve-accent/15 border border-evolve-accent/30 text-evolve-accent">
                    {stats.total} Indexadas
                  </span>
                </h1>
                <p className="text-xs text-white/50 font-sans">
                  Indexação, categorização e conexões dialéticas entre memórias de diferentes gerações.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-analyze-memory-patterns"
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzingPatterns}
              className="px-3.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              {isAnalyzingPatterns ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isAnalyzingPatterns ? 'Analisando Metamemória...' : 'Identificar Padrões & Limitações'}</span>
            </button>

            <button
              id="btn-add-memory"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-evolve-accent text-evolve-bg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,255,156,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Memória</span>
            </button>
          </div>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setSelectedStatus('todas')}
            className={`p-2.5 rounded-lg border text-left transition-all font-mono ${
              selectedStatus === 'todas'
                ? 'bg-white/10 border-evolve-accent text-white shadow-[0_0_10px_rgba(0,255,156,0.15)]'
                : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="uppercase">Todas</span>
              <Hash className="w-3 h-3 text-white/30" />
            </div>
            <div className="text-base font-bold text-white mt-1">{stats.total}</div>
            <div className="text-[9px] text-white/40 truncate">Todas as gerações</div>
          </button>

          {(Object.keys(STATUS_CONFIG) as MemoryStatus[]).map(statusKey => {
            const config = STATUS_CONFIG[statusKey];
            const Icon = config.icon;
            const count = stats.counts[statusKey] || 0;
            const isSelected = selectedStatus === statusKey;

            return (
              <button
                key={statusKey}
                onClick={() => setSelectedStatus(isSelected ? 'todas' : statusKey)}
                className={`p-2.5 rounded-lg border text-left transition-all font-mono ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor} ${config.color} ring-1 ring-current shadow-lg`
                    : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="uppercase font-bold">{config.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="text-base font-bold text-white mt-1">{count}</div>
                <div className="text-[9px] text-white/40 truncate">{config.description}</div>
              </button>
            );
          })}
        </div>

        {/* Search, Themes & View Switcher Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex-1 flex flex-wrap items-center gap-2 w-full">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                id="search-memory-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por palavras-chave, temas, padrões, limitações..."
                className="w-full bg-white/5 border border-evolve-line focus:border-evolve-accent/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none font-mono"
              />
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter by Theme */}
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-white/40" />
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-[#0b0e12] border border-evolve-line rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none font-mono"
              >
                <option value="todos">Todos os Temas ({availableThemes.length})</option>
                {availableThemes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter by Generation */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-white/40" />
              <select
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
                className="bg-[#0b0e12] border border-evolve-line rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none font-mono"
              >
                <option value="todas">Todas Gerações</option>
                {availableGenerations.map(g => (
                  <option key={g} value={g.toString()}>Geração {g}</option>
                ))}
              </select>
            </div>

            {/* Only With Connections Toggle */}
            <button
              onClick={() => setOnlyWithConnections(!onlyWithConnections)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                onlyWithConnections
                  ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Link2 className="w-3 h-3" />
              <span>Conectadas ({stats.totalConnections})</span>
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-black/60 border border-evolve-line rounded-lg shrink-0 font-mono text-xs">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'cards'
                  ? 'bg-evolve-accent text-evolve-bg font-bold shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Índice ({filteredMemories.length})
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'connections'
                  ? 'bg-cyan-500 text-black font-bold shadow-sm'
                  : 'text-white/50 hover:text-cyan-300'
              }`}
            >
              <GitBranch className="w-3 h-3" />
              <span>Grafo de Conexões</span>
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'patterns'
                  ? 'bg-indigo-500 text-white font-bold shadow-sm'
                  : 'text-white/50 hover:text-indigo-300'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Padrões & Limitações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* VIEW 1: Memory Cards Grid */}
        {activeTab === 'cards' && (
          <div>
            {filteredMemories.length === 0 ? (
              <div className="text-center py-16 space-y-3 max-w-md mx-auto">
                <Database className="w-10 h-10 text-white/20 mx-auto" />
                <h3 className="text-sm font-mono text-white/70 uppercase">Nenhuma memória encontrada</h3>
                <p className="text-xs text-white/40">
                  Tente alterar os termos da busca, limpar os filtros de status ou criar uma nova memória indexada.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('todas');
                    setSelectedTheme('todos');
                    setSelectedGeneration('todas');
                    setOnlyWithConnections(false);
                  }}
                  className="px-3 py-1.5 rounded border border-white/20 text-xs font-mono text-white/60 hover:text-white"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMemories.map((memory) => {
                  const currentStatus: MemoryStatus = memory.status || (memory.sourceType === 'legacy' ? 'herdadas' : 'adquiridas');
                  const statusInfo = STATUS_CONFIG[currentStatus];
                  const hasConnections = memory.connections && memory.connections.length > 0;

                  return (
                    <motion.div
                      key={memory.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-xl border ${statusInfo.borderColor} bg-black/40 hover:bg-black/60 transition-all flex flex-col justify-between space-y-3 relative group`}
                    >
                      {/* Top Header: Gen, Contributor & Status Badge Dropdown */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-evolve-accent font-bold">
                              GEN_{memory.generation?.toString().padStart(4, '0') || '0001'}
                            </span>
                            <span className="text-white/40 truncate max-w-[130px]" title={memory.contributor}>
                              {memory.contributor}
                            </span>
                          </div>

                          {/* Status Pill Switcher */}
                          <div className="flex items-center gap-1">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleUpdateStatus(memory.id, e.target.value as MemoryStatus)}
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${statusInfo.borderColor} ${statusInfo.bgColor} ${statusInfo.color} font-bold outline-none cursor-pointer`}
                              title="Alterar categorização epistêmica desta memória"
                            >
                              {(Object.keys(STATUS_CONFIG) as MemoryStatus[]).map(s => (
                                <option key={s} value={s} className="bg-[#0b0e12] text-white">
                                  {STATUS_CONFIG[s].label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Theme & Utility Score */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
                          <span className="text-white/60 font-semibold">{memory.theme || 'Geral'}</span>
                          {typeof memory.utilityScore === 'number' && (
                            <span title="Índice de utilidade e fecundidade heurística">
                              Utilidade: <strong className="text-white">{memory.utilityScore}%</strong>
                            </span>
                          )}
                        </div>

                        {/* Memory Content */}
                        <p className="text-xs text-white/90 font-mono leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                          {memory.content}
                        </p>

                        {/* Recurrent Pattern Identified */}
                        {memory.recurrentPatternNote && (
                          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono space-y-0.5">
                            <div className="text-indigo-300 font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Padrão Recorrente:
                            </div>
                            <div className="text-white/70 font-sans leading-relaxed">
                              {memory.recurrentPatternNote}
                            </div>
                          </div>
                        )}

                        {/* Past Response Limitation / Error Pitfall */}
                        {memory.pastLimitationNote && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono space-y-0.5">
                            <div className="text-rose-300 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Limitação Passada / Viés:
                            </div>
                            <div className="text-white/70 font-sans leading-relaxed">
                              {memory.pastLimitationNote}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {memory.tags.map(tag => (
                              <span
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white cursor-pointer transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Connections Section */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-white/40 uppercase flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-cyan-400" />
                            Conexões ({memory.connections?.length || 0})
                          </span>
                          <button
                            onClick={() => {
                              setActiveConnectingMemory(memory);
                              setConnectionTargetId('');
                              setConnectionDesc('');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" /> Conectar
                          </button>
                        </div>

                        {hasConnections ? (
                          <div className="space-y-1">
                            {memory.connections!.map((conn, cIdx) => {
                              const rel = RELATIONSHIP_LABELS[conn.relationship] || { label: conn.relationship, color: 'text-white/60', badge: 'bg-white/10 border-white/20' };
                              const targetMem = knowledgeBank.find(m => m.id === conn.targetMemoryId);

                              return (
                                <div
                                  key={cIdx}
                                  className="flex items-center justify-between gap-1 p-1.5 rounded bg-white/[0.02] border border-white/5 text-[9px] font-mono"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`px-1 py-0.2 rounded border text-[8px] font-bold ${rel.badge} ${rel.color}`}>
                                      {rel.label}
                                    </span>
                                    <span className="text-white/60 truncate" title={targetMem ? targetMem.content : conn.targetMemoryId}>
                                      {targetMem ? targetMem.content.slice(0, 35) + '...' : conn.targetMemoryId}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveConnection(memory.id, conn.targetMemoryId)}
                                    className="text-white/30 hover:text-rose-400 p-0.5 transition-colors"
                                    title="Remover conexão"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[9px] font-mono text-white/20 italic">
                            Sem conexões com outras memórias
                          </div>
                        )}

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-white/30">
                          <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="hover:text-rose-400 p-1 rounded transition-colors"
                            title="Excluir memória"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Visual Connection Map (Graph Mode) */}
        {activeTab === 'connections' && (
          <div className="p-6 rounded-2xl border border-evolve-line bg-black/60 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Rede de Conexões Epistêmicas
                </h3>
                <p className="text-xs text-white/50 font-sans">
                  Visualização das relações de fundamentação, contradição, generalização e substituição entre gerações.
                </p>
              </div>

              {/* Relationship Legend */}
              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                {Object.entries(RELATIONSHIP_LABELS).map(([key, item]) => (
                  <div key={key} className={`px-2 py-0.5 rounded border ${item.badge} ${item.color} flex items-center gap-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Dialectic Connections Directory */}
            <div className="space-y-3">
              {knowledgeBank.filter(m => m.connections && m.connections.length > 0).length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs font-mono">
                  Nenhuma conexão inter-memória estabelecida ainda. Use o botão "+ Conectar" nos cartões para ligar memórias.
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeBank
                    .filter(m => m.connections && m.connections.length > 0)
                    .map(sourceMem => (
                      <div key={sourceMem.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.01] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-evolve-accent/20 text-evolve-accent font-bold text-[9px]">
                              GEN_{sourceMem.generation?.toString().padStart(4, '0') || '0001'}
                            </span>
                            <span className="text-white font-bold">{sourceMem.theme || sourceMem.contributor}</span>
                          </div>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${STATUS_CONFIG[sourceMem.status || 'adquiridas'].borderColor} ${STATUS_CONFIG[sourceMem.status || 'adquiridas'].color}`}>
                            {STATUS_CONFIG[sourceMem.status || 'adquiridas'].label}
                          </span>
                        </div>

                        <p className="text-xs text-white/80 font-mono pl-3 border-l-2 border-evolve-accent/40">
                          {sourceMem.content}
                        </p>

                        <div className="pl-4 space-y-2 border-l border-white/10">
                          {sourceMem.connections!.map((conn, idx) => {
                            const target = knowledgeBank.find(m => m.id === conn.targetMemoryId);
                            const rel = RELATIONSHIP_LABELS[conn.relationship] || { label: conn.relationship, color: 'text-cyan-400', badge: 'border-cyan-500/30' };

                            return (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${rel.badge} ${rel.color}`}>
                                    {rel.label}
                                  </span>
                                  <span className="text-white/80 font-mono text-[11px]">
                                    {target ? target.content : `[ID: ${conn.targetMemoryId}]`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[9px] text-white/40">
                                  {conn.description && (
                                    <span className="italic">"{conn.description}"</span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveConnection(sourceMem.id, conn.targetMemoryId)}
                                    className="text-white/30 hover:text-rose-400 p-1"
                                    title="Excluir link"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: Pattern Recognition & Past Limitations Analyzer */}
        {activeTab === 'patterns' && (
          <div className="p-6 rounded-2xl border border-indigo-500/30 bg-black/60 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-mono font-bold uppercase text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  Detector de Padrões Recorrentes & Limitações Passadas
                </h3>
                <p className="text-xs text-white/50 font-sans">
                  Metamemória analítica que audita respostas passadas, identifica vícios epistemológicos e catalisa avanços sem regressão.
                </p>
              </div>

              <button
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzingPatterns}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
              >
                {isAnalyzingPatterns ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isAnalyzingPatterns ? 'Processando Síntese...' : 'Atualizar Análise com IA'}</span>
              </button>
            </div>

            {/* Fallback / Initial Static Synthesis if not yet triggered via API */}
            {(!patternsAnalysisResult && !isAnalyzingPatterns) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patterns Column */}
                <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Padrões Recorrentes Entre Gerações
                  </h4>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-white/5 bg-black/40 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-indigo-400 font-bold">
                        <span>1. Transição de Fase Dialética</span>
                        <span className="text-white/40 text-[10px]">Freq: 3x</span>
                      </div>
                      <p className="text-white/70 font-sans text-xs">
                        Quando a IA atinge impasse entre física clássica e biologia, o salto evolutivo ocorre via formulação de simetrias topológicas ou invariantes de escala.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-white/5 bg-black/40 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-indigo-400 font-bold">
                        <span>2. Dissipação Entrópica em Bifurcações</span>
                        <span className="text-white/40 text-[10px]">Freq: 2x</span>
                      </div>
                      <p className="text-white/70 font-sans text-xs">
                        A introdução de ciclos de purga baseados em Landauer e Prigogine restaura a coerência lógica prevenindo saturação cognitiva.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Past Limitations Column */}
                <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Limitações de Respostas Passadas
                  </h4>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-rose-500/20 bg-black/40 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-rose-400 font-bold">
                        <span>1. Aprisionamento em Gradientes Monótonos (Gen 2)</span>
                        <span className="text-white/40 text-[10px]">Anomalia -2.4σ</span>
                      </div>
                      <p className="text-white/70 font-sans text-xs">
                        A suposição de convergência estritamente suave (mem_105) ignorava a necessidade de tunelamento quântico e causou estagnação antes do salto quântico.
                      </p>
                      <div className="text-[10px] text-emerald-400 font-mono pt-1">
                        ✓ Mitigação: Proibir hipóteses puramente estáticas sem validação estocástica.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-amber-500/20 bg-black/40 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-amber-400 font-bold">
                        <span>2. Diluição por Média Aritmética (Gen 1)</span>
                        <span className="text-white/40 text-[10px]">Obsoleta (mem_104)</span>
                      </div>
                      <p className="text-white/70 font-sans text-xs">
                        A tentativa de acomodar subagentes somando médias eliminou premissas divergentes necessárias à emergência.
                      </p>
                      <div className="text-[10px] text-emerald-400 font-mono pt-1">
                        ✓ Mitigação: Adoção obrigatória de sínteses dialéticas tese/antítese.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic AI Analysis Results */}
            {patternsAnalysisResult && (
              <div className="space-y-6">
                {/* Health Score Meter */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono text-white/50 uppercase">Índice de Saúde Epistêmica Global</span>
                    <h4 className="text-lg font-mono font-bold text-white">
                      {patternsAnalysisResult.epistemicHealthScore}% de Coerência
                    </h4>
                  </div>
                  <div className="w-48 h-3 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${patternsAnalysisResult.epistemicHealthScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dynamic Recurrent Patterns */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Padrões Recorrentes Mapeados
                    </h4>
                    <div className="space-y-2">
                      {patternsAnalysisResult.recurrentPatterns.map((p, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1 font-mono text-xs">
                          <div className="flex justify-between text-indigo-300 font-bold">
                            <span>{p.pattern}</span>
                            <span className="text-white/40 text-[10px]">{p.occurrenceCount} ocorrências</span>
                          </div>
                          <p className="text-white/70 font-sans text-xs">{p.description}</p>
                          {p.implications && (
                            <p className="text-white/40 text-[10px] italic pt-1">{p.implications}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Past Limitations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Limitações Identificadas & Superações
                    </h4>
                    <div className="space-y-2">
                      {patternsAnalysisResult.pastLimitations.map((lim, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between text-rose-300 font-bold">
                            <span>{lim.limitation}</span>
                            <span className="text-white/40 text-[10px]">Geração {lim.generationObserved}</span>
                          </div>
                          <p className="text-white/70 font-sans text-xs">{lim.impact}</p>
                          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                            <strong>Estratégia:</strong> {lim.mitigation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {patternsAnalysisResult.recommendations && (
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2 font-mono text-xs">
                    <h4 className="text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> Recomendações para as Próximas Gerações
                    </h4>
                    <ul className="space-y-1.5 pl-4 list-disc text-white/80 font-sans">
                      {patternsAnalysisResult.recommendations.map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Connect Memories */}
      <AnimatePresence>
        {activeConnectingMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0c1015] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Link2 className="w-5 h-5" />
                  <h3 className="text-sm font-mono font-bold uppercase">
                    Conectar Memória Epistêmica
                  </h3>
                </div>
                <button
                  onClick={() => setActiveConnectingMemory(null)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source Memory preview */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs font-mono">
                <span className="text-white/40 text-[9px] uppercase">Memória de Origem:</span>
                <p className="text-white/80 line-clamp-2">{activeConnectingMemory.content}</p>
              </div>

              {/* Target Memory Picker */}
              <div className="space-y-1.5 text-xs font-mono">
                <label className="text-white/60">Selecionar Memória de Destino:</label>
                <select
                  value={connectionTargetId}
                  onChange={(e) => setConnectionTargetId(e.target.value)}
                  className="w-full bg-black/60 border border-evolve-line rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                >
                  <option value="">Selecione uma memória...</option>
                  {knowledgeBank
                    .filter(m => m.id !== activeConnectingMemory.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        [GEN_{m.generation || 1}] {m.theme || m.contributor}: {m.content.slice(0, 50)}...
                      </option>
                    ))}
                </select>
              </div>

              {/* Relationship Type */}
              <div className="space-y-1.5 text-xs font-mono">
                <label className="text-white/60">Tipo de Relação Dialética:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(RELATIONSHIP_LABELS) as (keyof typeof RELATIONSHIP_LABELS)[]).map(relKey => (
                    <button
                      key={relKey}
                      type="button"
                      onClick={() => setConnectionRelation(relKey as any)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        connectionRelation === relKey
                          ? `${RELATIONSHIP_LABELS[relKey].badge} ${RELATIONSHIP_LABELS[relKey].color} font-bold ring-1 ring-current`
                          : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {RELATIONSHIP_LABELS[relKey].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Dialectic note */}
              <div className="space-y-1.5 text-xs font-mono">
                <label className="text-white/60">Nota / Justificativa da Conexão (Opcional):</label>
                <input
                  type="text"
                  value={connectionDesc}
                  onChange={(e) => setConnectionDesc(e.target.value)}
                  placeholder="Ex: Estende o formalismo para regimes termodinâmicos abertos"
                  className="w-full bg-black/60 border border-evolve-line rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveConnectingMemory(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateConnection}
                  disabled={!connectionTargetId}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-mono font-bold uppercase disabled:opacity-40 hover:bg-cyan-400 transition-all"
                >
                  Estabelecer Conexão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add New Memory */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-evolve-accent/40 bg-[#0c1015] p-6 space-y-4 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-evolve-accent">
                  <Database className="w-5 h-5" />
                  <h3 className="text-sm font-mono font-bold uppercase">
                    Indexar Nova Memória Geracional
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4 font-mono text-xs">
                {/* Content */}
                <div className="space-y-1">
                  <label className="text-white/70">Conteúdo do Axioma / Descoberta:</label>
                  <textarea
                    required
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Descreva a lei, heurística, modelo ou axioma..."
                    className="w-full bg-black/60 border border-evolve-line rounded-lg p-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-evolve-accent font-mono"
                  />
                </div>

                {/* Status & Generation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/70">Status Epistêmico:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as MemoryStatus)}
                      className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                    >
                      {(Object.keys(STATUS_CONFIG) as MemoryStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70">Geração de Origem:</label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={newGen}
                      onChange={(e) => setNewGen(Number(e.target.value))}
                      className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Theme & Contributor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/70">Tema / Taxonomia:</label>
                    <input
                      type="text"
                      value={newTheme}
                      onChange={(e) => setNewTheme(e.target.value)}
                      placeholder="Ex: Termodinâmica & Entropia"
                      className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70">Subagente / Autor:</label>
                    <input
                      type="text"
                      value={newContributor}
                      onChange={(e) => setNewContributor(e.target.value)}
                      placeholder="Ex: Física & Filosofia"
                      className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Recurrent Pattern Note */}
                <div className="space-y-1">
                  <label className="text-white/70">Padrão Recorrente Identificado (Opcional):</label>
                  <input
                    type="text"
                    value={newRecurrentPattern}
                    onChange={(e) => setNewRecurrentPattern(e.target.value)}
                    placeholder="Ex: Invariância de escala sob regimes fora do equilíbrio"
                    className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Past Limitation Note */}
                <div className="space-y-1">
                  <label className="text-white/70">Limitação Passada / Viés Detectado (Opcional):</label>
                  <input
                    type="text"
                    value={newPastLimitation}
                    onChange={(e) => setNewPastLimitation(e.target.value)}
                    placeholder="Ex: Desconsiderava flutuações quânticas em nanoescala"
                    className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="text-white/70">Tags (separadas por vírgula):</label>
                  <input
                    type="text"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    placeholder="Entropia, Quântica, Dialética"
                    className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-mono"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-evolve-accent text-evolve-bg font-bold text-xs font-mono uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,255,156,0.3)]"
                  >
                    Indexar Memória
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
