/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScheduledReminder } from '../types';

export const REMINDERS_STORAGE_KEY = 'EMERGENCE_AI_SCHEDULED_REMINDERS';

export const DEFAULT_REMINDERS: ScheduledReminder[] = [
  {
    id: 'rem_morning_check',
    title: 'Inspeção Matinal de Convergência',
    time: '09:00',
    enabled: true,
    days: 'daily',
    focusTarget: 'core',
    note: 'Verificar a taxa de sucesso e a estabilidade da árvore geracional.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rem_afternoon_sandbox',
    title: 'Revisão de Hipóteses do Sandbox',
    time: '14:00',
    enabled: true,
    days: 'weekdays',
    focusTarget: 'sandbox',
    note: 'Analisar o índice de resiliência e promover hipóteses validadas ao framework principal.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rem_evening_audit',
    title: 'Auditoria de Anomalias & Fechamento',
    time: '18:30',
    enabled: false,
    days: 'daily',
    focusTarget: 'core',
    note: 'Conferir o piso de tolerância (-2σ) e consolidar os clusters do banco de conhecimento.',
    createdAt: new Date().toISOString()
  }
];

export function getTodayDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeString(date: Date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function isDayApplicable(days: 'daily' | 'weekdays' | 'weekend', dayOfWeek: number): boolean {
  if (days === 'daily') return true;
  if (days === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (days === 'weekend') return dayOfWeek === 0 || dayOfWeek === 6;
  return true;
}

/**
 * Checks if any scheduled reminder is due right now
 */
export function checkDueReminders(
  reminders: ScheduledReminder[], 
  currentDate: Date = new Date()
): ScheduledReminder | null {
  const currentTime = getCurrentTimeString(currentDate);
  const todayStr = getTodayDateString(currentDate);
  const dayOfWeek = currentDate.getDay();

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    if (!isDayApplicable(reminder.days, dayOfWeek)) continue;

    // Check if time matches current hour & minute and hasn't been triggered today yet
    if (reminder.time === currentTime && reminder.lastTriggeredDate !== todayStr) {
      return reminder;
    }
  }

  return null;
}

/**
 * Calculates human readable remaining time until the next scheduled reminder
 */
export function getNextUpcomingReminder(
  reminders: ScheduledReminder[], 
  currentDate: Date = new Date()
): { reminder: ScheduledReminder; minutesRemaining: number; label: string } | null {
  const active = reminders.filter(r => r.enabled);
  if (active.length === 0) return null;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  let nearest: { reminder: ScheduledReminder; diff: number } | null = null;

  for (const reminder of active) {
    const [h, m] = reminder.time.split(':').map(Number);
    const reminderMinutes = h * 60 + m;

    let diff = reminderMinutes - currentMinutes;
    if (diff <= 0) {
      diff += 24 * 60; // Next occurrence tomorrow
    }

    if (!nearest || diff < nearest.diff) {
      nearest = { reminder, diff };
    }
  }

  if (!nearest) return null;

  const hoursRemaining = Math.floor(nearest.diff / 60);
  const minsRemaining = nearest.diff % 60;

  let label = '';
  if (hoursRemaining === 0) {
    label = `em ${minsRemaining}m`;
  } else if (minsRemaining === 0) {
    label = `em ${hoursRemaining}h`;
  } else {
    label = `em ${hoursRemaining}h ${minsRemaining}m`;
  }

  return {
    reminder: nearest.reminder,
    minutesRemaining: nearest.diff,
    label
  };
}

/**
 * Requests native browser notification permission if available
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[Reminders] Failed to request notification permission:', err);
    return null;
  }
}

/**
 * Fires a system native notification if permission is granted
 */
export function sendBrowserNotification(reminder: ScheduledReminder, genNumber: number): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(`Emergence AI: ${reminder.title}`, {
        body: `⏰ Hora de checar a evolução (GEN_${genNumber.toString().padStart(4, '0')}). ${reminder.note || ''}`,
        tag: `emergence-reminder-${reminder.id}`,
      });
    } catch (err) {
      console.warn('[Reminders] Failed to dispatch browser notification:', err);
    }
  }
}
