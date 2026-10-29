/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ProblemSolution, 
  KnowledgeEntry, 
  ExternalKnowledgeIngestionResult, 
  SimulatedIteration 
} from "../types";

export const evolveAI = async (
  problem: string,
  generation: number,
  memory: KnowledgeEntry[],
  forcedAgents?: string[],
  useSearchGrounding?: boolean
): Promise<ProblemSolution> => {
  const response = await fetch("/api/evolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem,
      generation,
      memory,
      forcedAgents,
      useSearchGrounding,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Evolution request failed with status ${response.status}`);
  }

  return response.json();
};

export const ingestExternalKnowledge = async (
  topic: string,
  sourceCategory: "Scientific Journals" | "Historical Archives" | "Online Encyclopedias" | "Custom Research",
  customQuery?: string
): Promise<ExternalKnowledgeIngestionResult> => {
  const response = await fetch("/api/ingest-external", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      sourceCategory,
      customQuery,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `External knowledge ingestion failed: status ${response.status}`);
  }

  return response.json();
};

export const simulateSandboxIteration = async (
  hypothesis: string,
  stressFactor: "low" | "medium" | "high",
  involvedAgents: string[],
  iterationNumber: number,
  previousFailurePoints: string[] = []
): Promise<SimulatedIteration> => {
  const response = await fetch("/api/sandbox-simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hypothesis,
      stressFactor,
      involvedAgents,
      iterationNumber,
      previousFailurePoints,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Sandbox simulation failed: status ${response.status}`);
  }

  return response.json();
};

export const detectCognitiveGaps = async (
  memories: KnowledgeEntry[]
): Promise<any[]> => {
  const response = await fetch("/api/detect-gaps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memories }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Falha ao analisar lacunas cognitivas");
  }

  return response.json();
};

export const generateCreativeHypotheses = async (
  gapDescription: string,
  gapType: string = "lacuna",
  targetDomains: string[] = [],
  memoriesSample: KnowledgeEntry[] = []
): Promise<any[]> => {
  const response = await fetch("/api/generate-hypotheses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gapDescription,
      gapType,
      targetDomains,
      memoriesSample,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Falha ao gerar novas hipóteses com a IA");
  }

  return response.json();
};

export const testHypothesisCriteria = async (
  hypothesis: any,
  stressFactor: "low" | "medium" | "high" = "medium",
  availableKnowledge: KnowledgeEntry[] = []
): Promise<any> => {
  const response = await fetch("/api/test-hypothesis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hypothesis,
      stressFactor,
      availableKnowledge,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Falha ao testar e validar critérios da hipótese");
  }

  return response.json();
};

export const analyzeMemoryPatternsAndLimitations = async (
  memories: KnowledgeEntry[],
  history: ProblemSolution[]
): Promise<any> => {
  const response = await fetch("/api/analyze-memory-patterns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memories, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Falha ao analisar padrões recorrentes e limitações");
  }

  return response.json();
};

