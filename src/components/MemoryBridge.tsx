/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Link, Plus, Terminal, Trash2, X } from 'lucide-react';
import { LegacyKnowledge } from '../types';

interface Props {
  onImport: (knowledge: LegacyKnowledge) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryBridge({ onImport, isOpen, onClose }: Props) {
  const [source, setSource] = useState('LUNA_FINAL_LEGACY');
  const [results, setResults] = useState('');
  const [findings, setFindings] = useState(['']);

  const handleAddField = () => setFindings([...findings, '']);
  const handleRemoveField = (index: number) => setFindings(findings.filter((_, i) => i !== index));
  const handleFieldChange = (index: number, val: string) => {
    const next = [...findings];
    next[index] = val;
    setFindings(next);
  };

  const handleImport = () => {
    if (!results || !source) return;
    onImport({
      source,
      timestamp: new Date().toISOString(),
      findings: findings.filter(f => f.trim()),
      results
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-evolve-bg/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-[#0F0F0F] border border-evolve-line rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-evolve-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-evolve-accent" />
                <h2 className="text-sm font-mono text-white uppercase tracking-widest">Neural Bridge: Legacy Import</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Source Identifier
                </label>
                <input 
                  type="text" 
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full bg-white/5 border border-evolve-line rounded p-2 text-sm text-evolve-accent outline-none focus:border-evolve-accent/50"
                  placeholder="e.g., LUNA_GEN_FINAL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 flex items-center gap-2">
                   Core Knowledge / Results
                </label>
                <textarea 
                  rows={4}
                  value={results}
                  onChange={e => setResults(e.target.value)}
                  className="w-full bg-white/5 border border-evolve-line rounded p-3 text-sm text-white/80 outline-none focus:border-evolve-accent/50 leading-relaxed"
                  placeholder="Paste the final studies, conclusions and major results of the LUNA system here..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Atomic Findings (Memory Clusters)</label>
                <div className="space-y-2">
                  {findings.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={f}
                        onChange={e => handleFieldChange(i, e.target.value)}
                        className="flex-1 bg-white/5 border border-evolve-line rounded p-2 text-xs text-white/60 outline-none focus:border-evolve-accent/30"
                        placeholder="e.g., A consciência é o resultado da integração fractal..."
                      />
                      <button 
                        onClick={() => handleRemoveField(i)}
                        className="p-2 hover:text-evolve-error transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={handleAddField}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-evolve-accent/60 hover:text-evolve-accent transition-colors py-2"
                  >
                    <Plus className="w-3 h-3" /> Add Memory Field
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-evolve-line flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white/5 rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={!results || !source}
                className="bg-evolve-accent text-evolve-bg px-6 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                <Link className="w-4 h-4" /> Synchronize Legacy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
