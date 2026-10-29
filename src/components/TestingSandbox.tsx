/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  ShieldAlert, 
  Play, 
  RefreshCw, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Sparkles, 
  Fingerprint, 
  Zap,
  Check,
  ChevronRight,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { SUB_AGENTS } from '../constants';
import { 
  SandboxHypothesis, 
  SimulatedIteration, 
  KnowledgeEntry, 
  ProblemSolution 
} from '../types';
import { simulateSandboxIteration } from '../services/geminiService';

interface TestingSandboxProps {
  onPromoteHypothesis: (
    hypothesis: SandboxHypothesis, 
    knowledgeEntry: KnowledgeEntry, 
    promotedSolution: ProblemSolution
  ) => void;
  knowledgeBank: KnowledgeEntry[];
  currentGeneration: number;
}

const PRESET_HYPOTHESES = [
  {
    title: "Quantum-Classical Holographic Information Boundary",
    statement: "Macroscopic thermodynamic stability emerges because quantum entanglement decoheres according to holographic area-law boundaries, preventing information erasure.",
    origin: "Quantum Mechanics + Física",
    agents: ["Física", "Quantum Mechanics", "Matemática"]
  },
  {
    title: "Autopoietic Structural Coupling in Neuromorphic Swarms",
    statement: "Distributed artificial agents achieve perpetual operational resilience without catastrophic forgetting by coupling their feedback loops autopoietically rather than through global gradient descent.",
    origin: "Neurociência + Cibernética + Biologia",
    agents: ["Neurociência", "Cibernética", "Biologia Computacional"]
  },
  {
    title: "Non-Zero-Sum Dynamic Game Equilibria Under Asymmetric Scarcity",
    statement: "When resources fluctuate non-linearly, reciprocal altruism is mathematically strictly superior to zero-sum Nash competition if agents share an immutable evolutionary memory ledger.",
    origin: "Economia + Sociologia + Filosofia",
    agents: ["Economia", "Sociologia", "Filosofia"]
  }
];

export default function TestingSandbox({
  onPromoteHypothesis,
  knowledgeBank,
  currentGeneration,
}: TestingSandboxProps) {
  const [activeHypothesis, setActiveHypothesis] = useState<SandboxHypothesis>({
    id: `hypo_${Date.now()}`,
    title: PRESET_HYPOTHESES[0].title,
    statement: PRESET_HYPOTHESES[0].statement,
    originSource: PRESET_HYPOTHESES[0].origin,
    involvedAgents: PRESET_HYPOTHESES[0].agents,
    status: 'draft',
    currentResilience: 45,
    iterations: [],
    createdAt: new Date().toISOString()
  });

  const [stressFactor, setStressFactor] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotedSuccess, setPromotedSuccess] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(PRESET_HYPOTHESES[0].agents);

  const toggleAgent = (specialty: string) => {
    setSelectedAgents(prev => 
      prev.includes(specialty)
        ? prev.filter(a => a !== specialty)
        : [...prev, specialty]
    );
  };

  const handleApplyPreset = (preset: typeof PRESET_HYPOTHESES[0]) => {
    setActiveHypothesis({
      id: `hypo_${Date.now()}`,
      title: preset.title,
      statement: preset.statement,
      originSource: preset.origin,
      involvedAgents: preset.agents,
      status: 'draft',
      currentResilience: 48,
      iterations: [],
      createdAt: new Date().toISOString()
    });
    setSelectedAgents(preset.agents);
    setPromotedSuccess(false);
  };

  const handleRunSimulation = async () => {
    if (!activeHypothesis.statement.trim()) {
      setError("Insira uma formulação de hipótese antes de simular.");
      return;
    }
    setError(null);
    setIsSimulating(true);

    const nextIterationNumber = activeHypothesis.iterations.length + 1;
    const currentStatement = activeHypothesis.refinedSolution || activeHypothesis.statement;
    const previousFailures = activeHypothesis.iterations.flatMap(it => it.failurePoints);

    try {
      const iteration = await simulateSandboxIteration(
        currentStatement,
        stressFactor,
        selectedAgents.length > 0 ? selectedAgents : activeHypothesis.involvedAgents,
        nextIterationNumber,
        previousFailures
      );

      setActiveHypothesis(prev => {
        const updatedIterations = [...prev.iterations, iteration];
        const isPassed = iteration.status === 'passed' || iteration.resilienceScore >= 80;

        return {
          ...prev,
          status: isPassed ? 'tested' : 'simulating',
          currentResilience: iteration.resilienceScore,
          iterations: updatedIterations,
          refinedSolution: iteration.refinementsApplied
        };
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao executar ciclo de simulação no sandbox.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleMultiIterationStressTest = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setError(null);

    try {
      let currentHypo = activeHypothesis;
      for (let i = 0; i < 2; i++) {
        const nextIterationNumber = currentHypo.iterations.length + 1;
        const currentStatement = currentHypo.refinedSolution || currentHypo.statement;
        const previousFailures = currentHypo.iterations.flatMap(it => it.failurePoints);

        const iteration = await simulateSandboxIteration(
          currentStatement,
          stressFactor,
          selectedAgents,
          nextIterationNumber,
          previousFailures
        );

        currentHypo = {
          ...currentHypo,
          status: iteration.resilienceScore >= 80 ? 'tested' : 'simulating',
          currentResilience: iteration.resilienceScore,
          iterations: [...currentHypo.iterations, iteration],
          refinedSolution: iteration.refinementsApplied
        };
        setActiveHypothesis(currentHypo);
      }
    } catch (err: any) {
      setError(err.message || "Falha no teste multi-ciclo.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePromoteToCoreFramework = () => {
    if (!activeHypothesis || activeHypothesis.iterations.length === 0) return;

    const finalSolutionText = activeHypothesis.refinedSolution || activeHypothesis.statement;
    const primaryAgent = selectedAgents[0] || "Integration";

    const verifiedKnowledgeEntry: KnowledgeEntry = {
      id: `sandbox_promoted_${Date.now()}`,
      content: `[VERIFIED HYPOTHESIS] ${activeHypothesis.title}: ${finalSolutionText}`,
      contributor: `Sandbox [${selectedAgents.slice(0, 3).join("+")}]`,
      timestamp: new Date().toISOString(),
      tags: ["Sandbox-Verified", "Promoted", `Resilience-${activeHypothesis.currentResilience}%`, ...selectedAgents],
      sourceType: "sandbox",
      relevanceExplanation: `Validated through ${activeHypothesis.iterations.length} simulated stress cycles achieving ${activeHypothesis.currentResilience}% resilience.`
    };

    const promotedSolution: ProblemSolution = {
      generation: currentGeneration + 1,
      problem: `[SANDBOX BREAKTHROUGH] ${activeHypothesis.title}`,
      solution: finalSolutionText,
      subAgents: selectedAgents.map((ag, i) => ({
        id: `agent_${i}`,
        specialty: ag,
        vision: `Simulated and verified within the Sandbox testing chamber under ${stressFactor} entropy stress.`,
        patterns: ["Sandbox-Hardened", "Empirical Convergence"]
      })),
      reasoningSteps: activeHypothesis.iterations.map(it => ({
        type: "HYPOTHESIS",
        title: `Simulated Iteration #${it.iterationNumber} (Resilience: ${it.resilienceScore}%)`,
        content: `Scenario: ${it.testScenario} | Refinement: ${it.refinementsApplied}`
      })),
      analysis: `Promoted from Sandbox chamber with verified resilience of ${activeHypothesis.currentResilience}%. Neutralized ${activeHypothesis.iterations.flatMap(it => it.failurePoints).length} simulated failure vectors.`,
      nextQuestion: "How will this newly verified law interface with the next generational evolutionary challenge?",
      improvement: `Sandbox Verified: ${activeHypothesis.title} is now permanently rooted in operational memory.`,
      successRate: activeHypothesis.currentResilience,
      complexityScore: Math.min(96, 65 + activeHypothesis.iterations.length * 7),
      timestamp: new Date().toISOString()
    };

    onPromoteHypothesis(
      { ...activeHypothesis, status: 'promoted' },
      verifiedKnowledgeEntry,
      promotedSolution
    );

    setPromotedSuccess(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-evolve-bg text-white">
      {/* Sandbox Chamber Header */}
      <div className="p-4 md:px-8 border-b border-evolve-line bg-black/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
                Simulation Testing Sandbox
              </h2>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-tighter">
                ISOLATED LAB SPACE
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              Rapid iteration, counter-scenario stress-testing, and empirical refinement prior to operational adoption.
            </p>
          </div>
        </div>

        {/* Global Sandbox Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Resilience Rating</span>
            <span className={`font-bold flex items-center gap-1 ${
              activeHypothesis.currentResilience >= 80 
                ? 'text-evolve-accent' 
                : activeHypothesis.currentResilience >= 60 
                ? 'text-amber-400' 
                : 'text-red-400'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {activeHypothesis.currentResilience}%
            </span>
          </div>
          <div className="h-6 w-px bg-evolve-line" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Simulated Iterations</span>
            <span className="text-white font-bold">{activeHypothesis.iterations.length} Cycles</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Preset Hypothesis Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Select Experimental Prototype or Formulate Below
            </span>
            <span className="text-[9px] font-mono text-evolve-accent/60">
              {knowledgeBank.length} Ingested Memory Clusters Accessible
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_HYPOTHESES.map((preset, i) => (
              <button
                key={i}
                id={`btn-preset-hypo-${i}`}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activeHypothesis.title === preset.title
                    ? 'border-amber-500/60 bg-amber-500/[0.05] shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/80">
                    Prototype #{i + 1}
                  </span>
                  <span className="text-[8px] font-mono text-white/40">{preset.origin}</span>
                </div>
                <h4 className="text-xs font-mono font-bold text-white mb-1 line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                  {preset.statement}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Workbench Card: Hypothesis & Testing Parameters */}
        <div className="p-6 border border-evolve-line bg-black/30 rounded-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Hypothesis Workbench
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                Formulate the potential solution, configure adversarial stress parameters, and assemble the testing coalition.
              </p>
            </div>
            
            {/* Stress Factor Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 mr-1">
                Entropy Stress:
              </span>
              {(['low', 'medium', 'high'] as const).map(factor => (
                <button
                  key={factor}
                  id={`btn-stress-${factor}`}
                  onClick={() => setStressFactor(factor)}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-widest border transition-all ${
                    stressFactor === factor
                      ? factor === 'high' 
                        ? 'border-red-500 bg-red-500/20 text-red-400' 
                        : factor === 'medium'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-evolve-accent bg-evolve-accent/20 text-evolve-accent'
                      : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {factor}
                </button>
              ))}
            </div>
          </div>

          {/* Statement Editor */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 flex justify-between">
              <span>Hypothesis Formulation & Statement</span>
              <span className="text-white/30">{activeHypothesis.statement.length} chars</span>
            </label>
            <textarea
              id="input-sandbox-statement"
              rows={3}
              value={activeHypothesis.statement}
              onChange={(e) => setActiveHypothesis(prev => ({
                ...prev,
                statement: e.target.value,
                refinedSolution: undefined
              }))}
              placeholder="Descreva a hipótese, lei emergente ou solução técnica a ser submetida a teste..."
              className="w-full bg-white/5 border border-evolve-line focus:border-amber-500/50 rounded-lg p-3 text-xs font-mono text-white placeholder:text-white/20 outline-none leading-relaxed transition-all resize-none"
            />
          </div>

          {/* Agent Coalition Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                Testing Coalition (Subagents Challenging the Hypothesis)
              </span>
              <button 
                onClick={() => setSelectedAgents(SUB_AGENTS.map(a => a.specialty))}
                className="text-[8px] font-mono text-amber-400/80 hover:underline uppercase"
              >
                Select All 9 Agents
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUB_AGENTS.map(agent => {
                const isSelected = selectedAgents.includes(agent.specialty);
                return (
                  <button
                    key={agent.id}
                    id={`btn-coalition-${agent.id}`}
                    onClick={() => toggleAgent(agent.specialty)}
                    className={`px-2.5 py-1 rounded border text-[9px] font-mono uppercase tracking-widest transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                        : 'border-white/10 text-white/30 hover:bg-white/5'
                    }`}
                  >
                    {agent.specialty}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Trigger Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/40">
                Current State: <span className="uppercase text-amber-400">{activeHypothesis.status}</span>
              </span>
              {activeHypothesis.refinedSolution && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-evolve-accent/10 border border-evolve-accent/30 text-evolve-accent">
                  Refined v{activeHypothesis.iterations.length + 1}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-multi-stress-test"
                onClick={handleMultiIterationStressTest}
                disabled={isSimulating}
                className="px-4 py-2 border border-amber-500/40 rounded-lg text-xs font-mono uppercase text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-2 disabled:opacity-30"
              >
                <Activity className="w-3.5 h-3.5" />
                Stress-Test 2x
              </button>
              <button
                id="btn-run-simulation"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-6 py-2 bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Simulando no Chamber...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    Executar Iteração #{activeHypothesis.iterations.length + 1}
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Refined Solution Banner (if upgraded) */}
        {activeHypothesis.refinedSolution && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-evolve-accent/40 bg-evolve-accent/[0.04] space-y-4 shadow-[0_0_20px_rgba(0,255,156,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-evolve-accent">
                <ShieldAlert className="w-4 h-4" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Refinamento Emergente (Solução Aprimorada v{activeHypothesis.iterations.length})
                </h4>
              </div>
              <span className="text-[9px] font-mono uppercase text-evolve-accent px-2 py-0.5 rounded bg-evolve-accent/10 border border-evolve-accent/20">
                Resilience: {activeHypothesis.currentResilience}%
              </span>
            </div>

            <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">
              {activeHypothesis.refinedSolution}
            </p>

            {/* Promotion CTA */}
            <div className="pt-2 border-t border-evolve-accent/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/50">
                Esta hipótese foi submetida a {activeHypothesis.iterations.length} ciclos de testes e alcançou índice de confiança de {activeHypothesis.currentResilience}%.
              </span>

              <button
                id="btn-promote-to-core"
                onClick={handlePromoteToCoreFramework}
                disabled={promotedSuccess}
                className="px-5 py-2.5 bg-evolve-accent text-evolve-bg rounded-lg font-mono font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,156,0.3)] disabled:opacity-50"
              >
                {promotedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Promovido para Estrutura Principal!
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Promover para Estrutura Principal
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Iteration History Cards */}
        {activeHypothesis.iterations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Registro de Iterações no Sandbox ({activeHypothesis.iterations.length})
              </h4>
              <span className="text-[9px] font-mono text-white/30">Ordem cronológica inversa</span>
            </div>

            <div className="space-y-4">
              {activeHypothesis.iterations.slice().reverse().map((iter, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-xl border border-white/10 bg-black/40 space-y-4 relative overflow-hidden group"
                >
                  {/* Top Bar of Iteration */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        ITERATION #{iter.iterationNumber}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${
                        iter.status === 'passed' 
                          ? 'border-evolve-accent/40 bg-evolve-accent/10 text-evolve-accent' 
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}>
                        {iter.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-white/40">Stress: <span className="uppercase text-white/70">{iter.stressFactor}</span></span>
                      <span className="text-evolve-accent font-bold">Resilience: {iter.resilienceScore}%</span>
                    </div>
                  </div>

                  {/* Test Scenario */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                      Cenário de Estresse Simulado:
                    </span>
                    <p className="text-xs text-white/75 leading-relaxed font-sans">
                      {iter.testScenario}
                    </p>
                  </div>

                  {/* Critiques Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                      Críticas dos Agentes da Coalizão:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {iter.critiques.map((crit, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-400/90 font-bold">{crit.agent}</span>
                            <span className={crit.pass ? 'text-evolve-accent' : 'text-red-400'}>
                              {crit.pass ? `PASS (${crit.critiqueScore}%)` : `REPROVED (${crit.critiqueScore}%)`}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                            {crit.perspective}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Failure Points Neutralized */}
                  {iter.failurePoints.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-red-400/70 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Vetores de Vulnerabilidade Detectados:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {iter.failurePoints.map((fp, fIdx) => (
                          <span key={fIdx} className="text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                            • {fp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refinement Statement */}
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-evolve-accent/80">
                      Refinamento Implementado Neste Ciclo:
                    </span>
                    <p className="text-xs text-white/80 font-mono leading-relaxed bg-white/[0.02] p-2.5 rounded border border-white/5">
                      {iter.refinementsApplied}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
