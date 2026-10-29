/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubAgentVision {
  id: string;
  specialty: string;
  vision: string;
  patterns: string[];
}

export interface EvolutionStep {
  type: 'UNDERSTAND' | 'DIVIDE' | 'PATTERN' | 'LIMITATION' | 'HYPOTHESIS' | 'COMPARE' | 'INTEGRATE' | 'CHOOSE' | 'EXPLAIN' | 'QUESTION';
  content: string;
  title: string;
}

export interface ProblemSolution {
  generation: number;
  problem: string;
  subAgents: SubAgentVision[];
  reasoningSteps: EvolutionStep[];
  solution: string;
  analysis: string;
  nextQuestion: string;
  improvement: string;
  successRate?: number;
  complexityScore?: number;
  timestamp?: string;
}

export interface LegacyKnowledge {
  source: string;
  timestamp: string;
  findings: string[];
  results: string;
}

export type MemoryStatus = 'herdadas' | 'adquiridas' | 'úteis' | 'obsoletas' | 'problemáticas';

export interface MemoryConnection {
  targetMemoryId: string;
  relationship: 'fundamenta' | 'contradiz' | 'complementa' | 'generaliza' | 'substitui';
  description?: string;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  timestamp: string;
  contributor: string;
  tags: string[];
  generation?: number;
  status?: MemoryStatus; // 'herdadas' | 'adquiridas' | 'úteis' | 'obsoletas' | 'problemáticas'
  theme?: string; // Tópico ou tema de indexação (e.g. Termodinâmica, Quântica, Dialética)
  connections?: MemoryConnection[]; // Relações estruturadas com outras memórias
  recurrentPatternNote?: string; // Padrão cognitivo recorrente identificado
  pastLimitationNote?: string; // Limitações de respostas passadas ou viés detectado
  sourceUrl?: string;
  sourceType?: 'journal' | 'archive' | 'encyclopedia' | 'system' | 'generation' | 'legacy' | 'sandbox' | 'manual';
  relevanceExplanation?: string;
  utilityScore?: number; // 0 a 100
}

export interface GroundingCitation {
  title: string;
  uri: string;
}

export interface ExternalKnowledgeIngestionResult {
  topic: string;
  sourceCategory: 'Scientific Journals' | 'Historical Archives' | 'Online Encyclopedias' | 'Custom Research';
  summary: string;
  citations: GroundingCitation[];
  entries: {
    title: string;
    content: string;
    contributor: string;
    tags: string[];
    sourceUrl?: string;
    relevance: string;
  }[];
}

export interface SimulatedCritique {
  agent: string;
  perspective: string;
  pass: boolean;
  critiqueScore: number; // 0-100
}

export interface SimulatedIteration {
  iterationNumber: number;
  hypothesisStatement: string;
  stressFactor: 'low' | 'medium' | 'high';
  testScenario: string;
  critiques: SimulatedCritique[];
  failurePoints: string[];
  refinementsApplied: string;
  resilienceScore: number; // 0-100
  status: 'passed' | 'marginal' | 'failed';
}

export interface SandboxHypothesis {
  id: string;
  title: string;
  statement: string;
  originSource: string;
  involvedAgents: string[];
  status: 'draft' | 'simulating' | 'tested' | 'promoted';
  currentResilience: number;
  iterations: SimulatedIteration[];
  refinedSolution?: string;
  createdAt: string;
}

export interface CognitiveGap {
  id: string;
  type: 'lacuna' | 'contradicao' | 'paradoxo';
  title: string;
  description: string;
  affectedDomains: string[];
  severity: 'alta' | 'media' | 'critica';
  suggestedPrompt: string;
}

export interface HypothesisCriteria {
  acceptanceCriteria: string[]; // Critérios explícitos para aceitação
  rejectionCriteria: string[];  // Critérios explícitos para rejeição
  confidenceThreshold: number; // Limiar de pontuação mínima (ex: 80%)
}

export interface CreativeHypothesis {
  id: string;
  title: string;
  statement: string; // A hipótese inovadora formulada
  justification: string; // Justificativa da formulação e relevância
  identifiedGap: string; // Lacuna ou contradição identificada que visa preencher
  proposedTestMethods: string[]; // Métodos de teste propostos
  criteria: HypothesisCriteria; // Critérios para aceitação ou rejeição
  involvedAgents: string[];
  status: 'rascunho' | 'testando' | 'aceita' | 'rejeitada';
  currentScore?: number;
  stressFactor?: 'low' | 'medium' | 'high';
  testResults?: {
    testScenario: string;
    agentReviews: { agent: string; score: number; comment: string; passed: boolean }[];
    refinements: string;
    acceptanceMet: boolean;
    rejectionTriggered: boolean;
    conclusion: string;
    testedAt: string;
  };
  createdAt: string;
}

export interface MetricAnomalyDetail {
  value: number;
  mean: number;
  stdDev: number;
  threshold: number;
  isBreached: boolean;
  sigmaDistance: number;
}

export interface AnomalyAlert {
  id: string;
  generation: number;
  timestamp: string;
  type: 'SUCCESS_DROP' | 'COMPLEXITY_DROP' | 'DUAL_DROP';
  severity: 'warning' | 'critical';
  problemTitle: string;
  metrics: {
    success: MetricAnomalyDetail;
    complexity: MetricAnomalyDetail;
  };
  details: string;
  suggestedAction: string;
  dismissed: boolean;
}

export interface AudioSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 1 (default 0.25)
  hapticsEnabled: boolean;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  time: string; // "HH:MM" format (24h)
  enabled: boolean;
  days: 'daily' | 'weekdays' | 'weekend';
  focusTarget: 'core' | 'sandbox';
  note?: string;
  lastTriggeredDate?: string; // "YYYY-MM-DD"
  createdAt: string;
}

export interface AppState {
  currentGeneration: number;
  knowledgeBank: KnowledgeEntry[];
  history: ProblemSolution[];
  isThinking: boolean;
  currentProcess: ProblemSolution | null;
  legacyKnowledge: LegacyKnowledge[];
  sandboxHypotheses: SandboxHypothesis[];
  creativeHypotheses?: CreativeHypothesis[];
  activeAnomaly?: AnomalyAlert | null;
  sigmaMultiplier?: number;
  audioSettings?: AudioSettings;
  scheduledReminders?: ScheduledReminder[];
  activeReminderNotification?: ScheduledReminder | null;
}

