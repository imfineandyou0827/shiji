import { useState } from 'react';
import type { Habit, HabitResource } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, TextInput } from '../../components/forms';
import type { HabitInput } from '../../store/useStore';
import { normalizeWebUrl } from '../../utils/format';
import { createId } from '../../utils/id';
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
  const [resources, setResources] = useState<HabitResource[]>(
    initial?.resources.map((r) => ({ ...r })) ?? [],
  );

  const resourceIssue = resources.some((r) => {
    const url = r.url.trim();
    if (!url) return r.title.trim().length > 0;
    return normalizeWebUrl(url) === '';
  });
  const valid = title.trim().length > 0 && !resourceIssue;

  const addResource = () =>
    setResources((prev) => [...prev, { id: createId(), title: '', url: '' }]);

  const updateResource = (id: string, patch: Partial<HabitResource>) =>
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeResource = (id: string) =>
    setResources((prev) => prev.filter((r) => r.id !== id));

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      icon,
      notes: notes.trim(),
      checkins: initial?.checkins ?? [],
      resources: resources
        .map((r) => ({
          ...r,
          title: r.title.trim(),
          url: normalizeWebUrl(r.url),
        }))
        .filter((r) => r.url),
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

      <div className={styles.resources}>
        <div className={styles.resourcesHead}>
          <span className={styles.resourcesLabel}>练习素材（选填）</span>
          <Button size="sm" variant="ghost" onClick={addResource}>
            + 添加素材
          </Button>
        </div>
        <p className={styles.resourcesHint}>
          可以放跟练视频、口播示范或练习文章；早睡这类简单打卡不需要添加。
        </p>
        {resources.length > 0 && (
          <div className={styles.resourceList}>
            {resources.map((resource, index) => (
              <div key={resource.id} className={styles.resourceRow}>
                <TextInput
                  className={styles.resourceTitle}
                  value={resource.title}
                  onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                  placeholder="标题（选填）"
                  aria-label={`素材 ${index + 1} 标题`}
                />
                <TextInput
                  className={styles.resourceUrl}
                  value={resource.url}
                  onChange={(e) => updateResource(resource.id, { url: e.target.value })}
                  placeholder="https://…"
                  inputMode="url"
                  aria-label={`素材 ${index + 1} 链接`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeResource(resource.id)}
                  aria-label={`删除素材 ${index + 1}`}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
        {resourceIssue && (
          <p className={styles.resourceError} role="alert">
            每条素材需要有链接（标题可选），仅支持 http/https 地址。
          </p>
        )}
      </div>

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
