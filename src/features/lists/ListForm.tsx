import { useState } from 'react';
import type { AppList } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, TextArea, TextInput } from '../../components/forms';
import { parseTags, tagsToInput } from '../../utils/format';
import type { ListInput } from '../../store/useStore';
import styles from './ListForm.module.css';

const COVERS = ['📋', '🎒', '⛺', '🥾', '🏔️', '🧰', '🛒', '📦', '🍳', '🎬', '🏕️', '🧳'];

interface ListFormProps {
  open: boolean;
  initial?: AppList | null;
  onClose: () => void;
  onSubmit: (input: ListInput) => void;
}

export function ListForm(props: ListFormProps) {
  if (!props.open) return null;
  return <ListFormBody {...props} />;
}

function ListFormBody({ initial, onClose, onSubmit }: ListFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [cover, setCover] = useState(initial?.cover ?? '📋');
  const [tagsInput, setTagsInput] = useState(initial ? tagsToInput(initial.tags) : '');

  const valid = title.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      cover,
      tags: parseTags(tagsInput),
      sectionIds: initial?.sectionIds ?? [],
      items: initial?.items ?? [],
      planId: initial?.planId ?? null,
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑清单' : '新建清单'}
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
      <Field label="封面">
        <div className={styles.coverGrid}>
          {COVERS.map((c) => (
            <button
              key={c}
              type="button"
              className={[styles.coverBtn, cover === c ? styles.coverActive : ''].join(' ')}
              onClick={() => setCover(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="标题">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：周末徒步装备"
          autoFocus
        />
      </Field>

      <Field label="说明">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="这份清单是做什么的…"
        />
      </Field>

      <Field label="标签" hint="用逗号或空格分隔">
        <TextInput
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例如：户外, 两天一夜"
        />
      </Field>
    </Modal>
  );
}
