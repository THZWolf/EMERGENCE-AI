/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState } from '../types';

export const STORAGE_KEY = 'EMERGENCE_AI_APP_STATE_V1';

/**
 * Loads and validates the persisted AppState from localStorage
 */
export function loadPersistedState(): Partial<AppState> | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    // Validate structural integrity
    if (typeof parsed.currentGeneration !== 'number' || isNaN(parsed.currentGeneration)) {
      return null;
    }

    return {
      currentGeneration: parsed.currentGeneration,
      knowledgeBank: Array.isArray(parsed.knowledgeBank) ? parsed.knowledgeBank : undefined,
      history: Array.isArray(parsed.history) ? parsed.history : undefined,
      isThinking: false, // Always restore with idle thinking state
      currentProcess: parsed.currentProcess || null,
      legacyKnowledge: Array.isArray(parsed.legacyKnowledge) ? parsed.legacyKnowledge : [],
      sandboxHypotheses: Array.isArray(parsed.sandboxHypotheses) ? parsed.sandboxHypotheses : [],
      creativeHypotheses: Array.isArray(parsed.creativeHypotheses) ? parsed.creativeHypotheses : undefined,
      activeAnomaly: parsed.activeAnomaly || null,
      sigmaMultiplier: typeof parsed.sigmaMultiplier === 'number' ? parsed.sigmaMultiplier : 2.0,
      audioSettings: parsed.audioSettings && typeof parsed.audioSettings === 'object' ? {
        soundEnabled: typeof parsed.audioSettings.soundEnabled === 'boolean' ? parsed.audioSettings.soundEnabled : true,
        volume: typeof parsed.audioSettings.volume === 'number' ? parsed.audioSettings.volume : 0.25,
        hapticsEnabled: typeof parsed.audioSettings.hapticsEnabled === 'boolean' ? parsed.audioSettings.hapticsEnabled : true,
      } : undefined,
      scheduledReminders: Array.isArray(parsed.scheduledReminders) ? parsed.scheduledReminders : undefined,
    };
  } catch (err) {
    console.warn('Failed to load persisted state from localStorage:', err);
    return null;
  }
}

/**
 * Persists current AppState into localStorage safely
 */
export function persistState(state: AppState): { success: boolean; timestamp: string; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, timestamp: new Date().toISOString(), error: 'localStorage unavailable' };
    }

    // Clone and sanitize state before saving
    const toSave: Partial<AppState> = {
      currentGeneration: state.currentGeneration,
      knowledgeBank: state.knowledgeBank,
      history: state.history,
      isThinking: false, // Ensure never saved as stuck in thinking
      currentProcess: state.currentProcess,
      legacyKnowledge: state.legacyKnowledge,
      sandboxHypotheses: state.sandboxHypotheses,
      creativeHypotheses: state.creativeHypotheses,
      activeAnomaly: state.activeAnomaly,
      sigmaMultiplier: state.sigmaMultiplier ?? 2.0,
      audioSettings: state.audioSettings,
      scheduledReminders: state.scheduledReminders,
    };

    const serialized = JSON.stringify(toSave);
    window.localStorage.setItem(STORAGE_KEY, serialized);

    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Error saving AppState to localStorage:', err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: err.message || 'Storage Quota Exceeded'
    };
  }
}

/**
 * Clears the persisted state from localStorage
 */
export function clearPersistedState(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error clearing localStorage:', err);
    return false;
  }
}
