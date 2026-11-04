import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  HABIT_TARGET_DAYS,
  recentHabitDays,
} from '../src/features/habits/progress';

const today = new Date(2024, 4, 10); // 2024-05-10

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2024-05-08', '2024-05-09', '2024-05-10'], today)).toBe(3);
  });

  it('still counts when today is not checked in yet', () => {
    expect(currentStreak(['2024-05-08', '2024-05-09'], today)).toBe(2);
  });

  it('resets when both today and yesterday are missing', () => {
    expect(currentStreak(['2024-05-08'], today)).toBe(0);
  });

  it('ignores gaps before the current run', () => {
    expect(currentStreak(['2024-05-01', '2024-05-09', '2024-05-10'], today)).toBe(2);
  });

  it('is zero without check-ins', () => {
    expect(currentStreak([], today)).toBe(0);
  });
});

describe('recentHabitDays', () => {
  it('returns the last 21 days ending today', () => {
    const days = recentHabitDays([], HABIT_TARGET_DAYS, today);
    expect(days).toHaveLength(21);
    expect(days[0].date).toBe('2024-04-20');
    expect(days[20].date).toBe('2024-05-10');
    expect(days[20].today).toBe(true);
    expect(days.filter((day) => day.checked)).toHaveLength(0);
  });

  it('marks checked-in dates', () => {
    const days = recentHabitDays(['2024-05-10', '2024-04-20'], HABIT_TARGET_DAYS, today);
    expect(days[0].checked).toBe(true);
    expect(days[19].checked).toBe(false);
    expect(days[20].checked).toBe(true);
  });

  it('exposes the day of month for each cell', () => {
    const days = recentHabitDays([], HABIT_TARGET_DAYS, today);
    expect(days[20].day).toBe(10);
  });
});
