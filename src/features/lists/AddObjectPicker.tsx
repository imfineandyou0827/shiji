import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TextInput } from '../../components/forms';
import { EmptyState } from '../../components/EmptyState';
import styles from './AddObjectPicker.module.css';

interface AddObjectPickerProps {
  open: boolean;
  excludeIds: string[];
  sectionName?: string;
  onPick: (objectId: string) => void;
  onClose: () => void;
}

export function AddObjectPicker({ open, excludeIds, sectionName, onPick, onClose }: AddObjectPickerProps) {
  if (!open) return null;
  return (
    <AddObjectPickerBody
      excludeIds={excludeIds}
      sectionName={sectionName}
      onPick={onPick}
      onClose={onClose}
    />
  );
}

function AddObjectPickerBody({
  excludeIds,
  sectionName,
  onPick,
  onClose,
}: Omit<AddObjectPickerProps, 'open'>) {
  const objects = useStore((s) => s.objects);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    objects.forEach((o) => o.kind === 'item' && o.category && set.add(o.category));
    return [...set].sort();
  }, [objects]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return objects
      .filter((o) => o.kind === 'item')
      .filter((o) => !excludeIds.includes(o.id))
      .filter((o) => !categoryFilter || o.category === categoryFilter)
      .filter((o) => !q || o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q));
  }, [objects, excludeIds, query, categoryFilter]);

  return (
    <Modal open title={`添加到${sectionName ? `「${sectionName}」` : '未分区'}`} onClose={onClose}>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索对象…"
        autoFocus
      />

      {categories.length > 0 && (
        <div className={styles.chips}>
          <button
            className={[styles.chip, categoryFilter === null ? styles.chipActive : ''].join(' ')}
            onClick={() => setCategoryFilter(null)}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={[styles.chip, categoryFilter === c ? styles.chipActive : ''].join(' ')}
              onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {objects.length === 0 ? (
          <EmptyState
            icon="🧳"
            title="对象库还是空的"
            description="先去对象库创建对象，再回来添加。"
          />
        ) : available.length === 0 ? (
          <p className={styles.muted}>没有可添加的对象。</p>
        ) : (
          available.map((o) => (
            <button key={o.id} className={styles.row} onClick={() => onPick(o.id)}>
              <span className={styles.icon}>
                <Icon value={o.icon} type={o.iconType} size={26} alt={o.name} />
              </span>
              <span className={styles.info}>
                <span className={styles.name}>{o.name}</span>
                {o.category && <span className={styles.category}>{o.category}</span>}
              </span>
              <span className={styles.add}>+</span>
            </button>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          完成
        </Button>
      </div>
    </Modal>
  );
}
