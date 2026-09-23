import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Schedule } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import {
  WEEKDAYS,
  addDays,
  describeRecurrence,
  isSameDay,
  schedulesForDay,
  startOfWeek,
  toISODate,
} from '../../utils/date';
import { ScheduleForm } from './ScheduleForm';
import { schedulesToIcs } from '../../utils/ics';
import { downloadText } from '../../utils/exportPlan';
import styles from './SchedulesPage.module.css';

export function SchedulesPage() {
  const schedules = useStore((s) => s.schedules);
  const objects = useStore((s) => s.objects);
  const lists = useStore((s) => s.lists);
  const plans = useStore((s) => s.plans);
  const addSchedule = useStore((s) => s.addSchedule);
  const updateSchedule = useStore((s) => s.updateSchedule);
  const removeSchedule = useStore((s) => s.removeSchedule);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const today = new Date();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const objectMap = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (schedule: Schedule) => {
    setEditing(schedule);
    setFormOpen(true);
  };

  const rangeLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 – ${
    addDays(weekStart, 6).getMonth() + 1
  }月${addDays(weekStart, 6).getDate()}日`;

  return (
    <div>
      <PageHeader
        title="日程"
        subtitle="按周查看重复日程，比如番剧更新时间"
        actions={
          <>
            <Button
              onClick={() => {
                if (schedules.filter((s) => s.active).length === 0) {
                  window.alert('还没有启用的日程。');
                  return;
                }
                downloadText('拾集日程.ics', schedulesToIcs(schedules), 'text/calendar');
              }}
            >
              导出到日历
            </Button>
            <Button variant="primary" onClick={openNew}>
              + 新建日程
            </Button>
          </>
        }
      />

      <div className={styles.weekNav}>
        <Button size="sm" onClick={() => setWeekStart((w) => addDays(w, -7))}>
          ← 上一周
        </Button>
        <span className={styles.range}>{rangeLabel}</span>
        <Button size="sm" onClick={() => setWeekStart((w) => addDays(w, 7))}>
          下一周 →
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          本周
        </Button>
      </div>

      <div className={styles.week}>
        {days.map((day, i) => {
          const daySchedules = schedulesForDay(schedules, day);
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className={[styles.day, isToday ? styles.today : ''].join(' ')}>
              <div className={styles.dayHead}>
                <span className={styles.dayName}>周{WEEKDAYS[day.getDay()]}</span>
                <span className={styles.dayDate}>{toISODate(day).slice(5)}</span>
              </div>
              <div className={styles.dayBody}>
                {daySchedules.length === 0 ? (
                  <span className={styles.noItem}>—</span>
                ) : (
                  daySchedules.map((s) => {
                    const obj = s.objectId ? objectMap.get(s.objectId) : undefined;
                    return (
                      <button key={s.id} className={styles.slot} onClick={() => openEdit(s)}>
                        {s.time && <span className={styles.time}>{s.time}</span>}
                        <span className={styles.slotTitle}>
                          {obj && <Icon value={obj.icon} type={obj.iconType} size={15} />}
                          {s.title}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className={styles.allTitle}>全部日程</h2>
      {schedules.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="还没有日程"
          description="创建一个日程，比如「每周五 20:00 某番更新」。"
          action={
            <Button variant="primary" onClick={openNew}>
              + 新建日程
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {schedules.map((s) => {
            const obj = s.objectId ? objectMap.get(s.objectId) : undefined;
            const linkedList = s.listId ? listMap.get(s.listId) : undefined;
            const plan = s.planId ? planMap.get(s.planId) : undefined;
            return (
              <div key={s.id} className={[styles.row, s.active ? '' : styles.inactive].join(' ')}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={(e) => updateSchedule(s.id, { active: e.target.checked })}
                  />
                  <span className={styles.switch} />
                </label>

                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>
                    {obj && <Icon value={obj.icon} type={obj.iconType} size={18} />}
                    <strong>{s.title}</strong>
                    {s.time && <span className={styles.timeChip}>{s.time}</span>}
                  </div>
                  <div className={styles.meta}>
                    <span>{describeRecurrence({ recurrence: s.recurrence })}</span>
                    {plan && (
                      <Link to={`/plans/${plan.id}`} className={styles.metaLink}>
                        {plan.icon} {plan.title}
                      </Link>
                    )}
                    {linkedList && (
                      <Link to={`/lists/${linkedList.id}`} className={styles.metaLink}>
                        📋 {linkedList.title}
                      </Link>
                    )}
                    {obj && (
                      <Link to={`/objects/${obj.id}`} className={styles.metaLink}>
                        {obj.name}
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`删除日程「${s.title}」？`)) removeSchedule(s.id);
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ScheduleForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) updateSchedule(editing.id, input);
          else addSchedule(input);
        }}
      />
    </div>
  );
}
