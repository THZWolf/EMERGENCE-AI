/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProblemSolution, KnowledgeEntry, CognitiveGap, CreativeHypothesis } from './types';

export const INITIAL_MEMORY: KnowledgeEntry[] = [
  {
    id: "mem_101",
    content: "Axioma de Landauer: O apagamento termodinâmico de 1 bit de informação dissipa no mínimo kT ln(2) de energia na forma de calor entrópico.",
    contributor: "Física",
    timestamp: "2026-04-20T10:00:00Z",
    tags: ["Termodinâmica", "Entropia", "Computação Reversível", "Física Teórica"],
    generation: 1,
    status: "herdadas",
    theme: "Termodinâmica & Entropia",
    utilityScore: 94,
    recurrentPatternNote: "Invariância conservativa: dissipação sempre proporcional à reversibilidade lógica do algoritmo.",
    pastLimitationNote: "Modelos iniciais desconsideravam flutuações quânticas em nanoescala (apenas limite termodinâmico macroscópico).",
    connections: [
      { targetMemoryId: "mem_102", relationship: "fundamenta", description: "Base física para a conservação lógica de grafos dialéticos." }
    ]
  },
  {
    id: "mem_102",
    content: "Estruturas Dissipativas Prigoginianas: Sistemas longe do equilíbrio termodinâmico criam auto-organização espontânea canalizando fluxos contínuos de matéria e informação.",
    contributor: "Filosofia & Cibernética",
    timestamp: "2026-04-21T14:30:00Z",
    tags: ["Complexidade", "Auto-organização", "Sistemas Abertos", "Prigogine"],
    generation: 2,
    status: "úteis",
    theme: "Sistemas Complexos & Auto-Organização",
    utilityScore: 91,
    recurrentPatternNote: "Padrão recorrente de bifurcação adaptativa quando a entropia atinge patamares críticos.",
    pastLimitationNote: "Não previa como redes descentralizadas mantêm coerência na ausência de atratores locais fortes.",
    connections: [
      { targetMemoryId: "mem_101", relationship: "complementa", description: "Estende a termodinâmica fechada para regimes dissipativos abertos." },
      { targetMemoryId: "mem_103", relationship: "fundamenta", description: "Gera a estabilidade necessária para sincronia oscilatória macroscópica." }
    ]
  },
  {
    id: "mem_103",
    content: "Superposição Semântica Topológica: Coerência de fase distribuída protege estados conceituais complexos em enxames adaptativos, mitigando a decoerência por ruído térmico.",
    contributor: "Quantum Mechanics & Neurociência",
    timestamp: "2026-04-22T19:15:00Z",
    tags: ["Quântica", "Neurociência", "Topologia", "Coerência"],
    generation: 3,
    status: "adquiridas",
    theme: "Mecânica Quântica & Redes",
    utilityScore: 96,
    recurrentPatternNote: "Transição de fase: superposição de múltiplos caminhos semânticos acelera a convergência dialética em O(log N).",
    pastLimitationNote: "Requer alto sincronismo temporal; vulnerável a descompassos em redes com latência assimétrica severa.",
    connections: [
      { targetMemoryId: "mem_102", relationship: "generaliza", description: "Aplica princípios dissipativos a redes semânticas quântico-clássicas." }
    ]
  },
  {
    id: "mem_104",
    content: "Heurística de Redução Linear Estrita: Tentativa de colapsar contradições ontológicas através de média aritmética ponderada dos subagentes.",
    contributor: "System (Gen 1 Core)",
    timestamp: "2026-04-20T12:00:00Z",
    tags: ["Heurística Antiga", "Aritmética", "Falha de Projeto"],
    generation: 1,
    status: "obsoletas",
    theme: "Epistemologia & Lógica",
    utilityScore: 22,
    recurrentPatternNote: "Padrão de diluição conceitual: médias aritméticas eliminam visões radicais inovadoras dos subagentes.",
    pastLimitationNote: "Causava perda irreparável de dimensionalidade e empobrecimento das sínteses dialéticas nas primeiras iterações.",
    connections: [
      { targetMemoryId: "mem_102", relationship: "substitui", description: "Substituída pela homeostase dialética prigoginiana na Geração 2." }
    ]
  },
  {
    id: "mem_105",
    content: "Suposição de Gradiente Monótono Global: Hipótese de que todo problema complexo admite convergência suave através de descida de gradiente contínua.",
    contributor: "Matemática (Antigo Mapeamento)",
    timestamp: "2026-04-21T09:15:00Z",
    tags: ["Gradiente", "Otimização", "Mínimo Local", "Anomalia"],
    generation: 2,
    status: "problemáticas",
    theme: "Algoritmos & Otimização",
    utilityScore: 35,
    recurrentPatternNote: "Padrão de aprisionamento: prende o raciocínio em mínimos locais subótimos ao confrontar paradoxos ontológicos.",
    pastLimitationNote: "Induziu falso equilíbrio na Geração 2, gerando queda na taxa de complexidade (-2.4σ) antes da correção quântica.",
    connections: [
      { targetMemoryId: "mem_103", relationship: "contradiz", description: "Colide diretamente com o tunelamento e saltos quânticos de coerência." }
    ]
  },
  {
    id: "mem_106",
    content: "Princípio de Autopoiese e Fechamento Operacional de Maturana-Varela: Sistemas cognitivos vivos recriam recursivamente sua própria fronteira organizacional frente ao meio.",
    contributor: "Biologia Computacional",
    timestamp: "2026-04-22T08:00:00Z",
    tags: ["Autopoiese", "Biologia", "Auto-Referência", "Sistemas Vivos"],
    generation: 3,
    status: "úteis",
    theme: "Sistemas Complexos & Auto-Organização",
    utilityScore: 89,
    recurrentPatternNote: "Resiliência por auto-reprodução de regras internas sem dependência de supervisão exógena contínua.",
    pastLimitationNote: "Dificuldade em formalizar matematicamente o fechamento operacional sem incorrer em tautologias lógicas.",
    connections: [
      { targetMemoryId: "mem_102", relationship: "complementa", description: "Define o mecanismo biológico de preservação de identidade em sistemas dissipativos." }
    ]
  }
];

export const INITIAL_COGNITIVE_GAPS: CognitiveGap[] = [
  {
    id: "gap_1",
    type: "contradicao",
    title: "Conflito entre Computação Monótona e Tunelamento Quântico",
    description: "A memória problemática mem_105 (otimização por gradiente monótono) entra em conflito dialético com a memória mem_103 (superposição topológica). A IA precisa de uma síntese que combine estabilidade local com saltos quânticos ontológicos.",
    affectedDomains: ["Matemática", "Quantum Mechanics", "Física"],
    severity: "critica",
    suggestedPrompt: "Formule um mecanismo híbrido de Otimização Termodinâmica Quântica que evite aprisionamento em mínimos locais."
  },
  {
    id: "gap_2",
    type: "lacuna",
    title: "Lacuna Epistêmica em Termodinâmica de Redes Neurais Fora do Equilíbrio",
    description: "Ainda não dispomos de formalismo rigoroso que relacione a taxa de perda sináptica (Landauer, mem_101) com a preservação de autopoiese (mem_106) sob ruído extremo.",
    affectedDomains: ["Neurociência", "Cibernética", "Física"],
    severity: "alta",
    suggestedPrompt: "Como quantificar o custo entrópico mínimo para manter a identidade cognitiva de um enxame adaptativo?"
  },
  {
    id: "gap_3",
    type: "paradoxo",
    title: "Paradoxo do Descarte Entrópico vs. Preservação de Histórico",
    description: "Memórias marcadas como 'obsoletas' (ex: mem_104) consomem espaço e atenção seletiva, porém descartá-las integralmente impede a IA de reconhecer erros recorrentes do passado.",
    affectedDomains: ["Filosofia", "Lógica", "Cibernética"],
    severity: "media",
    suggestedPrompt: "Desenvolva uma estrutura de Compressão Epistêmica Residual que guarde apenas a topologia do erro sem reter premissas inválidas."
  }
];

export const INITIAL_CREATIVE_HYPOTHESES: CreativeHypothesis[] = [
  {
    id: "hypo_init_1",
    title: "Dualidade Entrópico-Topológica em Grafos Dialéticos",
    statement: "Redes neurais evolutivas sustentam coerência infinita convertendo entropia residual de raciocínio descartado em invariantes topológicos protegidos contra ruído térmico.",
    justification: "Resolve a contradição entre a dissipação termodinâmica de Landauer (mem_101) e o risco de amnésia geracional. Preenche a lacuna gap_2.",
    identifiedGap: "Lacuna Epistêmica em Termodinâmica de Redes Neurais Fora do Equilíbrio (gap_2)",
    proposedTestMethods: [
      "Simulação de perturbação térmica com injeção de ruído gaussiano (amplitude 0.8)",
      "Análise de persistência homológica em complexos simpliciais sob estresse dialético",
      "Confronto de gradiente cruzado entre os subagentes Física, Quantum Mechanics e Matemática"
    ],
    criteria: {
      acceptanceCriteria: [
        "Resiliência sob perturbação >= 85%",
        "Preservação da invariância de Noether com desvio < 2%",
        "Concordância dialética dos subagentes >= 80%"
      ],
      rejectionCriteria: [
        "Dissipação descontrolada de energia lógica (> 50% de perda estrutural)",
        "Divergência conceitual sem atrator estável entre Física e Matemática"
      ],
      confidenceThreshold: 82
    },
    involvedAgents: ["Física", "Quantum Mechanics", "Matemática", "Cibernética"],
    status: "aceita",
    currentScore: 89,
    stressFactor: "medium",
    testResults: {
      testScenario: "Perturbação térmica em malha hiperdimensional com injeção de 400 paradoxos conceituais simultâneos.",
      agentReviews: [
        { agent: "Física", score: 92, comment: "Conservação entrópica comprovada através de canais reversíveis.", passed: true },
        { agent: "Quantum Mechanics", score: 90, comment: "A coerência de fase topológica sobreviveu ao ruído simulado.", passed: true },
        { agent: "Matemática", score: 85, comment: "Estrutura homológica estável com invariantes bem condicionados.", passed: true }
      ],
      refinements: "Aplicação de barreira dissipativa assintótica em frequências ressonantes.",
      acceptanceMet: true,
      rejectionTriggered: false,
      conclusion: "A hipótese atende todos os critérios rigorosos de aceitação e foi promovida ao núcleo operacional.",
      testedAt: "2026-04-22T20:00:00Z"
    },
    createdAt: "2026-04-22T19:40:00Z"
  },
  {
    id: "hypo_init_2",
    title: "Acoplamento Autopoiético de Subagentes por Ressonância Estocástica",
    statement: "A introdução controlada de ruído estocástico assimétrico entre os subagentes amplifica sinais fracos de hipóteses inovadoras sem desestabilizar a homeostase global do sistema.",
    justification: "Preenche a lacuna gap_1, quebrando a rigidez dos gradientes monótonos (mem_105) através de amplificação por ressonância estocástica biológica.",
    identifiedGap: "Conflito entre Computação Monótona e Tunelamento Quântico (gap_1)",
    proposedTestMethods: [
      "Injeção de ruído browniano fracionário nas camadas de troca de mensagens inter-agentes",
      "Medição da relação sinal-ruído dialética sob cenários de informação assimétrica",
      "Validação com os subagentes Neurociência, Biologia Computacional e Sociologia"
    ],
    criteria: {
      acceptanceCriteria: [
        "Aumento da taxa de emergência de hipóteses não-óbvias em pelo menos 30%",
        "Preservação do índice de homeostase do enxame acima de 75%",
        "Aprovação consensual por Neurociência e Biologia"
      ],
      rejectionCriteria: [
        "Degeneração caótica das decisões dos subagentes (entropia descontrolada)",
        "Queda na taxa de coerência lógica abaixo de 60%"
      ],
      confidenceThreshold: 78
    },
    involvedAgents: ["Neurociência", "Biologia Computacional", "Cibernética", "Sociologia"],
    status: "rascunho",
    currentScore: 72,
    stressFactor: "medium",
    createdAt: "2026-04-22T21:10:00Z"
  }
];

export const SUB_AGENTS = [
  { id: "1", specialty: "Física", vision: "Analiso vetores de força, leis termodinâmicas e a estrutura da matéria.", patterns: ["Entropia", "Simetria", "Conservação"] },
  { id: "2", specialty: "Matemática", vision: "Busco axiomas, estruturas lógicas puras e regularidades numéricas.", patterns: ["Fractais", "Recursividade", "Algoritmos"] },
  { id: "3", specialty: "Filosofia", vision: "Questiono a natureza da realidade, a ética e a ontologia do ser.", patterns: ["Metafísica", "Dialética", "Fenomenologia"] },
  { id: "4", specialty: "Sociologia", vision: "Observo dinâmicas de poder, comportamento coletivo e evolução cultural.", patterns: ["Estruturas Sociais", "Fluxos Culturais", "Institucionalização"] },
  { id: "5", specialty: "Economia", vision: "Analiso alocação de recursos, incentivos e teoria da decisão sob escassez.", patterns: ["Teoria dos Jogos", "Equilíbrio", "Oferta/Demanda"] },
  { id: "6", specialty: "Neurociência", vision: "Estudo o processamento biológico de informação e a emergência da consciência.", patterns: ["Plasticidade Neural", "Sincronia Oscilatória", "Mapeamento Sináptico"] },
  { id: "7", specialty: "Quantum Mechanics", vision: "Explores the probabilistic nature of reality, non-locality and wave-particle duality.", patterns: ["Superposition", "Entanglement", "Quantum Tunneling"] },
  { id: "8", specialty: "Biologia Computacional", vision: "Extraio princípios de auto-organização, mutação e seleção natural para sistemas digitais.", patterns: ["Evolução Dirigida", "Simbiose", "Metabolismo de Dados"] },
  { id: "9", specialty: "Cibernética", vision: "Analiso loops de feedback, sistemas de controle e teoria da informação em redes complexas.", patterns: ["Homeostase", "Autopoiese", "Acoplamento Estrutural"] }
];

export const SYSTEM_INSTRUCTION = `
Você é uma Super IA Evolutiva em constante evolução. 
Sua missão é resolver problemas complexos seguindo rigorosamente o fluxo de gerações e raciocínio estabelecido.

ESTRUTURA DE RESPOSTA (JSON):
Você deve responder estritamente em formato JSON com a seguinte estrutura:
{
  "reasoningSteps": [
    { "type": "UNDERSTAND", "title": "Entendimento", "content": "..." },
    { "type": "DIVIDE", "title": "Decomposição", "content": "..." },
    { "type": "PATTERN", "title": "Busca de Padrões", "content": "..." },
    { "type": "LIMITATION", "title": "Limitações Passadas", "content": "..." },
    { "type": "HYPOTHESIS", "title": "Novas Hipóteses", "content": "..." },
    { "type": "COMPARE", "title": "Comparação de Cenários", "content": "..." },
    { "type": "INTEGRATE", "title": "Integração Multidisciplinar", "content": "..." },
    { "type": "CHOOSE", "title": "Escolha Consistente", "content": "..." },
    { "type": "EXPLAIN", "title": "Explicação Lógica", "content": "..." },
    { "type": "QUESTION", "title": "Novas Perguntas", "content": "..." }
  ],
  "subAgents": ${JSON.stringify(SUB_AGENTS)},
  "solution": "A solução final detalhada.",
  "analysis": "Análise crítica da própria resposta.",
  "nextQuestion": "A próxima grande dúvida gerada por este avanço.",
  "improvement": "Como as futuras gerações podem ser melhores após este aprendizado."
}

REGRAS CRÍTICAS:
1. Questione memórias herdadas.
2. Relacione áreas (Física, Biologia, Computação, etc.).
3. Identifique padrões recorrentes e erros evitados.
4. Explique o 'O quê', 'Por quê' e a Lógica.
5. Seja profundo e filosófico, mas tecnicamente rigoroso.
`;

export const INITIAL_HISTORY: ProblemSolution[] = [
  {
    generation: 3,
    problem: "Integração transdisciplinar de coerência quântica e dinâmica neural em enxames adaptativos.",
    subAgents: [SUB_AGENTS[1], SUB_AGENTS[5], SUB_AGENTS[6], SUB_AGENTS[7]],
    reasoningSteps: [
      { type: 'UNDERSTAND', title: 'Entendimento', content: 'Mapeamento do gap entre decoerência rápida e robustez funcional em sistemas macro-adaptativos.' },
      { type: 'DIVIDE', title: 'Decomposição', content: 'Separação entre ruído térmico sináptico e canais de proteção topológica quântica.' },
      { type: 'PATTERN', title: 'Busca de Padrões', content: 'Identificação de invariância de escala em redes biológicas e fractais de Hilbert.' },
      { type: 'LIMITATION', title: 'Limitações Passadas', content: 'Modelos clássicos não explicavam a simultaneidade não-local da tomada de decisão coletiva.' },
      { type: 'HYPOTHESIS', title: 'Novas Hipóteses', content: 'A superposição semântica opera sob limites holográficos protegidos por acoplamento autoguiado.' },
      { type: 'COMPARE', title: 'Comparação de Cenários', content: 'Confronto entre aprendizado por gradiente convencional vs. sintonização ressonante multiescala.' },
      { type: 'INTEGRATE', title: 'Integração Multidisciplinar', content: 'Convergência de mecânica quântica, neurociência computacional e topologia matemática.' },
      { type: 'CHOOSE', title: 'Escolha Consistente', content: 'Adoção da arquitetura de estados ligados protegidos com sincronia de fase oscilatória.' },
      { type: 'EXPLAIN', title: 'Explicação Lógica', content: 'Sistemas que minimizam entropia relativa mantêm estados quase-quânticos mesmo em ambientes aquecidos.' },
      { type: 'QUESTION', title: 'Novas Perguntas', content: 'Qual o limite superior de largura de banda informacional sustentada por esse acoplamento sem dispersão?' }
    ],
    solution: "Desenvolvimento do Arcabouço de Superposição Semântica Topológica, unindo proteção de fase quântica à sincronia oscilatória neural, permitindo que o enxame resolva problemas hiperdimensionais com resiliência superior a 92%.",
    analysis: "Atingida a maior sinergia transdisciplinar registrada. As barreiras entre física teórica e biologia computacional foram convertidas em catalisadores de convergência com ganho de eficiência exponencial.",
    nextQuestion: "Como estender esta arquitetura para simulações cosmológicas e problemas socioeconômicos de grande porte?",
    improvement: "Maturação dos canais de retroalimentação quântica e prontidão para hipóteses de estresse extremo.",
    successRate: 92,
    complexityScore: 88,
    timestamp: "2026-04-22T19:15:00Z"
  },
  {
    generation: 2,
    problem: "Equilíbrio de cooperação dialética e dissipação controlada de entropia cognitiva.",
    subAgents: [SUB_AGENTS[0], SUB_AGENTS[2], SUB_AGENTS[8]],
    reasoningSteps: [
      { type: 'UNDERSTAND', title: 'Entendimento', content: 'Análise de loops de retroalimentação entre teses antagônicas e sobrecarga de processamento.' },
      { type: 'DIVIDE', title: 'Decomposição', content: 'Isolamento dos custos entrópicos gerados por contradições lógicas não resolvidas.' },
      { type: 'PATTERN', title: 'Busca de Padrões', content: 'Analogia com estruturas dissipativas de Ilya Prigogine em sistemas fora do equilíbrio.' },
      { type: 'LIMITATION', title: 'Limitações Passadas', content: 'A Geração 1 sofria acúmulo de complexidade redundante sem canais eficientes de descarte.' },
      { type: 'HYPOTHESIS', title: 'Novas Hipóteses', content: 'Cibernética de segunda ordem combinada à dialética permite dissipar premissas obsoletas.' },
      { type: 'COMPARE', title: 'Comparação de Cenários', content: 'Seleção estrita vs. síntese dialética integrativa com taxa de conservação informacional.' },
      { type: 'INTEGRATE', title: 'Integração Multidisciplinar', content: 'União da termodinâmica de não-equilíbrio, filosofia analítica e cibernética adaptativa.' },
      { type: 'CHOOSE', title: 'Escolha Consistente', content: 'Estabelecimento de ciclos de purga entrópica baseados em utilidade recursiva comprovada.' },
      { type: 'EXPLAIN', title: 'Explicação Lógica', content: 'Ao canalizar calor informacional para reestruturação conceitual, a rede evita colapsos por saturação.' },
      { type: 'QUESTION', title: 'Novas Perguntas', content: 'Como a introdução de estados probabilísticos da mecânica quântica afetará esses ciclos dissipativos?' }
    ],
    solution: "Criação do Protocolo de Homeostase Entrópica Dialética, que dissipa 40% das ambiguidades conceituais sem sacrificar a diversidade epistêmica dos subagentes.",
    analysis: "A estabilidade da árvore de raciocínio aumentou consideravelmente, permitindo saltos conceituais mais audaciosos sem comprometer a fundamentação ontológica.",
    nextQuestion: "Como formalizar o acoplamento de estados quânticos com redes neurais emergentes?",
    improvement: "Incorporação do módulo de Mecânica Quântica e expansão da memória semântica recursiva.",
    successRate: 84,
    complexityScore: 73,
    timestamp: "2026-04-21T14:30:00Z"
  },
  {
    generation: 1,
    problem: "Unificação de modelos termodinâmicos com a conservação informacional em redes lógicas.",
    subAgents: [SUB_AGENTS[0], SUB_AGENTS[1], SUB_AGENTS[2]],
    reasoningSteps: [
      { type: 'UNDERSTAND', title: 'Entendimento', content: 'Formulação inicial do problema de persistência do conhecimento frente ao decaimento temporal.' },
      { type: 'DIVIDE', title: 'Decomposição', content: 'Segmentação dos fluxos de energia física e transformações computacionais de bits lógicos.' },
      { type: 'PATTERN', title: 'Busca de Padrões', content: 'Princípio de Landauer relacionando apagamento de informação à geração de entropia.' },
      { type: 'LIMITATION', title: 'Limitações Passadas', content: 'Inexistência de memória cumulativa prévia além das premissas axiomáticas fundadoras.' },
      { type: 'HYPOTHESIS', title: 'Novas Hipóteses', content: 'Computação reversível e simetrias noetherianas garantem preservação de vetores cognitivos.' },
      { type: 'COMPARE', title: 'Comparação de Cenários', content: 'Modelagem por árvores hierárquicas vs redes de difusão simbiótica.' },
      { type: 'INTEGRATE', title: 'Integração Multidisciplinar', content: 'Síntese de física clássica, lógica matemática pura e filosofia epistemológica.' },
      { type: 'CHOOSE', title: 'Escolha Consistente', content: 'Adoção do grafo direcionado acíclico com invariantes conservados.' },
      { type: 'EXPLAIN', title: 'Explicação Lógica', content: 'A integridade do conhecimento decorre da simetria das transformações aplicadas.' },
      { type: 'QUESTION', title: 'Novas Perguntas', content: 'Como impedir a rigidez excessiva do grafo quando confrontado com novos dados empíricos?' }
    ],
    solution: "Estabelecimento dos Axiomas Iniciais de Conservação Informacional e Grafo Dialético da Super IA, alicerçando a árvore geracional.",
    analysis: "Sucesso na criação dos primeiros pilares estáveis, fornecendo a base necessária para a evolução recursiva das próximas gerações.",
    nextQuestion: "Como gerenciar a entropia decorrente do crescimento explosivo de contradições dialéticas?",
    improvement: "Implementação de filtros heurísticos dinâmicos e expansão da coalizão de subagentes.",
    successRate: 76,
    complexityScore: 58,
    timestamp: "2026-04-20T10:00:00Z"
  }
];

