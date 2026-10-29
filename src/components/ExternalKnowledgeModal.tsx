/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Globe, 
  BookOpen, 
  Library, 
  Sparkles, 
  ExternalLink, 
  Check, 
  Search, 
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Atom,
  Clock
} from 'lucide-react';
import { ingestExternalKnowledge } from '../services/geminiService';
import { ExternalKnowledgeIngestionResult, KnowledgeEntry } from '../types';

interface ExternalKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestKnowledge: (entries: KnowledgeEntry[]) => void;
}

type SourceTab = 'Scientific Journals' | 'Historical Archives' | 'Online Encyclopedias' | 'Custom Research';

const PRESET_TOPICS: Record<SourceTab, string[]> = {
  'Scientific Journals': [
    "Quantum decoherence and emergent macroscopic reality (arXiv/Physical Review)",
    "Thermodynamic dissipation in non-equilibrium biological computation (Nature)",
    "Neural oscillator synchrony in distributed cognitive architectures (Cell/PubMed)",
    "Asymptotic algorithmic lower bounds and computational hardness (IEEE/ACM)"
  ],
  'Historical Archives': [
    "The Copernican and Newtonian paradigm shifts in natural philosophy (JSTOR)",
    "Foundational disputes in early Cybernetics: Wiener, Ashby, and Von Neumann",
    "Evolution of human social contracts under institutional crises (Historical Archives)",
    "Epistemological transitions from Cartesian dualism to embodied cognition"
  ],
  'Online Encyclopedias': [
    "Epistemological foundationalism vs coherentism (Stanford Encyclopedia of Philosophy)",
    "Autopoiesis and organizational closure in complex living systems",
    "Algorithmic information theory and Kolmogorov complexity (Britannica/Academic)",
    "The philosophy of mind: Multiple realizability and supervenience"
  ],
  'Custom Research': [
    "Non-abelian anyons and topological quantum computing",
    "Self-organized criticality in multi-agent economic equilibria",
    "Category theory applications in relational databases and logic"
  ]
};

export default function ExternalKnowledgeModal({
  isOpen,
  onClose,
  onIngestKnowledge
}: ExternalKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>('Scientific Journals');
  const [customInquiry, setCustomInquiry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestionResult, setIngestionResult] = useState<ExternalKnowledgeIngestionResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [ingestedSuccess, setIngestedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (topicQuery: string) => {
    if (!topicQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setIngestionResult(null);
    setIngestedSuccess(false);

    try {
      const result = await ingestExternalKnowledge(topicQuery, activeTab, customInquiry);
      setIngestionResult(result);
      if (result.entries && result.entries.length > 0) {
        setSelectedIndices(result.entries.map((_, i) => i));
      }
    } catch (err: any) {
      setError(err.message || "Falha ao consultar repositórios acadêmicos externos.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIndex = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCommitKnowledge = () => {
    if (!ingestionResult || selectedIndices.length === 0) return;

    const newEntries: KnowledgeEntry[] = selectedIndices.map(idx => {
      const item = ingestionResult.entries[idx];
      let sourceType: KnowledgeEntry['sourceType'] = 'journal';
      if (activeTab === 'Historical Archives') sourceType = 'archive';
      if (activeTab === 'Online Encyclopedias') sourceType = 'encyclopedia';

      return {
        id: `ext_${Date.now()}_${idx}`,
        content: `[${item.title}] ${item.content}`,
        contributor: item.contributor || activeTab,
        timestamp: new Date().toISOString(),
        tags: [...item.tags, activeTab.replace(/\s+/g, '')],
        sourceUrl: item.sourceUrl,
        sourceType,
        relevanceExplanation: item.relevance
      };
    });

    onIngestKnowledge(newEntries);
    setIngestedSuccess(true);
    setTimeout(() => {
      onClose();
      setIngestionResult(null);
      setIngestedSuccess(false);
    }, 1200);
  };

  const getTabIcon = (tab: SourceTab) => {
    switch (tab) {
      case 'Scientific Journals': return <Atom className="w-3.5 h-3.5" />;
      case 'Historical Archives': return <Clock className="w-3.5 h-3.5" />;
      case 'Online Encyclopedias': return <BookOpen className="w-3.5 h-3.5" />;
      case 'Custom Research': return <Search className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-3xl bg-[#0d0f12] border border-evolve-line rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-5 border-b border-evolve-line flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-evolve-accent/10 border border-evolve-accent/30 flex items-center justify-center text-evolve-accent">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                External Knowledge Ingestion
                <span className="text-[9px] px-2 py-0.5 rounded bg-evolve-accent/10 border border-evolve-accent/30 text-evolve-accent">
                  Google Search Grounded
                </span>
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                Integrate verified research from scientific journals, historical archives, and academic encyclopedias.
              </p>
            </div>
          </div>
          <button 
            id="btn-close-external-modal"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Categories Tabs */}
        <div className="flex border-b border-evolve-line bg-black/20 px-4 overflow-x-auto">
          {(['Scientific Journals', 'Historical Archives', 'Online Encyclopedias', 'Custom Research'] as SourceTab[]).map(tab => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                setActiveTab(tab);
                setIngestionResult(null);
                setError(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-evolve-accent text-evolve-accent bg-evolve-accent/[0.04]'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {getTabIcon(tab)}
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Query Bar */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center justify-between">
              <span>{activeTab === 'Custom Research' ? 'Custom Academic Query' : `Focus Topic in ${activeTab}`}</span>
              <span className="text-evolve-accent/60">Live Grounding Active</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input 
                  id="input-external-query"
                  type="text"
                  value={customInquiry}
                  onChange={(e) => setCustomInquiry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(customInquiry)}
                  placeholder={
                    activeTab === 'Scientific Journals'
                      ? "e.g., Quantum error correction, neural plasticity, thermodynamics of computation..."
                      : activeTab === 'Historical Archives'
                      ? "e.g., Scientific revolutions, early cybernetics, evolution of cooperation..."
                      : "e.g., Epistemic humility, self-organizing systems, category theory..."
                  }
                  className="w-full bg-white/5 border border-evolve-line rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-white/25 focus:border-evolve-accent/50 outline-none transition-colors"
                />
              </div>
              <button
                id="btn-trigger-external-search"
                onClick={() => handleSearch(customInquiry)}
                disabled={isLoading || !customInquiry.trim()}
                className="px-4 py-2 bg-evolve-accent text-evolve-bg rounded-lg font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-30 flex items-center gap-1.5 transition-all"
              >
                {isLoading ? <Globe className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Ingerir
              </button>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Curated Frontier Inquiries</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS[activeTab].map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCustomInquiry(topic);
                    handleSearch(topic);
                  }}
                  className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 text-white/60 hover:border-evolve-accent/40 hover:text-evolve-accent bg-white/[0.02] transition-all text-left"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-evolve-accent border-t-transparent animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-evolve-accent uppercase tracking-widest">
                  Consultando {activeTab}...
                </p>
                <p className="text-[11px] text-white/40 max-w-sm">
                  Utilizando Google Search Grounding para extrair artigos científicos, tratados históricos e definições autorizadas.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Results Display */}
          {ingestionResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Summary Banner */}
              <div className="p-3.5 rounded-lg border border-evolve-line bg-white/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-evolve-accent">
                    Síntese da Literatura
                  </span>
                  <span className="text-[9px] font-mono text-white/40">
                    {ingestionResult.entries.length} Clusters Processados
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {ingestionResult.summary}
                </p>
                {ingestionResult.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">Fontes Canônicas:</span>
                    {ingestionResult.citations.slice(0, 4).map((c, i) => (
                      <a 
                        key={i} 
                        href={c.uri} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-evolve-accent/80 hover:text-evolve-accent hover:underline bg-evolve-accent/5 px-2 py-0.5 rounded border border-evolve-accent/20"
                      >
                        {c.title.length > 28 ? c.title.slice(0, 26) + '…' : c.title}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Individual Clusters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>Selecione os clusters para incorporar ao Banco de Conhecimento:</span>
                  <button 
                    onClick={() => setSelectedIndices(
                      selectedIndices.length === ingestionResult.entries.length 
                        ? [] 
                        : ingestionResult.entries.map((_, i) => i)
                    )}
                    className="text-evolve-accent hover:underline"
                  >
                    {selectedIndices.length === ingestionResult.entries.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>

                {ingestionResult.entries.map((item, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleIndex(idx)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                        isSelected 
                          ? 'border-evolve-accent/50 bg-evolve-accent/[0.04]' 
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-evolve-accent border-evolve-accent text-evolve-bg' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                            {item.title}
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-evolve-accent/90 uppercase">
                          {item.contributor}
                        </span>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed font-sans pl-6">
                        {item.content}
                      </p>

                      <div className="pl-6 flex items-center justify-between text-[9px] font-mono text-white/40 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-evolve-accent/70 hover:text-evolve-accent hover:underline"
                          >
                            Ver Referência <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-evolve-line bg-black/50 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40">
            {selectedIndices.length} de {ingestionResult?.entries?.length || 0} selecionados
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-lg text-xs font-mono uppercase text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              id="btn-integrate-knowledge"
              onClick={handleCommitKnowledge}
              disabled={!ingestionResult || selectedIndices.length === 0 || ingestedSuccess}
              className="px-5 py-2 bg-evolve-accent text-evolve-bg rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-30 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,156,0.2)]"
            >
              {ingestedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conhecimento Integrado!
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  Incorporar ao Banco ({selectedIndices.length})
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
