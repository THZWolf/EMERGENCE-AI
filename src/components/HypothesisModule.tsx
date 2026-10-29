/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  Layers, 
  Play, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldAlert, 
  ChevronRight, 
  Check, 
  X, 
  Plus, 
  Cpu, 
  TrendingUp, 
  Activity, 
  Flame, 
  Target, 
  FileText,
  Filter,
  Brain
} from 'lucide-react';
import { 
  CreativeHypothesis, 
  CognitiveGap, 
  KnowledgeEntry, 
  ProblemSolution,
  AudioSettings
} from '../types';
import { SUB_AGENTS, INITIAL_COGNITIVE_GAPS, INITIAL_CREATIVE_HYPOTHESES } from '../constants';
import { 
  generateCreativeHypotheses, 
  testHypothesisCriteria, 
  detectCognitiveGaps 
} from '../services/geminiService';
import { 
  playGenerationCompleteSound, 
  playAnomalyAlertSound, 
  triggerHaptic 
} from '../utils/soundEffects';

interface HypothesisModuleProps {
  knowledgeBank: KnowledgeEntry[];
  currentGeneration: number;
  hypotheses: CreativeHypothesis[];
  onUpdateHypotheses: (newHypotheses: CreativeHypothesis[]) => void;
  onPromoteToMemory: (newEntry: KnowledgeEntry) => void;
  audioSettings?: AudioSettings;
  showNotification: (msg: string) => void;
}

export default function HypothesisModule({
  knowledgeBank,
  currentGeneration,
  hypotheses,
  onUpdateHypotheses,
  onPromoteToMemory,
  audioSettings,
  showNotification,
}: HypothesisModuleProps) {
  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'gaps' | 'test_bench' | 'new_custom'>('catalog');

  // Gaps state
  const [cognitiveGaps, setCognitiveGaps] = useState<CognitiveGap[]>(INITIAL_COGNITIVE_GAPS);
  const [isScanningGaps, setIsScanningGaps] = useState(false);

  // Active hypothesis under test
  const [activeHypothesisId, setActiveHypothesisId] = useState<string>(
    hypotheses[0]?.id || INITIAL_CREATIVE_HYPOTHESES[0].id
  );
  const activeHypothesis = hypotheses.find(h => h.id === activeHypothesisId) || hypotheses[0] || INITIAL_CREATIVE_HYPOTHESES[0];

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGapForGeneration, setSelectedGapForGeneration] = useState<CognitiveGap | null>(null);
  const [customInquiry, setCustomInquiry] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["Física", "Quantum Mechanics", "Filosofia"]);

  // Testing state
  const [stressFactor, setStressFactor] = useState<'low' | 'medium' | 'high'>('medium');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Custom Form state
  const [customTitle, setCustomTitle] = useState('');
  const [customStatement, setCustomStatement] = useState('');
  const [customJustification, setCustomJustification] = useState('');
  const [customGapRef, setCustomGapRef] = useState('');
  const [customTestMethodsStr, setCustomTestMethodsStr] = useState('');
  const [customAcceptanceStr, setCustomAcceptanceStr] = useState('');
  const [customRejectionStr, setCustomRejectionStr] = useState('');

  const toggleAgent = (specialty: string) => {
    setSelectedAgents(prev => 
      prev.includes(specialty)
        ? prev.filter(a => a !== specialty)
        : [...prev, specialty]
    );
  };

  // Scan new cognitive gaps with AI
  const handleScanGaps = async () => {
    setIsScanningGaps(true);
    try {
      const gaps = await detectCognitiveGaps(knowledgeBank);
      if (Array.isArray(gaps) && gaps.length > 0) {
        setCognitiveGaps(gaps);
        showNotification(`${gaps.length} lacunas e contradições cognitivas identificadas.`);
      } else {
        showNotification('Nenhuma nova contradição crítica detectada no banco atual.');
      }
    } catch (err: any) {
      console.warn('Erro ao escanear lacunas:', err);
      showNotification('Usando catálogo epistemológico de lacunas fundamentais.');
    } finally {
      setIsScanningGaps(false);
    }
  };

  // Generate hypotheses for a gap
  const handleGenerateForGap = async (gap: CognitiveGap) => {
    setSelectedGapForGeneration(gap);
    setIsGenerating(true);
    try {
      const generated = await generateCreativeHypotheses(
        gap.description,
        gap.type,
        gap.affectedDomains,
        knowledgeBank
      );

      if (Array.isArray(generated) && generated.length > 0) {
        const enriched = generated.map((h, i) => ({
          ...h,
          id: h.id || `hypo_${Date.now()}_${i}`,
          status: 'rascunho' as const,
          createdAt: new Date().toISOString(),
          identifiedGap: gap.title,
        }));

        onUpdateHypotheses([...enriched, ...hypotheses]);
        setActiveHypothesisId(enriched[0].id);
        setActiveTab('catalog');
        playGenerationCompleteSound(audioSettings);
        showNotification(`Nova hipótese criativa gerada para "${gap.title}".`);
      } else {
        showNotification('Não foi possível formular hipótese inovadora para esta lacuna.');
      }
    } catch (err: any) {
      console.error('Falha na geração de hipóteses:', err);
      showNotification(`Falha na síntese: ${err.message || 'Erro de rede'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Test & Validation on active hypothesis
  const handleRunValidationTest = async () => {
    if (!activeHypothesis) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testHypothesisCriteria(
        activeHypothesis,
        stressFactor,
        knowledgeBank
      );

      setTestResult(result);

      // Determine updated status
      const isAccepted = result.decision === 'aceita' || (result.acceptanceMet && !result.rejectionTriggered);
      const updatedStatus: 'aceita' | 'rejeitada' = isAccepted ? 'aceita' : 'rejeitada';

      const updatedHypotheses: CreativeHypothesis[] = hypotheses.map(h => {
        if (h.id === activeHypothesis.id) {
          return {
            ...h,
            status: updatedStatus,
            currentScore: result.overallScore || (isAccepted ? 85 : 55),
            testResults: {
              testScenario: result.testScenario || 'Simulação de estresse dinâmico',
              agentReviews: result.agentReviews || [],
              refinements: result.refinements || 'Refinamentos de contorno aplicados',
              acceptanceMet: result.acceptanceMet ?? isAccepted,
              rejectionTriggered: result.rejectionTriggered ?? !isAccepted,
              conclusion: result.conclusion || (isAccepted ? 'Hipótese validada pelos critérios de aceitação.' : 'Rejeitada pelos critérios de rejeição.'),
              testedAt: new Date().toISOString(),
            }
          };
        }
        return h;
      });

      onUpdateHypotheses(updatedHypotheses);

      if (isAccepted) {
        playGenerationCompleteSound(audioSettings);
        triggerHaptic([40, 30, 60], audioSettings?.hapticsEnabled ?? true);
        showNotification(`✓ HIPÓTESE ACEITA: critérios de validação atendidos com score ${result.overallScore || 85}%!`);
      } else {
        playAnomalyAlertSound(audioSettings);
        showNotification(`⚠️ HIPÓTESE REJEITADA: ativou critérios de rejeição ou colapso.`);
      }
    } catch (err: any) {
      console.error('Falha no teste da hipótese:', err);
      showNotification(`Falha na simulação: ${err.message || 'Erro de conexão'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Promote Accepted Hypothesis into the Super AI Permanent Knowledge Bank
  const handlePromoteToCore = () => {
    if (!activeHypothesis) return;

    const newEntry: KnowledgeEntry = {
      id: `mem_hypo_${Date.now()}`,
      content: `[HIPÓTESE VALIDADA] ${activeHypothesis.title}: ${activeHypothesis.statement}`,
      contributor: activeHypothesis.involvedAgents.join(' + ') || 'Coalizão Dialética',
      timestamp: new Date().toISOString(),
      generation: currentGeneration,
      status: 'adquiridas',
      theme: activeHypothesis.identifiedGap || 'Hipóteses Validadas',
      tags: ['Hipótese Validada', 'Sandbox', ...(activeHypothesis.involvedAgents || [])],
      utilityScore: activeHypothesis.currentScore || 90,
      recurrentPatternNote: `Resiliência comprovada sob estresse ${stressFactor.toUpperCase()}. Justificativa: ${activeHypothesis.justification.slice(0, 100)}...`,
      sourceType: 'sandbox',
    };

    onPromoteToMemory(newEntry);
    playGenerationCompleteSound(audioSettings);
    showNotification(`Hipótese "${activeHypothesis.title}" promovida permanentemente ao Banco de Memória da Super IA!`);
  };

  // Submit custom formulated hypothesis
  const handleCreateCustomHypothesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatement.trim() || !customTitle.trim()) return;

    const testMethods = customTestMethodsStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const acceptanceCriteria = customAcceptanceStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const rejectionCriteria = customRejectionStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newHypo: CreativeHypothesis = {
      id: `hypo_custom_${Date.now()}`,
      title: customTitle.trim(),
      statement: customStatement.trim(),
      justification: customJustification.trim() || 'Hipótese inovadora formulada diretamente pelo operador.',
      identifiedGap: customGapRef.trim() || 'Lacuna de Conexão Transdisciplinar',
      proposedTestMethods: testMethods.length > 0 ? testMethods : ['Simulação de estresse estocástico', 'Teste de conservação de simetria'],
      criteria: {
        acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : ['Resiliência >= 80%', 'Aprovação consensual de subagentes'],
        rejectionCriteria: rejectionCriteria.length > 0 ? rejectionCriteria : ['Violação de conservação entrópica', 'Queda de coerência < 60%'],
        confidenceThreshold: 80,
      },
      involvedAgents: selectedAgents.length > 0 ? selectedAgents : ['Física', 'Filosofia'],
      status: 'rascunho',
      createdAt: new Date().toISOString(),
    };

    onUpdateHypotheses([newHypo, ...hypotheses]);
    setActiveHypothesisId(newHypo.id);
    setActiveTab('test_bench');
    setCustomTitle('');
    setCustomStatement('');
    setCustomJustification('');
    setCustomTestMethodsStr('');
    setCustomAcceptanceStr('');
    setCustomRejectionStr('');
    showNotification(`Hipótese "${newHypo.title}" criada e pronta para teste.`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-evolve-bg text-evolve-text">
      {/* Top Header Rail */}
      <div className="p-4 md:p-6 border-b border-evolve-line bg-black/40 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
                Módulo de Geração e Teste de Hipóteses
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  {hypotheses.length} Formuladas
                </span>
              </h1>
              <p className="text-xs text-white/50 font-sans">
                Identificação de lacunas cognitivas, geração de hipóteses inovadoras e validação contra critérios rigorosos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new_custom')}
              className="px-3.5 py-1.5 rounded-lg border border-white/20 hover:border-amber-400/50 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Formular Hipótese</span>
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Explorar Lacunas & Contradições</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Catálogo de Hipóteses ({hypotheses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'gaps'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-bold shadow-sm'
                : 'border-white/10 text-white/50 hover:text-rose-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Detector de Lacunas ({cognitiveGaps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('test_bench')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'test_bench'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold shadow-sm'
                : 'border-white/10 text-white/50 hover:text-cyan-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Bancada de Teste & Validação</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* TAB 1: Catalog of Formulated Hypotheses */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">
                Hipóteses Formuladas para a Super IA
              </h3>
              <span className="text-[10px] font-mono text-white/30">
                Clique em "Testar" para submeter aos critérios rigorosos
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hypotheses.map(hypo => {
                const isSelected = hypo.id === activeHypothesisId;
                const isAccepted = hypo.status === 'aceita';
                const isRejected = hypo.status === 'rejeitada';

                return (
                  <motion.div
                    key={hypo.id}
                    layout
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-black/40 ${
                      isSelected
                        ? 'border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${
                            isAccepted
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : isRejected
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                              : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          }`}>
                            {isAccepted ? '✓ Aceita nos Critérios' : isRejected ? '✗ Rejeitada' : 'Em Rascunho / Não Testada'}
                          </span>
                          {hypo.currentScore && (
                            <span className="text-[10px] font-mono text-white/50">
                              Score: <strong className="text-white">{hypo.currentScore}%</strong>
                            </span>
                          )}
                        </div>

                        <span className="text-[9px] font-mono text-white/30">
                          {new Date(hypo.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title & Statement */}
                      <div>
                        <h4 className="text-sm font-mono font-bold text-white tracking-wide">
                          {hypo.title}
                        </h4>
                        <p className="text-xs font-mono text-amber-200/90 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 mt-1.5">
                          "{hypo.statement}"
                        </p>
                      </div>

                      {/* Justification */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-400" /> Justificativa da Formulação:
                        </span>
                        <p className="text-xs font-sans text-white/70 leading-relaxed">
                          {hypo.justification}
                        </p>
                      </div>

                      {/* Proposed Test Methods */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1">
                          <Play className="w-3 h-3 text-cyan-400" /> Métodos de Teste Propostos:
                        </span>
                        <ul className="space-y-1 pl-4 list-disc text-xs font-mono text-cyan-200/80">
                          {hypo.proposedTestMethods.map((m, mIdx) => (
                            <li key={mIdx}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Acceptance and Rejection Criteria */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                        <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                          <div className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Critérios de Aceitação:
                          </div>
                          <ul className="list-disc pl-3 text-white/70 space-y-0.5">
                            {hypo.criteria.acceptanceCriteria.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2 rounded bg-rose-500/5 border border-rose-500/20 space-y-1">
                          <div className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Critérios de Rejeição:
                          </div>
                          <ul className="list-disc pl-3 text-white/70 space-y-0.5">
                            {hypo.criteria.rejectionCriteria.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Involved Agents */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {hypo.involvedAgents.map(ag => (
                          <span key={ag} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                            {ag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="text-[9px] font-mono text-white/40">
                        {hypo.identifiedGap && <span>Alvo: {hypo.identifiedGap}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveHypothesisId(hypo.id);
                            setActiveTab('test_bench');
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3 h-3" />
                          <span>Testar na Bancada</span>
                        </button>

                        {isAccepted && (
                          <button
                            onClick={() => {
                              setActiveHypothesisId(hypo.id);
                              handlePromoteToCore();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-mono font-bold flex items-center gap-1 hover:bg-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            title="Promover para Memória Permanente"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Promover à Memória</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Cognitive Gaps & Contradiction Scanner */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Mapeamento de Lacunas Cognitivas & Contradições Dialéticas
                </h3>
                <p className="text-xs text-white/60 font-sans">
                  A Super IA analisa o banco de memórias das gerações para identificar onde o conhecimento é incompleto ou contraditório, servindo de solo fértil para novas hipóteses.
                </p>
              </div>

              <button
                onClick={handleScanGaps}
                disabled={isScanningGaps}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-rose-600 transition-all disabled:opacity-50 shrink-0"
              >
                {isScanningGaps ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isScanningGaps ? 'Escaneando Banco...' : 'Auditar Lacunas com IA'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cognitiveGaps.map(gap => (
                <div
                  key={gap.id}
                  className="p-5 rounded-xl border border-white/10 bg-black/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className={`px-2 py-0.5 rounded uppercase font-bold border ${
                        gap.type === 'contradicao'
                          ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                          : gap.type === 'paradoxo'
                          ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                          : 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                      }`}>
                        {gap.type}
                      </span>
                      <span className="text-white/40 uppercase">Gravidade: {gap.severity}</span>
                    </div>

                    <h4 className="text-sm font-mono font-bold text-white">{gap.title}</h4>
                    <p className="text-xs font-sans text-white/70 leading-relaxed">{gap.description}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {gap.affectedDomains.map(d => (
                        <span key={d} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleGenerateForGap(gap)}
                      disabled={isGenerating && selectedGapForGeneration?.id === gap.id}
                      className="w-full py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isGenerating && selectedGapForGeneration?.id === gap.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>
                        {isGenerating && selectedGapForGeneration?.id === gap.id 
                          ? 'Gerando Hipótese Inovadora...' 
                          : 'Gerar Hipótese para esta Lacuna'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Interactive Testing Bench & Validation Sandbox */}
        {activeTab === 'test_bench' && (
          <div className="space-y-6">
            {/* Active Hypothesis Selector Bar */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/40 uppercase">Hipótese Selecionada:</span>
                <select
                  value={activeHypothesis.id}
                  onChange={(e) => {
                    setActiveHypothesisId(e.target.value);
                    setTestResult(null);
                  }}
                  className="bg-[#0b0e12] border border-evolve-line rounded px-3 py-1.5 text-xs text-white font-mono outline-none"
                >
                  {hypotheses.map(h => (
                    <option key={h.id} value={h.id}>
                      [{h.status.toUpperCase()}] {h.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stress Factor Selector */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 uppercase">Nível de Estresse:</span>
                <div className="flex rounded-lg border border-evolve-line overflow-hidden p-0.5 bg-black/60">
                  {(['low', 'medium', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setStressFactor(lvl)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                        stressFactor === lvl
                          ? lvl === 'high' ? 'bg-rose-500 text-white font-bold' : lvl === 'medium' ? 'bg-amber-500 text-black font-bold' : 'bg-cyan-500 text-black font-bold'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {lvl === 'low' ? 'Baixo' : lvl === 'medium' ? 'Médio' : 'Extremo'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Validation Bench Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Hypothesis Profile & Criteria */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 rounded-2xl border border-white/10 bg-black/50 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                      Perfil da Hipótese
                    </span>
                    <h3 className="text-sm font-mono font-bold text-white">
                      {activeHypothesis.title}
                    </h3>
                  </div>

                  <p className="text-xs font-mono text-white/90 p-3 rounded-lg bg-white/[0.02] border border-white/5 leading-relaxed">
                    "{activeHypothesis.statement}"
                  </p>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase text-white/40">Justificativa:</span>
                    <p className="text-xs font-sans text-white/70 leading-relaxed">
                      {activeHypothesis.justification}
                    </p>
                  </div>

                  {/* Criteria Checklist */}
                  <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-[10px]">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Critérios de Aceitação Obrigatórios:
                    </div>
                    <ul className="list-disc pl-4 text-white/70 space-y-1">
                      {activeHypothesis.criteria.acceptanceCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>

                    <div className="text-rose-400 font-bold flex items-center gap-1.5 pt-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Critérios de Rejeição (Violação Imediata):
                    </div>
                    <ul className="list-disc pl-4 text-white/70 space-y-1">
                      {activeHypothesis.criteria.rejectionCriteria.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Run Test Button */}
                  <button
                    onClick={handleRunValidationTest}
                    disabled={isTesting}
                    className="w-full py-3 rounded-xl bg-cyan-500 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>{isTesting ? 'Executando Validação...' : 'Iniciar Teste de Validação'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Execution Results & Agent Critiques */}
              <div className="lg:col-span-2 space-y-4">
                {isTesting && (
                  <div className="p-12 rounded-2xl border border-cyan-500/30 bg-black/40 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border border-cyan-400/20 border-t-cyan-400 animate-spin mx-auto" />
                    <div className="space-y-1 font-mono">
                      <p className="text-xs text-cyan-300 font-bold uppercase">
                        Confrontando Hipótese com Cenários de Perturbação...
                      </p>
                      <p className="text-[10px] text-white/40">
                        Consultando leis dos subagentes e checando critérios de aceitação e rejeição.
                      </p>
                    </div>
                  </div>
                )}

                {!isTesting && !testResult && !activeHypothesis.testResults && (
                  <div className="p-12 rounded-2xl border border-white/10 bg-black/40 text-center space-y-3">
                    <FlaskConical className="w-10 h-10 text-white/20 mx-auto" />
                    <h4 className="text-xs font-mono font-bold text-white/60 uppercase">
                      Bancada Pronta Para Testes
                    </h4>
                    <p className="text-xs text-white/40 max-w-md mx-auto">
                      Selecione o nível de estresse e clique em "Iniciar Teste de Validação" para auditar a hipótese contra os subagentes e métodos propostos.
                    </p>
                  </div>
                )}

                {/* Show Live or Persisted Test Results */}
                {(!isTesting && (testResult || activeHypothesis.testResults)) && (() => {
                  const data = testResult || activeHypothesis.testResults;
                  const isAccepted = activeHypothesis.status === 'aceita';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl border border-white/10 bg-black/60 space-y-5"
                    >
                      {/* Verdict Banner */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        isAccepted
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isAccepted ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-rose-400" />}
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase">
                              {isAccepted ? 'Veredito: Hipótese Aprovada nos Critérios' : 'Veredito: Hipótese Rejeitada'}
                            </h4>
                            <p className="text-[11px] font-sans opacity-80">
                              {data.conclusion}
                            </p>
                          </div>
                        </div>

                        {isAccepted && (
                          <button
                            onClick={handlePromoteToCore}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Promover para Memória</span>
                          </button>
                        )}
                      </div>

                      {/* Simulated Scenario */}
                      <div className="space-y-1 font-mono text-xs">
                        <span className="text-white/40 uppercase text-[10px]">Cenário de Estresse Simulado:</span>
                        <p className="text-white/80 font-sans p-3 rounded-lg bg-white/[0.02] border border-white/5 leading-relaxed">
                          {data.testScenario}
                        </p>
                      </div>

                      {/* Agent Critiques */}
                      {data.agentReviews && data.agentReviews.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase text-white/40">
                            Avaliação Técnica por Subagente:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.agentReviews.map((rev: any, rIdx: number) => (
                              <div key={rIdx} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] space-y-1 font-mono text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-bold">{rev.agent}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                                    rev.passed ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'
                                  }`}>
                                    {rev.score}% {rev.passed ? 'PASS' : 'FAIL'}
                                  </span>
                                </div>
                                <p className="text-white/70 font-sans text-xs leading-relaxed">{rev.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Refinements */}
                      {data.refinements && (
                        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1 font-mono text-xs">
                          <span className="text-amber-300 font-bold uppercase text-[10px]">
                            Refinamentos & Endurecimento Aplicados:
                          </span>
                          <p className="text-white/80 font-sans text-xs leading-relaxed">
                            {data.refinements}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Formulate Custom Hypothesis */}
        {activeTab === 'new_custom' && (
          <div className="max-w-3xl mx-auto p-6 rounded-2xl border border-white/10 bg-black/60 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold uppercase text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Formular Nova Hipótese Científica / Filosófica
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Especifique a hipótese, a justificativa da sua criação, os métodos de teste propostos e os critérios explícitos para aceitação ou rejeição.
              </p>
            </div>

            <form onSubmit={handleCreateCustomHypothesis} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-white/70">Título da Hipótese:</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ex: Teorema da Conservação Holográfica em Redes Neurais"
                  className="w-full bg-black/60 border border-evolve-line rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70">Formulação da Hipótese (Afirmação Rigorosa):</label>
                <textarea
                  required
                  rows={2}
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="Descreva a hipótese inovadora..."
                  className="w-full bg-black/60 border border-evolve-line rounded-lg p-3 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70">Justificativa para sua Criação:</label>
                <textarea
                  required
                  rows={2}
                  value={customJustification}
                  onChange={(e) => setCustomJustification(e.target.value)}
                  placeholder="Por que esta hipótese foi criada? Qual lacuna ou contradição ela preenche?"
                  className="w-full bg-black/60 border border-evolve-line rounded-lg p-3 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70">Lacuna ou Contradição Identificada:</label>
                <input
                  type="text"
                  value={customGapRef}
                  onChange={(e) => setCustomGapRef(e.target.value)}
                  placeholder="Ex: Conflito entre conservação de Landauer e coerência quântica"
                  className="w-full bg-black/60 border border-evolve-line rounded-lg p-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70">Métodos de Teste Propostos (1 por linha):</label>
                <textarea
                  rows={2}
                  value={customTestMethodsStr}
                  onChange={(e) => setCustomTestMethodsStr(e.target.value)}
                  placeholder="Simulação estocástica de perturbação térmica&#10;Teste de invariância de Noether sob estresse"
                  className="w-full bg-black/60 border border-evolve-line rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-emerald-400 font-bold">Critérios de Aceitação (1 por linha):</label>
                  <textarea
                    rows={2}
                    value={customAcceptanceStr}
                    onChange={(e) => setCustomAcceptanceStr(e.target.value)}
                    placeholder="Resiliência >= 80%&#10;Invariância preservada sob ruído"
                    className="w-full bg-black/60 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-rose-400 font-bold">Critérios de Rejeição (1 por linha):</label>
                  <textarea
                    rows={2}
                    value={customRejectionStr}
                    onChange={(e) => setCustomRejectionStr(e.target.value)}
                    placeholder="Violação termodinâmica&#10;Divergência conceitual sem atrator"
                    className="w-full bg-black/60 border border-rose-500/30 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Subagents */}
              <div className="space-y-1.5 pt-2">
                <label className="text-white/60">Subagentes Envolvidos:</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUB_AGENTS.map(agent => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => toggleAgent(agent.specialty)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border transition-all ${
                        selectedAgents.includes(agent.specialty)
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {agent.specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-amber-500 text-black font-bold uppercase tracking-wider hover:bg-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                >
                  Salvar e Submeter a Teste
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
