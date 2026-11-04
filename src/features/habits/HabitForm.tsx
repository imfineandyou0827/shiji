import { useState } from 'react';
import type { Habit } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, TextInput } from '../../components/forms';
import type { HabitInput } from '../../store/useStore';
import styles from './HabitForm.module.css';

const ICONS = [
  '🌱', '💪', '🏃', '📚', '🧘', '💧', '✍️', '🌙',
  '🥗', '🚭', '🎯', '🎨', '🎸', '🦷', '☀️', '🧹',
];

interface HabitFormProps {
  open: boolean;
  initial?: Habit | null;
  onClose: () => void;
  onSubmit: (input: HabitInput) => void;
}

export function HabitForm(props: HabitFormProps) {
  if (!props.open) return null;
  return <HabitFormBody {...props} />;
}

function HabitFormBody({ initial, onClose, onSubmit }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🌱');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const valid = title.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      icon,
      notes: notes.trim(),
      checkins: initial?.checkins ?? [],
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑坚持目标' : '新建坚持目标'}
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
      <Field label="图标">
        <div className={styles.iconGrid}>
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={[styles.iconBtn, icon === i ? styles.iconActive : ''].join(' ')}
              onClick={() => setIcon(i)}
              aria-label={`选择图标 ${i}`}
              aria-pressed={icon === i}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>

      <Field label="目标" hint="每天打卡一次，累计 21 天即完成；中断不会清零。">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：每天阅读 20 分钟"
        />
      </Field>

      <Field label="备注">
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="给自己一个坚持的理由，或写下完成后的奖励…"
        />
      </Field>
    </Modal>
  );
}
