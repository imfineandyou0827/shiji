import { useMemo, useRef, useState } from 'react';
import type { AppObject, CustomField, IconType, ObjectKind } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { Field, Select, TextArea, TextInput } from '../../components/forms';
import { TagList } from '../../components/Tag';
import { parseTags, tagsToInput } from '../../utils/format';
import { useStore } from '../../store/useStore';
import type { ObjectInput } from '../../store/useStore';
import styles from './ObjectForm.module.css';

const EMOJI_CHOICES = [
  '🧳', '🎒', '⛺', '🥾', '🧭', '🔥', '💧', '🍜',
  '📷', '🎬', '📺', '🎧', '📚', '🧴', '🔋', '🧤',
  '🕶️', '🧢', '⛰️', '🚗', '🎮', '🪥', '💊', '🧰',
];

interface ObjectFormProps {
  open: boolean;
  initial?: AppObject | null;
  kind?: ObjectKind;
  defaultCategory?: string;
  defaultMemberIds?: string[];
  onClose: () => void;
  onSubmit: (input: ObjectInput) => void;
}

export function ObjectForm(props: ObjectFormProps) {
  if (!props.open) return null;
  return <ObjectFormBody {...props} />;
}

function ObjectFormBody({
  initial,
  kind = 'item',
  defaultCategory,
  defaultMemberIds,
  onClose,
  onSubmit,
}: ObjectFormProps) {
  const objects = useStore((s) => s.objects);
  const libraryCategories = useStore((s) => s.categories);
  const categories = useMemo(() => {
    const set = new Set(libraryCategories);
    objects.forEach((o) => o.category && set.add(o.category));
    return [...set].sort();
  }, [libraryCategories, objects]);
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? defaultCategory ?? '');
  const [newCategory, setNewCategory] = useState(false);
  const [tagsInput, setTagsInput] = useState(initial ? tagsToInput(initial.tags) : '');
  const [icon, setIcon] = useState(initial?.icon ?? '🧳');
  const [iconType, setIconType] = useState<IconType>(initial?.iconType ?? 'emoji');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [fields, setFields] = useState<CustomField[]>(initial?.fields ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = name.trim().length > 0;

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setIcon(String(reader.result));
      setIconType('image');
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!valid) return;
    onSubmit({
      kind: initial?.kind ?? kind,
      name: name.trim(),
      category: category.trim(),
      tags: parseTags(tagsInput),
      icon,
      iconType,
      notes: notes.trim(),
      fields: fields.filter((f) => f.key.trim()),
      memberIds: initial?.memberIds ?? defaultMemberIds ?? [],
    });
    onClose();
  };

  const updateField = (index: number, patch: Partial<CustomField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return (
    <Modal
      open
      title={
        initial
          ? initial.kind === 'section'
            ? '编辑分区'
            : '编辑对象'
          : kind === 'section'
            ? '新建分区'
            : '新建对象'
      }
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
      <div className={styles.preview}>
        <div className={styles.previewIcon}>
          <Icon value={icon} type={iconType} size={40} />
        </div>
        <div className={styles.previewText}>
          <strong>{name || (kind === 'section' ? '分区名称' : '对象名称')}</strong>
          <span>{category || '未分类'}</span>
        </div>
      </div>

      {kind === 'section' && !initial && (defaultMemberIds?.length ?? 0) > 0 && (
        <p className={styles.memberHint}>
          将自动包含「{category || '未分类'}」分类的 {defaultMemberIds?.length} 个对象。
        </p>
      )}

      <Field label="名称">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：登山杖"
          autoFocus
        />
      </Field>

      <Field label="图标">
        <div className={styles.emojiGrid}>
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              className={[styles.emojiBtn, iconType === 'emoji' && icon === e ? styles.emojiActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setIcon(e);
                setIconType('emoji');
              }}
            >
              {e}
            </button>
          ))}
          <button
            type="button"
            className={styles.emojiBtn}
            onClick={() => fileRef.current?.click()}
            title="上传图片"
          >
            🖼️
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImage(file);
              e.target.value = '';
            }}
          />
        </div>
      </Field>

      <Field label="分类">
        {newCategory ? (
          <div className={styles.newCategory}>
            <TextInput
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="输入新分类名称"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewCategory(false);
                setCategory(initial?.category ?? '');
              }}
            >
              选已有
            </Button>
          </div>
        ) : (
          <Select
            value={category}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setNewCategory(true);
                setCategory('');
              } else {
                setCategory(e.target.value);
              }
            }}
          >
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__new__">＋ 新建分类…</option>
          </Select>
        )}
      </Field>

      <Field label="标签" hint="用逗号或空格分隔">
        <TextInput
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例如：露营, 轻量"
        />
        {parseTags(tagsInput).length > 0 && (
          <div className={styles.tagPreview}>
            <TagList tags={parseTags(tagsInput)} max={8} />
          </div>
        )}
      </Field>

      <Field label="备注">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="补充说明…" />
      </Field>

      <div className={styles.fieldsHeader}>
        <span className={styles.label}>自定义字段</span>
        <Button size="sm" variant="ghost" onClick={() => setFields((p) => [...p, { key: '', value: '' }])}>
          + 添加
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={index} className={styles.fieldRow}>
          <TextInput
            value={field.key}
            onChange={(e) => updateField(index, { key: e.target.value })}
            placeholder="字段名"
          />
          <TextInput
            value={field.value}
            onChange={(e) => updateField(index, { value: e.target.value })}
            placeholder="值"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFields((p) => p.filter((_, i) => i !== index))}
            aria-label="删除字段"
          >
            ×
          </Button>
        </div>
      ))}
    </Modal>
  );
}
