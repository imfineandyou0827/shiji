import { useState } from 'react';
import type { Plan } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, TextInput } from '../../components/forms';
import { parseTags, tagsToInput } from '../../utils/format';
import type { PlanInput } from '../../store/useStore';
import styles from './PlanForm.module.css';

const ICONS = ['🥾', '🏔️', '⛺', '🚴', '🏕️', '🎒', '🗺️', '🚣', '🧗', '🏃', '✈️', '🚗'];

interface PlanFormProps {
  open: boolean;
  initial?: Plan | null;
  onClose: () => void;
  onSubmit: (input: PlanInput) => void;
}

export function PlanForm(props: PlanFormProps) {
  if (!props.open) return null;
  return <PlanFormBody {...props} />;
}

function PlanFormBody({ initial, onClose, onSubmit }: PlanFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🥾');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tagsInput, setTagsInput] = useState(initial ? tagsToInput(initial.tags) : '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');

  const valid = title.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      icon,
      description: description.trim(),
      tags: parseTags(tagsInput),
      startDate: startDate || null,
      endDate: endDate || null,
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑计划' : '新建计划'}
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
            >
              {i}
            </button>
          ))}
        </div>
      </Field>

      <Field label="标题">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：周末武功山徒步"
          autoFocus
        />
      </Field>

      <div className={styles.dateRow}>
        <Field label="开始日期">
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="结束日期">
          <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <Field label="说明">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="这次活动的安排…"
        />
      </Field>

      <Field label="标签" hint="用逗号或空格分隔">
        <TextInput
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例如：两天一夜, 露营"
        />
      </Field>
    </Modal>
  );
}
