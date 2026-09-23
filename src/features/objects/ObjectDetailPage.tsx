import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AppObject } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TagList } from '../../components/Tag';
import { EmptyState } from '../../components/EmptyState';
import { AddObjectPicker } from '../lists/AddObjectPicker';
import { ObjectForm } from './ObjectForm';
import styles from './ObjectDetailPage.module.css';

export function ObjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const object = useStore((s) => s.objects.find((o) => o.id === id));
  const objects = useStore((s) => s.objects);
  const lists = useStore((s) => s.lists);
  const schedules = useStore((s) => s.schedules);
  const updateObject = useStore((s) => s.updateObject);
  const removeObject = useStore((s) => s.removeObject);
  const addSectionMember = useStore((s) => s.addSectionMember);
  const removeSectionMember = useStore((s) => s.removeSectionMember);
  const moveSectionMember = useStore((s) => s.moveSectionMember);
  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const objectMap = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  if (!object) {
    return (
      <EmptyState
        icon="🚫"
        title="对象不存在"
        description="它可能已被删除。"
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            返回对象库
          </Button>
        }
      />
    );
  }

  const usedInLists = lists.filter(
    (l) => l.items.some((i) => i.objectId === object.id) || l.sectionIds.includes(object.id),
  );
  const usedInSchedules = schedules.filter((s) => s.objectId === object.id);
  const members = object.memberIds
    .map((mid) => objectMap.get(mid))
    .filter((o): o is AppObject => o !== undefined);

  const handleDelete = () => {
    if (window.confirm(`确定删除「${object.name}」？它会同时从所有清单中移除。`)) {
      removeObject(object.id);
      navigate('/');
    }
  };

  return (
    <div>
      <Link to="/" className={styles.back}>
        ← 对象库
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <Icon value={object.icon} type={object.iconType} size={56} alt={object.name} />
        </div>
        <div className={styles.heroBody}>
          <h1 className={styles.name}>
            {object.name}
            {object.kind === 'section' && <span className={styles.badge}>分区</span>}
          </h1>
          {object.category && <span className={styles.category}>{object.category}</span>}
          {object.tags.length > 0 && <TagList tags={object.tags} max={10} />}
        </div>
        <div className={styles.heroActions}>
          <Button onClick={() => setEditOpen(true)}>编辑</Button>
          <Button variant="danger" onClick={handleDelete}>
            删除
          </Button>
        </div>
      </div>

      {object.kind === 'section' && (
        <section className={styles.section}>
          <div className={styles.membersHeader}>
            <h2 className={styles.sectionTitle}>分区对象（{members.length}）</h2>
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              + 添加对象
            </Button>
          </div>
          {members.length === 0 ? (
            <p className={styles.muted}>
              这个分区还没有对象。添加后，复用到清单时会一起带入。
            </p>
          ) : (
            <div className={styles.members}>
              {members.map((m, i) => (
                <div key={m.id} className={styles.memberRow}>
                  <Icon value={m.icon} type={m.iconType} size={24} alt={m.name} />
                  <Link to={`/objects/${m.id}`} className={styles.memberName}>
                    {m.name}
                  </Link>
                  {m.category && <span className={styles.memberCat}>{m.category}</span>}
                  <div className={styles.memberTools}>
                    <button
                      onClick={() => moveSectionMember(object.id, m.id, -1)}
                      disabled={i === 0}
                      aria-label="上移"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSectionMember(object.id, m.id, 1)}
                      disabled={i === members.length - 1}
                      aria-label="下移"
                    >
                      ↓
                    </button>
                    <button
                      className={styles.memberRemove}
                      onClick={() => removeSectionMember(object.id, m.id)}
                      aria-label="移出分区"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {object.notes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>备注</h2>
          <p className={styles.notes}>{object.notes}</p>
        </section>
      )}

      {object.fields.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>详情</h2>
          <dl className={styles.fields}>
            {object.fields.map((f, i) => (
              <div key={i} className={styles.fieldRow}>
                <dt>{f.key}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>被引用</h2>
        {usedInLists.length === 0 && usedInSchedules.length === 0 ? (
          <p className={styles.muted}>还没有清单或日程使用这个对象。</p>
        ) : (
          <div className={styles.refs}>
            {usedInLists.map((l) => (
              <Link key={l.id} to={`/lists/${l.id}`} className={styles.ref}>
                📋 {l.title}
              </Link>
            ))}
            {usedInSchedules.map((s) => (
              <Link key={s.id} to="/schedules" className={styles.ref}>
                🗓️ {s.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <ObjectForm
        open={editOpen}
        initial={object}
        onClose={() => setEditOpen(false)}
        onSubmit={(input) => updateObject(object.id, input)}
      />

      <AddObjectPicker
        open={pickerOpen}
        excludeIds={object.memberIds}
        sectionName={object.name}
        onPick={(objectId) => addSectionMember(object.id, objectId)}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
