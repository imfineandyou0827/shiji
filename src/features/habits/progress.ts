import { addDays, parseISODate, toISODate } from '../../utils/date';

export const HABIT_TARGET_DAYS = 21;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function currentStreak(checkins: string[], today = new Date()): number {
  const done = new Set(checkins);
  let cursor = startOfDay(today);
  if (!done.has(toISODate(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (done.has(toISODate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface HabitDay {
  date: string;
  day: number;
  checked: boolean;
  today: boolean;
}

export function recentHabitDays(
  checkins: string[],
  count = HABIT_TARGET_DAYS,
  today = new Date(),
): HabitDay[] {
  const done = new Set(checkins);
  const todayIso = toISODate(today);
  return Array.from({ length: count }, (_, index) => {
    const date = toISODate(addDays(today, index - count + 1));
    return {
      date,
      day: parseISODate(date).getDate(),
      checked: done.has(date),
      today: date === todayIso,
    };
  });
}
