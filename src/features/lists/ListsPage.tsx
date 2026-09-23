import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { TagList } from '../../components/Tag';
import { ListForm } from './ListForm';
import styles from './ListsPage.module.css';

export function ListsPage() {
  const lists = useStore((s) => s.lists);
  const addList = useStore((s) => s.addList);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="清单"
        subtitle={`共 ${lists.length} 份清单 · 计划引用时共享同一份，改一处处处生效`}
        actions={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            + 新建清单
          </Button>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          icon="📋"
          title="还没有清单"
          description="清单是对象的展示集合，比如「周末徒步装备」。先创建一份吧。"
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              + 新建清单
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {lists.map((list) => {
            const total = list.items.length;
            const done = list.items.filter((i) => i.checked).length;
            const percent = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <Link key={list.id} to={`/lists/${list.id}`} className={styles.card}>
                <div className={styles.cover}>{list.cover || '📋'}</div>
                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.title}>{list.title}</h3>
                    {list.sectionIds.length > 0 && (
                      <span className={styles.sectionBadge}>{list.sectionIds.length} 分区</span>
                    )}
                  </div>
                  {list.description && <p className={styles.description}>{list.description}</p>}
                  <TagList tags={list.tags} max={3} />
                  <div className={styles.progress}>
                    <div className={styles.bar}>
                      <div className={styles.fill} style={{ width: `${percent}%` }} />
                    </div>
                    <span className={styles.count}>
                      {done}/{total}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ListForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => addList(input)}
      />
    </div>
  );
}
