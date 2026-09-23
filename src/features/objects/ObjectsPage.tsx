import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { TextInput } from '../../components/forms';
import { ObjectCard } from './ObjectCard';
import { ObjectForm } from './ObjectForm';
import { CategoryManager } from './CategoryManager';
import styles from './ObjectsPage.module.css';

export function ObjectsPage() {
  const objects = useStore((s) => s.objects);
  const addObject = useStore((s) => s.addObject);
  const libraryCategories = useStore((s) => s.categories);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<'all' | 'item' | 'section'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formKind, setFormKind] = useState<'item' | 'section'>('item');
  const [managerOpen, setManagerOpen] = useState(false);

  const openForm = (kind: 'item' | 'section') => {
    setFormKind(kind);
    setFormOpen(true);
  };

  const categories = useMemo(() => {
    const set = new Set<string>(libraryCategories);
    objects.forEach((o) => o.category && set.add(o.category));
    return [...set].sort();
  }, [libraryCategories, objects]);

  const sectionCount = useMemo(
    () => objects.filter((o) => o.kind === 'section').length,
    [objects],
  );

  const categoryMemberIds = useMemo(
    () =>
      category
        ? objects.filter((o) => o.kind === 'item' && o.category === category).map((o) => o.id)
        : [],
    [objects, category],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return objects.filter((o) => {
      if (kindFilter !== 'all' && o.kind !== kindFilter) return false;
      if (category && o.category !== category) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [objects, query, category, kindFilter]);

  return (
    <div>
      <PageHeader
        title="对象库"
        subtitle={`共 ${objects.length - sectionCount} 个对象 · ${sectionCount} 个分区`}
        actions={
          <>
            <Button onClick={() => openForm('section')}>+ 新建分区</Button>
            <Button variant="primary" onClick={() => openForm('item')}>
              + 新建对象
            </Button>
          </>
        }
      />

      <div className={styles.toolbar}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索名称、分类或标签…"
        />
      </div>

      <div className={styles.kindBar}>
        {(
          [
            ['all', '全部'],
            ['item', '对象'],
            ['section', '分区'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={[styles.kindBtn, kindFilter === value ? styles.kindActive : ''].join(' ')}
            onClick={() => setKindFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.chips}>
        <button
          className={[styles.chip, category === null ? styles.chipActive : ''].join(' ')}
          onClick={() => setCategory(null)}
        >
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={[styles.chip, category === c ? styles.chipActive : ''].join(' ')}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        <button className={styles.manageChip} onClick={() => setManagerOpen(true)}>
          ＋ 分类库
        </button>
      </div>

      {objects.length === 0 ? (
        <EmptyState
          icon="🧳"
          title="还没有对象"
          description="先创建一个对象，比如「登山杖」「某部番剧」，之后就能放进清单和日程里。也可以建「分区」来归类对象。"
          action={
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={() => openForm('item')}>
                + 新建对象
              </Button>
              <Button onClick={() => openForm('section')}>+ 新建分区</Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="没有匹配的对象" description="换个关键词或分类试试。" />
      ) : (
        <div className={styles.grid}>
          {filtered.map((o) => (
            <ObjectCard key={o.id} object={o} />
          ))}
        </div>
      )}

      <ObjectForm
        open={formOpen}
        kind={formKind}
        defaultCategory={category ?? ''}
        defaultMemberIds={formKind === 'section' ? categoryMemberIds : []}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => addObject(input)}
      />

      <CategoryManager open={managerOpen} onClose={() => setManagerOpen(false)} />
    </div>
  );
}
