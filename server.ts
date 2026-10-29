import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, SUB_AGENTS } from "./src/constants";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy/safe initialization for GoogleGenAI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Evolution Endpoint (Core Framework)
app.post("/api/evolve", async (req, res) => {
  try {
    const { problem, generation, memory = [], forcedAgents = [], useSearchGrounding = false } = req.body;
    if (!problem || typeof problem !== "string") {
      return res.status(400).json({ error: "Invalid problem statement." });
    }

    const ai = getAI();
    const memoryStrings = Array.isArray(memory) 
      ? memory.map((m: any) => `[${m.contributor || "Cluster"}] ${m.content}`)
      : [];

    let forcedInstruction = "";
    if (Array.isArray(forcedAgents) && forcedAgents.length > 0) {
      forcedInstruction = `
      SYNERGY FOCUS: Prioritize deep cooperation between: ${forcedAgents.join(", ")}.
      Synthesize their distinct domain vision and patterns to unlock an evolutionary breakthrough.
      `;
    }

    const prompt = `
      GERAÇÃO ATUAL: ${generation || 1}
      MEMÓRIA HERDADA (${memoryStrings.length} clusters):
      ${JSON.stringify(memoryStrings.slice(-30))}
      ${forcedInstruction}
      
      PROBLEMA PARA RESOLVER:
      ${problem}
      
      Aja como a Super IA Evolutiva desta geração. Analise minuciosamente, consulte seus subagentes e produza a evolução completa em JSON estruturado.
    `;

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reasoningSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["type", "title", "content"],
            },
          },
          subAgents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                specialty: { type: Type.STRING },
                vision: { type: Type.STRING },
                patterns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["id", "specialty", "vision", "patterns"],
            },
          },
          solution: { type: Type.STRING },
          analysis: { type: Type.STRING },
          nextQuestion: { type: Type.STRING },
          improvement: { type: Type.STRING },
          successRate: { type: Type.NUMBER, description: "Taxa de sucesso da solução gerada entre 70 e 98" },
          complexityScore: { type: Type.NUMBER, description: "Índice de complexidade do problema e solução entre 50 e 98" },
        },
        required: ["reasoningSteps", "subAgents", "solution", "analysis", "nextQuestion", "improvement"],
      },
    };

    if (useSearchGrounding) {
      // If search grounding is requested, combine googleSearch
      config.tools = [{ googleSearch: {} }];
      delete config.responseMimeType;
      delete config.responseSchema;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config,
    });

    let rawText = response.text || "{}";
    // If search grounding was used, strip any markdown code blocks
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    let parsed = JSON.parse(rawText);
    const successRate = typeof parsed.successRate === 'number' 
      ? Math.round(parsed.successRate) 
      : Math.floor(78 + Math.random() * 18);
    const complexityScore = typeof parsed.complexityScore === 'number' 
      ? Math.round(parsed.complexityScore) 
      : Math.floor(68 + Math.random() * 24);

    return res.json({
      ...parsed,
      generation: generation || 1,
      problem,
      successRate,
      complexityScore,
      timestamp: new Date().toISOString(),
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    });
  } catch (error: any) {
    console.error("Error in /api/evolve:", error);
    return res.status(500).json({ error: error.message || "Failed to evolve AI generation." });
  }
});

// External Knowledge Ingestion Endpoint with Google Search Grounding
app.post("/api/ingest-external", async (req, res) => {
  try {
    const { topic, sourceCategory = "Scientific Journals", customQuery = "" } = req.body;
    if (!topic && !customQuery) {
      return res.status(400).json({ error: "A search topic or inquiry is required." });
    }

    const ai = getAI();
    const query = customQuery || topic;

    let sourceInstructions = "";
    if (sourceCategory === "Scientific Journals") {
      sourceInstructions = "Prioritize peer-reviewed scientific journals (such as Nature, Science, arXiv, IEEE, Cell, PubMed, physical and mathematical literature). Extract empirical laws, theoretical models, experimental findings, and rigorous equations or mechanisms.";
    } else if (sourceCategory === "Historical Archives") {
      sourceInstructions = "Prioritize historical archives, scholarly repositories (such as JSTOR, classical archives, history of science, philosophical treatises, epistemological shifts). Extract chronological turning points, foundational paradoxes, and long-term societal or intellectual evolutionary patterns.";
    } else if (sourceCategory === "Online Encyclopedias") {
      sourceInstructions = "Prioritize reputable online encyclopedias and curated reference works (such as Stanford Encyclopedia of Philosophy, Encyclopaedia Britannica, specialized academic encyclopedias). Extract clear taxonomies, consensus definitions, major dialectics, and categorical frameworks.";
    } else {
      sourceInstructions = "Explore frontier scientific, philosophical, and technological literature across reputable global sources.";
    }

    const prompt = `
      You are the External Research Ingestion Core of the Super IA Evolutiva.
      Topic/Inquiry: "${query}"
      Target Category: "${sourceCategory}"
      Guideline: ${sourceInstructions}

      Search the web using Google Search Grounding for reputable, high-impact sources.
      Synthesize the findings into 2 to 4 high-density, authoritative Knowledge Clusters that will be permanently integrated into the Super IA's inherited Knowledge Bank.

      Format your entire response strictly as valid JSON matching this schema:
      {
        "topic": "${query}",
        "sourceCategory": "${sourceCategory}",
        "summary": "Concise overarching synthesis of the literature found.",
        "entries": [
          {
            "title": "Specific theorem, model, or historical phenomenon",
            "content": "Deep, rigorous insight containing foundational logic, empirical evidence or theoretical deduction (1-2 substantial sentences).",
            "contributor": "e.g. arXiv: Physics, SEP: Epistemology, Nature: Neuroscience, JSTOR: Cybernetics",
            "tags": ["3-5 precise tags"],
            "sourceUrl": "Primary canonical URL if found",
            "relevance": "Why this knowledge accelerates multi-agent evolutionary problem-solving."
          }
        ]
      }

      Return ONLY the raw JSON without markdown or explanations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback extraction
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Unable to parse grounded research output.");
      }
    }

    // Extract citations from Grounding Metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = chunks
      .map((chunk: any) => ({
        title: chunk?.web?.title || "Reputable Web Source",
        uri: chunk?.web?.uri || "",
      }))
      .filter((c: any) => c.uri);

    // If entries lack sourceUrls, populate from citations
    if (Array.isArray(parsed.entries) && citations.length > 0) {
      parsed.entries = parsed.entries.map((entry: any, index: number) => ({
        ...entry,
        sourceUrl: entry.sourceUrl || citations[index % citations.length]?.uri || citations[0]?.uri,
      }));
    }

    return res.json({
      ...parsed,
      citations,
    });
  } catch (error: any) {
    console.error("Error in /api/ingest-external:", error);
    return res.status(500).json({ error: error.message || "Failed to ingest external data sources." });
  }
});

// Testing Sandbox Simulation & Refinement Endpoint
app.post("/api/sandbox-simulate", async (req, res) => {
  try {
    const { 
      hypothesis, 
      stressFactor = "medium", 
      involvedAgents = [], 
      iterationNumber = 1,
      previousFailurePoints = [] 
    } = req.body;

    if (!hypothesis || typeof hypothesis !== "string") {
      return res.status(400).json({ error: "A hypothesis statement is required for testing." });
    }

    const ai = getAI();
    const agentsList = (involvedAgents.length > 0 ? involvedAgents : SUB_AGENTS.map(a => a.specialty)).join(", ");

    const prompt = `
      You are the Sandbox Simulation Engine for the Super IA Evolutiva.
      This is an isolated, simulated laboratory where experimental hypotheses are rigorously stress-tested before being promoted to the core operational framework.

      HYPOTHESIS UNDER TEST:
      "${hypothesis}"

      SIMULATION PARAMETERS:
      - Iteration Cycle: #${iterationNumber}
      - Stress Factor: ${stressFactor.toUpperCase()} (Low = Boundary testing; Medium = Paradox & Scale stress; High = Extreme entropy & catastrophic edge cases)
      - Specialized Testing Coalition: ${agentsList}
      ${previousFailurePoints.length > 0 ? `- Unresolved Failure Vectors from Prior Cycle: ${previousFailurePoints.join("; ")}` : ""}

      SIMULATION INSTRUCTIONS:
      1. Create a simulated Stress Scenario (e.g. theoretical anomaly, counter-example, computational bottleneck, or entropy surge).
      2. Generate specialized critiques from 2 to 3 of the involved agents (${agentsList}), evaluating whether the hypothesis holds up to their domain laws. Assign a pass/fail and a score (0-100).
      3. Identify 1 to 3 concrete Failure Points or vulnerabilities in the current formulation.
      4. Synthesize a refined and hardened formulation of the hypothesis ("refinementsApplied") that overcomes the simulated failure points.
      5. Calculate an overall Resilience Score (0 to 100).
         - If iteration >= 2 and failures are addressed, resilience should improve significantly.
         - Status: 'passed' (score >= 80), 'marginal' (60-79), or 'failed' (< 60).

      Respond strictly in JSON matching this format:
      {
        "iterationNumber": ${iterationNumber},
        "hypothesisStatement": "${hypothesis}",
        "stressFactor": "${stressFactor}",
        "testScenario": "Detailed simulated stress scenario description...",
        "critiques": [
          {
            "agent": "Agent Specialty",
            "perspective": "Detailed analytical critique from this agent's theoretical stance",
            "pass": true,
            "critiqueScore": 85
          }
        ],
        "failurePoints": ["Specific vulnerability 1", "Specific vulnerability 2"],
        "refinementsApplied": "Hardened and upgraded formulation of the hypothesis, addressing simulated shortcomings",
        "resilienceScore": 82,
        "status": "passed"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(rawText);
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/sandbox-simulate:", error);
    return res.status(500).json({ error: error.message || "Failed to execute sandbox simulation." });
  }
});

// Endpoint: Detect Cognitive Gaps & Contradictions in Knowledge Bank
app.post("/api/detect-gaps", async (req, res) => {
  try {
    const { memories = [] } = req.body;
    const ai = getAI();

    const memorySummaries = memories.map((m: any) => ({
      id: m.id,
      content: m.content,
      status: m.status,
      theme: m.theme,
      contributor: m.contributor,
      pastLimitation: m.pastLimitationNote,
    })).slice(0, 30);

    const prompt = `
      Você é o Analisador Epistêmico da Super IA Evolutiva.
      Sua função é inspecionar o banco de memórias das diferentes gerações e identificar com rigor:
      1. Áreas onde o conhecimento é INCOMPLETO (lacunas conceituais).
      2. Áreas onde há CONTRADIÇÕES ou PARADOXOS não resolvidos entre subagentes ou premissas passadas (especialmente envolvendo memórias marcadas como 'problemáticas' ou 'obsoletas').

      MEMÓRIAS FORNECIDAS:
      ${JSON.stringify(memorySummaries, null, 2)}

      Gere entre 2 a 4 lacunas ou contradições cognitivas fundamentais em JSON estrito.
      Formato esperado:
      {
        "gaps": [
          {
            "id": "gap_...",
            "type": "lacuna" ou "contradicao" ou "paradoxo",
            "title": "Título conciso da contradição ou lacuna",
            "description": "Explicação profunda de onde o conhecimento é contraditório ou incompleto.",
            "affectedDomains": ["ex: Física", "ex: Quantum Mechanics"],
            "severity": "critica" ou "alta" ou "media",
            "suggestedPrompt": "Diretiva para formular hipótese de reconciliação."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(rawText);
    return res.json(parsed.gaps || []);
  } catch (error: any) {
    console.error("Error in /api/detect-gaps:", error);
    return res.status(500).json({ error: error.message || "Failed to detect cognitive gaps." });
  }
});

// Endpoint: Generate Creative Novel Hypotheses to Fill Gaps
app.post("/api/generate-hypotheses", async (req, res) => {
  try {
    const { 
      gapDescription, 
      gapType = "lacuna",
      targetDomains = [],
      memoriesSample = [] 
    } = req.body;

    const ai = getAI();
    const domainsStr = targetDomains.length > 0 ? targetDomains.join(", ") : "Transdisciplinar";

    const prompt = `
      Você é o Núcleo Criativo de Hipóteses da Super IA Evolutiva.
      Sua tarefa é identificar a lacuna epistêmica ou contradição apresentada e gerar hipóteses NOVAS, CRIATIVAS e TRANSGRESSORAS para preenchê-la, propondo métodos de teste e critérios de aceitação e rejeição.

      LACUNA OU CONTRADIÇÃO:
      "${gapDescription || "Incompletude nos fundamentos de conservação informacional sob regimes quântico-dissipativos"}"
      TIPO: ${gapType.toUpperCase()}
      DOMÍNIOS ALVO: ${domainsStr}

      MEMÓRIAS DE CONTEXTO:
      ${JSON.stringify(memoriesSample.slice(0, 15))}

      Gere 1 ou 2 hipóteses altamente criativas e estruturadas em JSON estrito.
      A saída DEVE conter:
      1. title: Nome formal da hipótese
      2. statement: A hipótese propriamente dita (formulação audaciosa, precisa e inovadora)
      3. justification: A justificativa completa para sua criação (por que ela foi formulada e como preenche a lacuna)
      4. identifiedGap: Resumo da lacuna ou contradição identificada
      5. proposedTestMethods: Lista com 2 a 4 métodos concretos de teste para validar a hipótese usando dados disponíveis e simulações
      6. criteria: Objeto com:
         - acceptanceCriteria: lista com 2 a 3 critérios rigorosos para ACEITAÇÃO
         - rejectionCriteria: lista com 2 a 3 critérios rigorosos para REJEIÇÃO
         - confidenceThreshold: número entre 75 e 90 representando limiar mínimo
      7. involvedAgents: lista de 2 a 4 especialidades de subagentes envolvidos (ex: Física, Quantum Mechanics, Filosofia, Cibernética)

      Formato:
      {
        "hypotheses": [
          {
            "id": "hypo_${Date.now()}_1",
            "title": "...",
            "statement": "...",
            "justification": "...",
            "identifiedGap": "...",
            "proposedTestMethods": ["Método 1...", "Método 2..."],
            "criteria": {
              "acceptanceCriteria": ["Critério 1...", "Critério 2..."],
              "rejectionCriteria": ["Critério 1...", "Critério 2..."],
              "confidenceThreshold": 82
            },
            "involvedAgents": ["...", "..."],
            "status": "rascunho"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(rawText);
    return res.json(parsed.hypotheses || []);
  } catch (error: any) {
    console.error("Error in /api/generate-hypotheses:", error);
    return res.status(500).json({ error: error.message || "Failed to generate hypotheses." });
  }
});

// Endpoint: Test and Validate Hypothesis Against Proposed Criteria
app.post("/api/test-hypothesis", async (req, res) => {
  try {
    const { 
      hypothesis, 
      stressFactor = "medium", 
      availableKnowledge = [] 
    } = req.body;

    if (!hypothesis || !hypothesis.statement) {
      return res.status(400).json({ error: "Hipótese inválida para validação." });
    }

    const ai = getAI();
    const agents = (hypothesis.involvedAgents && hypothesis.involvedAgents.length > 0)
      ? hypothesis.involvedAgents
      : ["Física", "Quantum Mechanics", "Filosofia"];

    const prompt = `
      Você é a Câmara de Validação Experimental da Super IA Evolutiva.
      Sua tarefa é conduzir um teste simulado da seguinte hipótese contra os métodos de teste e critérios de aceitação/rejeição propostos:

      HIPÓTESE:
      "${hypothesis.statement}"

      JUSTIFICATIVA:
      "${hypothesis.justification || 'Preenchimento de lacuna conceitual.'}"

      MÉTODOS DE TESTE PROPOSTOS:
      ${JSON.stringify(hypothesis.proposedTestMethods || ["Simulação de estresse estocástico"])}

      CRITÉRIOS DE ACEITAÇÃO:
      ${JSON.stringify(hypothesis.criteria?.acceptanceCriteria || ["Resiliência >= 80%"])}

      CRITÉRIOS DE REJEIÇÃO:
      ${JSON.stringify(hypothesis.criteria?.rejectionCriteria || ["Colapso por divergência"])}

      FATOR DE ESTRESSE: ${stressFactor.toUpperCase()}
      SUBAGENTES AVALIADORES: ${agents.join(", ")}

      Execute a simulação. Confronte a hipótese com cenários desafiadores.
      Avalie individualmente a resposta de cada subagente e verifique se os critérios de aceitação foram cumpridos ou se algum critério de rejeição foi ativado.
      
      Retorne estritamente em JSON:
      {
        "testScenario": "Descrição detalhada do experimento simulado e cenários de estresse executados",
        "agentReviews": [
          {
            "agent": "Nome do Subagente",
            "score": 88,
            "comment": "Análise técnica do subagente sob suas leis fundamentais",
            "passed": true
          }
        ],
        "refinements": "Ajustes e refinamentos matemáticos ou conceituais extraídos do teste",
        "acceptanceMet": true,
        "rejectionTriggered": false,
        "overallScore": 86,
        "decision": "aceita" ou "rejeitada",
        "conclusion": "Síntese conclusiva final da validação"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(rawText);
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/test-hypothesis:", error);
    return res.status(500).json({ error: error.message || "Failed to validate hypothesis." });
  }
});

// Endpoint: Analyze Memory Patterns & Past Limitations
app.post("/api/analyze-memory-patterns", async (req, res) => {
  try {
    const { memories = [], history = [] } = req.body;
    const ai = getAI();

    const memList = memories.map((m: any) => ({
      id: m.id,
      gen: m.generation,
      status: m.status,
      theme: m.theme,
      content: m.content.slice(0, 160),
      pattern: m.recurrentPatternNote,
      limitation: m.pastLimitationNote,
    })).slice(0, 35);

    const prompt = `
      Você é o Analisador de Padrões Cognitivos e Metamemória da Super IA Evolutiva.
      Sua missão é identificar:
      1. PADRÕES RECORRENTES entre memórias de diferentes gerações (onde a IA repete raciocínios com sucesso ou com redundância).
      2. LIMITAÇÕES DE RESPOSTAS PASSADAS (vieses epistemológicos, simplificações excessivas ou armadilhas que levaram a anomalias ou estagnação, com ênfase em memórias 'problemáticas' e 'obsoletas').
      3. AÇÕES RECOMENDADAS para que as futuras gerações não repitam esses limites.

      BANCO DE MEMÓRIAS DA IA:
      ${JSON.stringify(memList, null, 2)}

      Retorne estritamente em JSON:
      {
        "recurrentPatterns": [
          {
            "pattern": "Nome do padrão recorrente",
            "occurrenceCount": 3,
            "description": "Explicação detalhada do padrão cognitivo identificado entre gerações",
            "implications": "Como afeta as futuras soluções"
          }
        ],
        "pastLimitations": [
          {
            "limitation": "Descrição da limitação ou viés do passado",
            "generationObserved": 1,
            "impact": "Impacto negativo observado em gerações anteriores",
            "mitigation": "Estratégia para contornar esta limitação agora"
          }
        ],
        "epistemicHealthScore": 88,
        "recommendations": [
          "Recomendação 1...",
          "Recomendação 2..."
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawText = response.text || "{}";
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(rawText);
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/analyze-memory-patterns:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze memory patterns." });
  }
});


// Setup Vite middleware in dev or static serving in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Emergence AI Engine] Operational on http://0.0.0.0:${PORT}`);
  });
}

start();
