import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TextInput } from '../../components/forms';
import styles from './CategoryManager.module.css';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryManager(props: CategoryManagerProps) {
  if (!props.open) return null;
  return <CategoryManagerBody {...props} />;
}

function CategoryManagerBody({ onClose }: Omit<CategoryManagerProps, 'open'>) {
  const categories = useStore((s) => s.categories);
  const objects = useStore((s) => s.objects);
  const addCategory = useStore((s) => s.addCategory);
  const renameCategory = useStore((s) => s.renameCategory);
  const removeCategory = useStore((s) => s.removeCategory);

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ old: string; value: string } | null>(null);

  const countOf = (name: string) => objects.filter((o) => o.category === name).length;

  const add = () => {
    const value = newName.trim();
    if (!value) return;
    addCategory(value);
    setNewName('');
  };

  const saveRename = () => {
    if (!editing) return;
    renameCategory(editing.old, editing.value);
    setEditing(null);
  };

  return (
    <Modal
      open
      title="分类库"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          完成
        </Button>
      }
    >
      <div className={styles.addRow}>
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
          placeholder="新增分类名称"
        />
        <Button variant="primary" onClick={add} disabled={!newName.trim()}>
          添加
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className={styles.empty}>还没有分类。添加后，新建对象时可直接下拉选择。</p>
      ) : (
        <div className={styles.list}>
          {categories.map((c) => (
            <div key={c} className={styles.row}>
              {editing?.old === c ? (
                <>
                  <TextInput
                    value={editing.value}
                    onChange={(e) => setEditing({ old: c, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="primary" onClick={saveRename}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <span className={styles.name}>{c}</span>
                  <span className={styles.count}>{countOf(c)} 个对象</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ old: c, value: c })}>
                    重命名
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (
                        window.confirm(
                          `删除分类「${c}」？对象本身不会删除，只是该分类从库中移除。`,
                        )
                      )
                        removeCategory(c);
                    }}
                  >
                    删除
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
