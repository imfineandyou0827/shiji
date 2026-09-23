import type { Recurrence, Schedule } from '../types';

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface RecurrenceLabelInput {
  recurrence: Recurrence;
}

export function describeRecurrence({ recurrence }: RecurrenceLabelInput): string {
  if (recurrence.type === 'once') {
    return recurrence.date ? `单次 · ${recurrence.date}` : '单次';
  }
  if (recurrence.type === 'monthly') {
    return recurrence.dayOfMonth ? `每月 ${recurrence.dayOfMonth} 日` : '每月';
  }
  const days = [...recurrence.weekdays].sort((a, b) => a - b);
  if (days.length === 0) return '每周';
  if (days.length === 7) return '每天';
  return `每周${days.map((d) => WEEKDAYS[d]).join('、')}`;
}

export function occursOn(schedule: Schedule, date: Date): boolean {
  const { recurrence } = schedule;
  if (recurrence.type === 'once') {
    return recurrence.date === toISODate(date);
  }
  if (recurrence.type === 'weekly') {
    return recurrence.weekdays.includes(date.getDay());
  }
  if (recurrence.type === 'monthly') {
    return recurrence.dayOfMonth === date.getDate();
  }
  return false;
}

export function schedulesForDay(schedules: Schedule[], date: Date): Schedule[] {
  return schedules
    .filter((s) => s.active && occursOn(s, date))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}
