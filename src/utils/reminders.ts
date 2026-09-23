import type { Schedule } from '../types';
import { toISODate } from './date';

export function reminderTime(schedule: Schedule): string {
  return schedule.time || '09:00';
}

export function occurrenceOn(schedule: Schedule, date: Date): Date | null {
  if (!schedule.active) return null;
  const { recurrence } = schedule;
  if (recurrence.type === 'once') {
    if (recurrence.date !== toISODate(date)) return null;
  } else if (recurrence.type === 'weekly') {
    if (!recurrence.weekdays.includes(date.getDay())) return null;
  } else if (recurrence.type === 'monthly') {
    if (recurrence.dayOfMonth !== date.getDate()) return null;
  } else {
    return null;
  }
  const [h, m] = reminderTime(schedule).split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h || 0, m || 0, 0, 0);
}

export function describeReminder(schedule: Schedule): string {
  const time = reminderTime(schedule);
  return schedule.time ? time : `${time}（默认）`;
}
