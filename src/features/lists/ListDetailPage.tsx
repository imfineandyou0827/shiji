import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AppObject } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { TagList } from '../../components/Tag';
import { Icon } from '../../components/Icon';
import { ListForm } from './ListForm';
import { AddObjectPicker } from './AddObjectPicker';
import { SectionForm } from './SectionForm';
import { ListItemCard } from './ListItemCard';
import styles from './ListDetailPage.module.css';

export function ListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const list = useStore((s) => s.lists.find((l) => l.id === id));
  const objects = useStore((s) => s.objects);
  const plans = useStore((s) => s.plans);
  const updateList = useStore((s) => s.updateList);
  const removeList = useStore((s) => s.removeList);
  const addListItem = useStore((s) => s.addListItem);
  const attachSection = useStore((s) => s.attachSection);
  const removeSection = useStore((s) => s.removeSection);
  const moveSection = useStore((s) => s.moveSection);
  const [editOpen, setEditOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<string | null | undefined>(undefined);

  if (!list) {
    return (
      <EmptyState
        icon="🚫"
        title="清单不存在"
        description="它可能已被删除。"
        action={
          <Button variant="primary" onClick={() => navigate('/lists')}>
            返回清单
          </Button>
        }
      />
    );
  }

  const objectMap = new Map(objects.map((o) => [o.id, o]));
  const referencingPlans = plans.filter((p) => p.listIds.includes(list.id));
  const sectionIdSet = new Set(list.sectionIds);
  const sections = list.sectionIds
    .map((sid) => objectMap.get(sid))
    .filter((o): o is AppObject => o !== undefined);
  const unsectioned = list.items.filter((i) => !i.sectionId || !sectionIdSet.has(i.sectionId));
  const total = list.items.length;
  const done = list.items.filter((i) => i.checked).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const handleDelete = () => {
    if (window.confirm(`确定删除清单「${list.title}」？对象和分区本身不会被删除。`)) {
      removeList(list.id);
      navigate('/lists');
    }
  };

  const renderItems = (items: typeof list.items) => (
    <div className={styles.items}>
      {items.map((item, i) => (
        <ListItemCard
          key={item.id}
          listId={list.id}
          item={item}
          object={objectMap.get(item.objectId)}
          sections={sections}
          index={i}
          total={items.length}
        />
      ))}
    </div>
  );

  return (
    <div>
      <Link to="/lists" className={styles.back}>
        ← 清单
      </Link>

      <div className={styles.hero}>
        <div className={styles.cover}>{list.cover || '📋'}</div>
        <div className={styles.heroBody}>
          <h1 className={styles.title}>{list.title}</h1>
          {list.description && <p className={styles.description}>{list.description}</p>}
          {referencingPlans.length > 0 && (
            <div className={styles.planLinks}>
              {referencingPlans.map((p) => (
                <Link key={p.id} to={`/plans/${p.id}`} className={styles.planLink}>
                  {p.icon} 被计划「{p.title}」引用
                </Link>
              ))}
            </div>
          )}
          {list.tags.length > 0 && <TagList tags={list.tags} max={10} />}
        </div>
        <div className={styles.heroActions}>
          <Button onClick={() => setEditOpen(true)}>编辑</Button>
          <Button variant="danger" onClick={handleDelete}>
            删除
          </Button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.summaryText}>
          已备好 {done} / {total}
        </span>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => setSectionOpen(true)}>+ 添加分区</Button>
      </div>

      {total === 0 && sections.length === 0 ? (
        <EmptyState
          icon="📦"
          title="清单还是空的"
          description="分区在「对象库」里新建并放入对象，然后在这里点「添加分区」选用；也可以直接添加对象，会进入「未分区」。"
          action={
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={() => setPickerSection(null)}>
                + 添加对象
              </Button>
              <Button onClick={() => setSectionOpen(true)}>+ 添加分区</Button>
            </div>
          }
        />
      ) : (
        <>
          {sections.map((section) => {
            const items = list.items.filter((i) => i.sectionId === section.id);
            const sIndex = list.sectionIds.indexOf(section.id);
            return (
              <section key={section.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Link to={`/objects/${section.id}`} className={styles.sectionTitle}>
                    <Icon value={section.icon} type={section.iconType} size={20} alt={section.name} />
                    <span>{section.name}</span>
                  </Link>
                  <span className={styles.sectionCount}>{items.length}</span>
                  <div className={styles.sectionTools}>
                    <button className={styles.addObj} onClick={() => setPickerSection(section.id)}>
                      + 添加对象
                    </button>
                    <button
                      onClick={() => moveSection(list.id, section.id, -1)}
                      disabled={sIndex === 0}
                      aria-label="分区上移"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(list.id, section.id, 1)}
                      disabled={sIndex === list.sectionIds.length - 1}
                      aria-label="分区下移"
                    >
                      ↓
                    </button>
                    <button
                      className={styles.sectionRemove}
                      onClick={() => {
                        if (window.confirm(`从清单移除分区「${section.name}」？分区对象仍保留在对象库。`))
                          removeSection(list.id, section.id);
                      }}
                      aria-label="移除分区"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <p className={styles.sectionEmpty}>暂无条目，点「+ 添加对象」放入这个分区。</p>
                ) : (
                  renderItems(items)
                )}
              </section>
            );
          })}

          {(sections.length === 0 || unsectioned.length > 0) && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>未分区</span>
                <span className={styles.sectionCount}>{unsectioned.length}</span>
                <div className={styles.sectionTools}>
                  <button className={styles.addObj} onClick={() => setPickerSection(null)}>
                    + 添加对象
                  </button>
                </div>
              </div>
              {unsectioned.length === 0 ? (
                <p className={styles.sectionEmpty}>暂无条目。</p>
              ) : (
                renderItems(unsectioned)
              )}
            </section>
          )}
        </>
      )}

      <ListForm
        open={editOpen}
        initial={list}
        onClose={() => setEditOpen(false)}
        onSubmit={(input) => updateList(list.id, input)}
      />

      <AddObjectPicker
        open={pickerSection !== undefined}
        excludeIds={list.items.map((i) => i.objectId)}
        sectionName={pickerSection ? objectMap.get(pickerSection)?.name : undefined}
        onPick={(objectId) => addListItem(list.id, objectId, pickerSection ?? null)}
        onClose={() => setPickerSection(undefined)}
      />

      <SectionForm
        open={sectionOpen}
        excludeIds={list.sectionIds}
        onClose={() => setSectionOpen(false)}
        onAttach={(objectId, memberIds) => attachSection(list.id, objectId, memberIds)}
      />
    </div>
  );
}
