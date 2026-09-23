import type { Schedule } from '../types';
import { reminderTime } from './reminders';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function stampUTC(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function localStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}00`;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function atTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h || 0, m || 0, 0, 0);
}

export function nextStart(schedule: Schedule, from: Date): Date | null {
  const time = reminderTime(schedule);
  const { recurrence } = schedule;
  if (recurrence.type === 'once') {
    if (!recurrence.date) return null;
    const [y, m, d] = recurrence.date.split('-').map(Number);
    return atTime(new Date(y, (m ?? 1) - 1, d ?? 1), time);
  }
  if (recurrence.type === 'weekly') {
    for (let i = 0; i < 8; i += 1) {
      const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      if (!recurrence.weekdays.includes(day.getDay())) continue;
      const start = atTime(day, time);
      if (start.getTime() > from.getTime()) return start;
    }
    return null;
  }
  if (recurrence.type === 'monthly' && recurrence.dayOfMonth) {
    const candidate = new Date(from.getFullYear(), from.getMonth(), recurrence.dayOfMonth);
    let start = atTime(candidate, time);
    if (start.getTime() <= from.getTime()) {
      start = atTime(new Date(from.getFullYear(), from.getMonth() + 1, recurrence.dayOfMonth), time);
    }
    return start;
  }
  return null;
}

function recurrenceRule(schedule: Schedule): string | null {
  const { recurrence } = schedule;
  if (recurrence.type === 'weekly' && recurrence.weekdays.length > 0) {
    const days = [...recurrence.weekdays].sort((a, b) => a - b).map((d) => BYDAY[d]);
    return `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`;
  }
  if (recurrence.type === 'monthly' && recurrence.dayOfMonth) {
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${recurrence.dayOfMonth}`;
  }
  return null;
}

function event(schedule: Schedule, now: Date): string | null {
  const start = nextStart(schedule, now);
  if (!start) return null;
  const uid = `${schedule.id}@shiji`;
  const rule = recurrenceRule(schedule);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampUTC(now)}`,
    `DTSTART:${localStamp(start)}`,
    `SUMMARY:${escapeText(schedule.title)}`,
    ...(rule ? [rule] : []),
    ...(schedule.notes ? [`DESCRIPTION:${escapeText(schedule.notes)}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(schedule.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
  ];
  return lines.join('\r\n');
}

export function schedulesToIcs(schedules: Schedule[], now = new Date()): string {
  const events = schedules
    .filter((s) => s.active)
    .map((s) => event(s, now))
    .filter((e): e is string => e !== null);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shiji//Schedules//CN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:拾集日程`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
