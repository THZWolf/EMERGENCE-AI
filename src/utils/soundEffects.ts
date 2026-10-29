/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioSettings } from '../types';

export const AUDIO_STORAGE_KEY = 'EMERGENCE_AI_AUDIO_SETTINGS';

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  soundEnabled: true,
  volume: 0.25, // Subtle and discrete default volume (25%)
  hapticsEnabled: true,
};

let sharedAudioCtx: AudioContext | null = null;

/**
 * Safely initializes or retrieves the shared AudioContext instance.
 * Resumes context if suspended due to browser autoplay policies.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {
        // Will resume on next user gesture
      });
    }

    return sharedAudioCtx;
  } catch (err) {
    console.warn('[SoundEffects] Web Audio API initialization failed:', err);
    return null;
  }
}

/**
 * Loads persisted audio preferences from localStorage
 */
export function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };

    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      volume: typeof parsed.volume === 'number' && !isNaN(parsed.volume) ? Math.max(0, Math.min(1, parsed.volume)) : 0.25,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : true,
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

/**
 * Persists audio settings to localStorage
 */
export function persistAudioSettings(settings: AudioSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('[SoundEffects] Failed to save audio settings to localStorage:', err);
  }
}

/**
 * Dispatches optional tactile haptic vibration if supported
 */
export function triggerHaptic(pattern: number | number[], hapticsEnabled: boolean): void {
  if (!hapticsEnabled || typeof window === 'undefined' || !window.navigator || !('vibrate' in window.navigator)) {
    return;
  }

  try {
    window.navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported environment
  }
}

/**
 * Plays a sleek, subtle harmonic futuristic chime upon concluding an AI generation.
 * Consists of an ascending 3-note crystalline arpeggio with soft exponential decay.
 */
export function playGenerationCompleteSound(customSettings?: Partial<AudioSettings>): void {
  const currentSettings = { ...loadAudioSettings(), ...(customSettings || {}) };

  if (!currentSettings.soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseVolume = currentSettings.volume;
    const now = ctx.currentTime;

    // Master Gain for this sound event
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(baseVolume * 0.45, now);
    masterGain.connect(ctx.destination);

    // Warm Low-Pass Filter to eliminate harsh treble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.connect(masterGain);

    // Crystalline ascending notes (C5 -> E5 -> G5)
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.20 },
      { freq: 659.25, start: 0.07, dur: 0.22 },
      { freq: 783.99, start: 0.14, dur: 0.28 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Soft envelope: attack 10ms, gentle decay to zero
      noteGain.gain.setValueAtTime(0.0001, now + start);
      noteGain.gain.exponentialRampToValueAtTime(0.6, now + start + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    // Subtle tactile haptic impulse
    triggerHaptic(35, currentSettings.hapticsEnabled);
  } catch (err) {
    console.warn('[SoundEffects] Generation complete sound failed:', err);
  }
}

/**
 * Plays a discrete, tactical cautionary ping upon detecting an anomaly or statistical regression (-2σ).
 * Consists of a dual soft sonar pulse with lower fundamental tone, noticeable yet unobtrusive.
 */
export function playAnomalyAlertSound(customSettings?: Partial<AudioSettings>): void {
  const currentSettings = { ...loadAudioSettings(), ...(customSettings || {}) };

  if (!currentSettings.soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseVolume = currentSettings.volume;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(baseVolume * 0.55, now);
    masterGain.connect(ctx.destination);

    // Low-pass filter for a smooth, deep tactical tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.connect(masterGain);

    // Dual sonar pulse (310Hz then 240Hz)
    const pulses = [
      { freq: 310, start: 0.00, dur: 0.09, type: 'triangle' as OscillatorType },
      { freq: 240, start: 0.11, dur: 0.14, type: 'sine' as OscillatorType },
    ];

    pulses.forEach(({ freq, start, dur, type }) => {
      const osc = ctx.createOscillator();
      const pulseGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      // Slight pitch drift downward to evoke caution/alert
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, now + start + dur);

      pulseGain.gain.setValueAtTime(0.0001, now + start);
      pulseGain.gain.exponentialRampToValueAtTime(0.7, now + start + 0.015);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(pulseGain);
      pulseGain.connect(filter);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    // Alert haptic pattern: two crisp vibrations
    triggerHaptic([50, 40, 65], currentSettings.hapticsEnabled);
  } catch (err) {
    console.warn('[SoundEffects] Anomaly alert sound failed:', err);
  }
}

/**
 * Plays a discrete, melodic reminder notification chime when a scheduled check-in is due.
 * Dual harmonic bell chime (440Hz -> 659.25Hz) with gentle acoustic resonance.
 */
export function playReminderChimeSound(customSettings?: Partial<AudioSettings>): void {
  const currentSettings = { ...loadAudioSettings(), ...(customSettings || {}) };

  if (!currentSettings.soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseVolume = currentSettings.volume;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(baseVolume * 0.5, now);
    masterGain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.connect(masterGain);

    const notes = [
      { freq: 440.0, start: 0.00, dur: 0.28 },
      { freq: 659.25, start: 0.12, dur: 0.36 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      noteGain.gain.setValueAtTime(0.0001, now + start);
      noteGain.gain.exponentialRampToValueAtTime(0.65, now + start + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    triggerHaptic([40, 60, 40], currentSettings.hapticsEnabled);
  } catch (err) {
    console.warn('[SoundEffects] Reminder chime failed:', err);
  }
}

/**
 * Preview helper for testing sounds in the settings UI
 */
export function playPreviewSound(type: 'generation' | 'anomaly' | 'reminder', settings?: Partial<AudioSettings>): void {
  if (type === 'generation') {
    playGenerationCompleteSound({ ...(settings || {}), soundEnabled: true });
  } else if (type === 'anomaly') {
    playAnomalyAlertSound({ ...(settings || {}), soundEnabled: true });
  } else {
    playReminderChimeSound({ ...(settings || {}), soundEnabled: true });
  }
}
