import { useState } from 'react';
import type { AppObject } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { TextInput } from '../../components/forms';
import styles from './SectionForm.module.css';

interface SectionFormProps {
  open: boolean;
  excludeIds: string[];
  onClose: () => void;
  onAttach: (objectId: string, memberIds: string[]) => void;
}

export function SectionForm(props: SectionFormProps) {
  if (!props.open) return null;
  return <SectionFormBody {...props} />;
}

function SectionFormBody({ excludeIds, onClose, onAttach }: Omit<SectionFormProps, 'open'>) {
  const objects = useStore((s) => s.objects);
  const reusable = objects.filter((o) => o.kind === 'section' && !excludeIds.includes(o.id));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const section = reusable.find((s) => s.id === selectedId) ?? null;
  const members = section
    ? section.memberIds
        .map((id) => objects.find((o) => o.id === id))
        .filter((o): o is AppObject => o !== undefined)
    : [];

  const choose = (target: AppObject) => {
    setSelectedId(target.id);
    setChecked([...target.memberIds]);
    setQuery('');
  };

  const visibleMembers = members.filter((o) => {
    const q = query.trim().toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q);
  });

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filteredSections = reusable.filter((o) => {
    const q = query.trim().toLowerCase();
    return !q || o.name.toLowerCase().includes(q);
  });

  const attach = () => {
    if (!selectedId) return;
    onAttach(selectedId, checked);
    onClose();
  };

  return (
    <Modal
      open
      title="添加分区"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={attach} disabled={!selectedId}>
            添加分区
          </Button>
        </>
      }
    >
      {reusable.length === 0 ? (
        <p className={styles.empty}>
          还没有分区。请先到「对象库」新建分区，并在分区详情里放入对象，再回来添加。
        </p>
      ) : section ? (
        <>
          <button className={styles.back} onClick={() => setSelectedId(null)}>
            ← 选择其他分区
          </button>
          <p className={styles.chosen}>
            <Icon value={section.icon} type={section.iconType} size={18} alt={section.name} />
            {section.name} · 已选 {checked.length}/{section.memberIds.length}
          </p>
          {members.length > 0 && (
            <div className={styles.selectTools}>
              <button type="button" onClick={() => setChecked(members.map((m) => m.id))}>
                全选
              </button>
              <button
                type="button"
                onClick={() =>
                  setChecked(members.filter((m) => !checked.includes(m.id)).map((m) => m.id))
                }
              >
                反选
              </button>
            </div>
          )}
          {members.length === 0 ? (
            <p className={styles.empty}>该分区还没有对象，可到对象库的分区详情里添加。</p>
          ) : (
            <div className={styles.checklist}>
              {members.length > 6 && (
                <TextInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索对象…"
                  className={styles.search}
                />
              )}
              {visibleMembers.length === 0 ? (
                <p className={styles.empty}>没有匹配的对象。</p>
              ) : (
                visibleMembers.map((o) => {
                  const on = checked.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={[styles.checkRow, on ? styles.checkOn : ''].filter(Boolean).join(' ')}
                      onClick={() => toggle(o.id)}
                    >
                      <span className={styles.checkbox}>{on ? '✓' : ''}</span>
                      <Icon value={o.icon} type={o.iconType} size={20} alt={o.name} />
                      <span className={styles.checkName}>{o.name}</span>
                      {o.category && <span className={styles.checkCat}>{o.category}</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {reusable.length > 6 && (
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索分区…"
              className={styles.search}
            />
          )}
          <div className={styles.reuseList}>
            {filteredSections.map((o) => (
              <button key={o.id} type="button" className={styles.reuseRow} onClick={() => choose(o)}>
                <Icon value={o.icon} type={o.iconType} size={20} alt={o.name} />
                <span>{o.name}</span>
                <span className={styles.reuseCount}>{o.memberIds.length} 项</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
