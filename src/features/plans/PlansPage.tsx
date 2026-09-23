import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { TagList } from '../../components/Tag';
import { PlanForm } from './PlanForm';
import styles from './PlansPage.module.css';

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return '未设日期';
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? '';
}

export function PlansPage() {
  const plans = useStore((s) => s.plans);
  const addPlan = useStore((s) => s.addPlan);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="计划"
        subtitle={`共 ${plans.length} 个计划 · 把日程、清单、轨迹聚合到一次活动里`}
        actions={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            + 新建计划
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon="🥾"
          title="还没有计划"
          description="创建一个计划，比如「周末武功山徒步」，然后挂上日程、清单和轨迹。"
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              + 新建计划
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <Link key={plan.id} to={`/plans/${plan.id}`} className={styles.card}>
              <div className={styles.cover}>{plan.icon}</div>
              <div className={styles.body}>
                <h3 className={styles.title}>{plan.title}</h3>
                <span className={styles.dates}>{formatRange(plan.startDate, plan.endDate)}</span>
                {plan.description && <p className={styles.description}>{plan.description}</p>}
                <TagList tags={plan.tags} max={3} />
                <div className={styles.counts}>
                  <span>🗓️ {plan.scheduleIds.length}</span>
                  <span>📋 {plan.listIds.length}</span>
                  <span>🗺️ {plan.tracks.length}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <PlanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => addPlan(input)}
      />
    </div>
  );
}
