import { useState } from 'react';
import type { Habit } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { parseISODate, toISODate, WEEKDAYS } from '../../utils/date';
import { currentStreak, HABIT_TARGET_DAYS, recentHabitDays } from './progress';
import { HabitForm } from './HabitForm';
import styles from './HabitsPage.module.css';

type Filter = 'all' | 'active' | 'done';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'done', label: '已完成' },
];

export function HabitsPage() {
  const habits = useStore((s) => s.habits);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const removeHabit = useStore((s) => s.removeHabit);
  const toggleCheckIn = useStore((s) => s.toggleHabitCheckIn);

  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const today = new Date();
  const todayIso = toISODate(today);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditing(habit);
    setFormOpen(true);
  };

  const visible = habits
    .filter((habit) => {
      if (filter === 'active') return habit.checkins.length < HABIT_TARGET_DAYS;
      if (filter === 'done') return habit.checkins.length >= HABIT_TARGET_DAYS;
      return true;
    })
    .sort((a, b) => {
      const aDone = a.checkins.length >= HABIT_TARGET_DAYS;
      const bDone = b.checkins.length >= HABIT_TARGET_DAYS;
      return Number(aDone) - Number(bDone);
    });

  return (
    <div>
      <PageHeader
        title="坚持"
        subtitle="每天打卡一次，累计 21 天养成一个小习惯；中断不会清零"
        actions={
          <Button variant="primary" onClick={openNew}>
            + 新建目标
          </Button>
        }
      />

      <div className={styles.chips}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            className={[styles.chip, filter === item.value ? styles.chipActive : ''].join(' ')}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="还没有坚持目标"
          description="写下想坚持的小事，比如每天阅读 20 分钟、喝够 8 杯水。每天打卡一次，累计 21 天就算养成。"
          action={
            <Button variant="primary" onClick={openNew}>
              + 新建目标
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={filter === 'done' ? '还没有完成的目标' : '没有进行中的目标'}
          description={filter === 'done' ? '累计打卡满 21 天后会出现在这里。' : '新建一个目标，从今天开始打卡吧。'}
        />
      ) : (
        <div className={styles.list}>
          {visible.map((habit) => {
            const total = habit.checkins.length;
            const done = total >= HABIT_TARGET_DAYS;
            const streak = currentStreak(habit.checkins, today);
            const days = recentHabitDays(habit.checkins, HABIT_TARGET_DAYS, today);
            const weekdays = days
              .slice(0, 7)
              .map((day) => WEEKDAYS[parseISODate(day.date).getDay()]);
            const todayChecked = habit.checkins.includes(todayIso);
            const range = `${days[0].date.slice(5).replace('-', '/')} – ${days[days.length - 1].date
              .slice(5)
              .replace('-', '/')}`;
            const percent = Math.min(100, (total / HABIT_TARGET_DAYS) * 100);

            return (
              <article
                key={habit.id}
                className={[styles.card, done ? styles.cardDone : ''].join(' ')}
              >
                <div className={styles.head}>
                  <span className={styles.icon} aria-hidden="true">
                    {habit.icon}
                  </span>
                  <div className={styles.headMain}>
                    <div className={styles.titleRow}>
                      <strong>{habit.title}</strong>
                      {done && <span className={styles.doneBadge}>21 天达成</span>}
                    </div>
                    <div className={styles.meta}>
                      <span>连续 {streak} 天</span>
                      <span>
                        {done
                          ? `累计 ${total} 天 · 目标 ${HABIT_TARGET_DAYS} 天`
                          : `累计 ${total}/${HABIT_TARGET_DAYS} 天`}
                      </span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(habit)}>
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`删除坚持目标「${habit.title}」？`)) removeHabit(habit.id);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>

                <div
                  className={styles.progress}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={HABIT_TARGET_DAYS}
                  aria-valuenow={Math.min(total, HABIT_TARGET_DAYS)}
                  aria-label="打卡进度"
                >
                  <span className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>

                <div className={styles.calendarHead}>
                  <span>{range}</span>
                  <span>最近 21 天 · 点日期补打卡</span>
                </div>
                <div className={styles.weekHead} aria-hidden="true">
                  {weekdays.map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                  ))}
                </div>
                <div className={styles.grid} role="group" aria-label="最近 21 天打卡记录">
                  {days.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      className={[
                        styles.day,
                        day.checked ? styles.dayDone : '',
                        day.today ? styles.dayToday : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={day.checked}
                      aria-label={`${day.date}${day.checked ? ' 已打卡，点击取消' : ' 打卡'}`}
                      title={`${day.date}${day.checked ? ' 已打卡，点击取消' : ' 点击打卡'}`}
                      onClick={() => toggleCheckIn(habit.id, day.date)}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>

                <div className={styles.foot}>
                  <Button
                    size="sm"
                    variant={todayChecked ? 'secondary' : 'primary'}
                    aria-pressed={todayChecked}
                    onClick={() => toggleCheckIn(habit.id, todayIso)}
                  >
                    {todayChecked ? '今日已打卡 ✓' : '今日打卡'}
                  </Button>
                  <span className={styles.remaining}>
                    {done
                      ? '🎉 21 天达成，继续保持'
                      : `还差 ${HABIT_TARGET_DAYS - total} 天`}
                  </span>
                </div>

                {habit.notes && <p className={styles.notes}>{habit.notes}</p>}
              </article>
            );
          })}
        </div>
      )}

      <HabitForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) updateHabit(editing.id, input);
          else addHabit(input);
        }}
      />
    </div>
  );
}
