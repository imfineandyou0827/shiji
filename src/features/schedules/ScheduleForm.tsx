import { useState } from 'react';
import type { RecurrenceType, Schedule } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, Select, TextArea, TextInput } from '../../components/forms';
import { WEEKDAYS, toISODate } from '../../utils/date';
import { useStore } from '../../store/useStore';
import type { ScheduleInput } from '../../store/useStore';
import styles from './ScheduleForm.module.css';

interface ScheduleFormProps {
  open: boolean;
  initial?: Schedule | null;
  onClose: () => void;
  onSubmit: (input: ScheduleInput) => void;
}

export function ScheduleForm(props: ScheduleFormProps) {
  if (!props.open) return null;
  return <ScheduleFormBody {...props} />;
}

function ScheduleFormBody({ initial, onClose, onSubmit }: ScheduleFormProps) {
  const objects = useStore((s) => s.objects);
  const lists = useStore((s) => s.lists);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<RecurrenceType>(initial?.recurrence.type ?? 'weekly');
  const [weekdays, setWeekdays] = useState<number[]>(initial?.recurrence.weekdays ?? [1]);
  const [dayOfMonth, setDayOfMonth] = useState(initial?.recurrence.dayOfMonth ?? 1);
  const [date, setDate] = useState(initial?.recurrence.date ?? toISODate(new Date()));
  const [time, setTime] = useState(initial?.time ?? '');
  const [objectId, setObjectId] = useState(initial?.objectId ?? '');
  const [listId, setListId] = useState(initial?.listId ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const valid =
    title.trim().length > 0 &&
    (type !== 'weekly' || weekdays.length > 0);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      objectId: objectId || null,
      listId: listId || null,
      recurrence: {
        type,
        weekdays: type === 'weekly' ? [...weekdays].sort((a, b) => a - b) : [],
        dayOfMonth: type === 'monthly' ? dayOfMonth : null,
        date: type === 'once' ? date : null,
      },
      time,
      notes: notes.trim(),
      active: initial?.active ?? true,
      planId: initial?.planId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑日程' : '新建日程'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid}>
            保存
          </Button>
        </>
      }
    >
      <Field label="标题">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：某番更新"
          autoFocus
        />
      </Field>

      <Field label="重复方式">
        <Select value={type} onChange={(e) => setType(e.target.value as RecurrenceType)}>
          <option value="weekly">每周几</option>
          <option value="monthly">每月某日</option>
          <option value="once">单次</option>
        </Select>
      </Field>

      {type === 'weekly' && (
        <Field label="星期">
          <div className={styles.weekdays}>
            {WEEKDAYS.map((label, index) => (
              <button
                key={index}
                type="button"
                className={[styles.day, weekdays.includes(index) ? styles.dayActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => toggleWeekday(index)}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {type === 'monthly' && (
        <Field label="每月几号">
          <Select value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d} 日
              </option>
            ))}
          </Select>
        </Field>
      )}

      {type === 'once' && (
        <Field label="日期">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      )}

      <Field label="时间（可选）">
        <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>

      <Field label="关联对象（可选）">
        <Select value={objectId} onChange={(e) => setObjectId(e.target.value)}>
          <option value="">不关联</option>
          {objects.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="关联清单（可选）">
        <Select value={listId} onChange={(e) => setListId(e.target.value)}>
          <option value="">不关联</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="备注">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="补充说明…" />
      </Field>
    </Modal>
  );
}
