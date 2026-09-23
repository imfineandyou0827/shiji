import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AppList, AppObject, Difficulty, Schedule, Track } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { TagList } from '../../components/Tag';
import { Icon } from '../../components/Icon';
import { TrackMap } from '../../components/TrackMap';
import { ListForm } from '../lists/ListForm';
import { ScheduleForm } from '../schedules/ScheduleForm';
import { describeRecurrence } from '../../utils/date';
import { countPoints } from '../../utils/gpx';
import { PlanForm } from './PlanForm';
import { TrackForm } from './TrackForm';
import { AttachPicker } from './AttachPicker';
import { ExportDialog } from './ExportDialog';
import styles from './PlanDetailPage.module.css';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  '': '',
  easy: '轻松',
  moderate: '中等',
  hard: '困难',
  expert: '挑战',
};

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return '未设日期';
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? '';
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分钟`;
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`;
}

export function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const lists = useStore((s) => s.lists);
  const schedules = useStore((s) => s.schedules);
  const objects = useStore((s) => s.objects);
  const updatePlan = useStore((s) => s.updatePlan);
  const removePlan = useStore((s) => s.removePlan);
  const detachPlanSchedule = useStore((s) => s.detachPlanSchedule);
  const createPlanSchedule = useStore((s) => s.createPlanSchedule);
  const updateSchedule = useStore((s) => s.updateSchedule);
  const attachPlanList = useStore((s) => s.attachPlanList);
  const detachPlanList = useStore((s) => s.detachPlanList);
  const createPlanList = useStore((s) => s.createPlanList);
  const updateList = useStore((s) => s.updateList);
  const updateListItem = useStore((s) => s.updateListItem);
  const addTrack = useStore((s) => s.addTrack);
  const updateTrack = useStore((s) => s.updateTrack);
  const removeTrack = useStore((s) => s.removeTrack);

  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [listFormOpen, setListFormOpen] = useState(false);
  const [attachListOpen, setAttachListOpen] = useState(false);
  const [trackFormOpen, setTrackFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingList, setEditingList] = useState<AppList | null>(null);
  const [expandedLists, setExpandedLists] = useState<string[]>([]);

  const scheduleMap = useMemo(() => new Map(schedules.map((s) => [s.id, s])), [schedules]);
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const objectMap = useMemo(() => new Map(objects.map((o) => [o.id, o])), [objects]);

  const toggleList = (listId: string) =>
    setExpandedLists((prev) =>
      prev.includes(listId) ? prev.filter((x) => x !== listId) : [...prev, listId],
    );

  if (!plan) {
    return (
      <EmptyState
        icon="🚫"
        title="计划不存在"
        description="它可能已被删除。"
        action={
          <Button variant="primary" onClick={() => navigate('/plans')}>
            返回计划
          </Button>
        }
      />
    );
  }

  const planSchedules = plan.scheduleIds
    .map((sid) => scheduleMap.get(sid))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  const planLists = plan.listIds
    .map((lid) => listMap.get(lid))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);
  const otherLists = lists.filter((l) => !plan.listIds.includes(l.id));

  const handleDelete = () => {
    if (window.confirm(`确定删除计划「${plan.title}」？引用的日程和清单不会被删除。`)) {
      removePlan(plan.id);
      navigate('/plans');
    }
  };

  const openTrackForm = (track: Track | null) => {
    setEditingTrack(track);
    setTrackFormOpen(true);
  };

  return (
    <div>
      <Link to="/plans" className={styles.back}>
        ← 计划
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroIcon}>{plan.icon}</div>
        <div className={styles.heroBody}>
          <h1 className={styles.title}>{plan.title}</h1>
          <span className={styles.dates}>{formatRange(plan.startDate, plan.endDate)}</span>
          {plan.description && <p className={styles.description}>{plan.description}</p>}
          {plan.tags.length > 0 && <TagList tags={plan.tags} max={10} />}
        </div>
        <div className={styles.heroActions}>
          <Button variant="primary" onClick={() => setExportOpen(true)}>
            导出
          </Button>
          <Button onClick={() => setEditOpen(true)}>编辑</Button>
          <Button variant="danger" onClick={handleDelete}>
            删除
          </Button>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>日程（{planSchedules.length}）</h2>
          <div className={styles.sectionActions}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingSchedule(null);
                setScheduleFormOpen(true);
              }}
            >
              + 新建日程
            </Button>
          </div>
        </div>
        {planSchedules.length === 0 ? (
          <p className={styles.muted}>还没有日程。在这里新建后，会自动出现在「日程」页。</p>
        ) : (
          <div className={styles.rows}>
            {planSchedules.map((s) => (
              <div key={s.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>
                    <strong>{s.title}</strong>
                    {s.time && <span className={styles.chip}>{s.time}</span>}
                  </div>
                  <span className={styles.rowSub}>
                    {describeRecurrence({ recurrence: s.recurrence })}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button
                    className={styles.rowEdit}
                    onClick={() => {
                      setEditingSchedule(s);
                      setScheduleFormOpen(true);
                    }}
                  >
                    编辑
                  </button>
                  <button
                    className={styles.detach}
                    onClick={() => detachPlanSchedule(plan.id, s.id)}
                    aria-label="从计划移除"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>清单（{planLists.length}）</h2>
          <div className={styles.sectionActions}>
            <Button size="sm" onClick={() => setAttachListOpen(true)}>
              引用已有清单
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingList(null);
                setListFormOpen(true);
              }}
            >
              + 新建清单
            </Button>
          </div>
        </div>
        {planLists.length === 0 ? (
          <p className={styles.muted}>还没有清单。可以引用已有清单，或为这个计划新建。</p>
        ) : (
          <div className={styles.rows}>
            {planLists.map((l) => {
              const expanded = expandedLists.includes(l.id);
              const sections = l.sectionIds
                .map((sid) => objectMap.get(sid))
                .filter((o): o is AppObject => o !== undefined);
              const unsectioned = l.items.filter(
                (i) => !i.sectionId || !l.sectionIds.includes(i.sectionId),
              );
              const renderItem = (item: AppList['items'][number]) => {
                const obj = objectMap.get(item.objectId);
                return (
                  <div key={item.id} className={styles.previewItem}>
                    <button
                      className={[styles.previewCheck, item.checked ? styles.previewChecked : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => updateListItem(l.id, item.id, { checked: !item.checked })}
                      aria-label={item.checked ? '标记为未备好' : '标记为已备好'}
                    >
                      {item.checked ? '✓' : ''}
                    </button>
                    {obj && <Icon value={obj.icon} type={obj.iconType} size={16} alt={obj.name} />}
                    <span
                      className={[styles.previewName, item.checked ? styles.previewDone : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {obj ? obj.name : '（对象已删除）'}
                    </span>
                    {item.quantity > 1 && (
                      <span className={styles.previewQty}>×{item.quantity}</span>
                    )}
                    {item.note && <span className={styles.previewNote}>{item.note}</span>}
                  </div>
                );
              };
              return (
                <div key={l.id} className={styles.listBlock}>
                  <div className={[styles.row, expanded ? styles.rowExpanded : ''].join(' ')}>
                    <button
                      className={styles.expand}
                      onClick={() => toggleList(l.id)}
                      aria-label={expanded ? '收起清单' : '展开清单'}
                      aria-expanded={expanded}
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                    <span className={styles.rowIcon}>{l.cover || '📋'}</span>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>
                        <Link to={`/lists/${l.id}`} className={styles.rowLink}>
                          <strong>{l.title}</strong>
                        </Link>
                      </div>
                      <span className={styles.rowSub}>
                        {l.items.length} 项
                        {sections.length > 0 ? ` · ${sections.length} 分区` : ''}
                      </span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.rowEdit}
                        onClick={() => {
                          setEditingList(l);
                          setListFormOpen(true);
                        }}
                      >
                        编辑
                      </button>
                      <button
                        className={styles.detach}
                        onClick={() => detachPlanList(plan.id, l.id)}
                        aria-label="从计划移除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div className={styles.listPreview}>
                      {l.items.length === 0 ? (
                        <p className={styles.previewEmpty}>清单为空</p>
                      ) : (
                        <>
                          {sections.map((section) => {
                            const items = l.items.filter((i) => i.sectionId === section.id);
                            return (
                              <div key={section.id} className={styles.previewSection}>
                                <div className={styles.previewHeading}>
                                  <Icon
                                    value={section.icon}
                                    type={section.iconType}
                                    size={15}
                                    alt={section.name}
                                  />
                                  {section.name}
                                </div>
                                {items.length === 0 ? (
                                  <p className={styles.previewEmpty}>无</p>
                                ) : (
                                  items.map(renderItem)
                                )}
                              </div>
                            );
                          })}
                          {unsectioned.length > 0 && (
                            <div className={styles.previewSection}>
                              <div className={styles.previewHeading}>未分区</div>
                              {unsectioned.map(renderItem)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>轨迹（{plan.tracks.length}）</h2>
          <div className={styles.sectionActions}>
            <Button size="sm" variant="primary" onClick={() => openTrackForm(null)}>
              + 添加轨迹
            </Button>
          </div>
        </div>
        {plan.tracks.length === 0 ? (
          <p className={styles.muted}>还没有轨迹。添加链接、距离爬升，或粘贴 GPX 生成预览。</p>
        ) : (
          <div className={styles.tracks}>
            {plan.tracks.map((track) => (
              <div key={track.id} className={styles.track}>
                <div className={styles.trackHead}>
                  <strong className={styles.trackName}>{track.name}</strong>
                  <div className={styles.trackTools}>
                    <Button size="sm" variant="ghost" onClick={() => openTrackForm(track)}>
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`删除轨迹「${track.name}」？`)) removeTrack(plan.id, track.id);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
                <div className={styles.stats}>
                  {track.distanceKm !== null && <span>距离 {track.distanceKm} km</span>}
                  {track.elevationGainM !== null && <span>爬升 {track.elevationGainM} m</span>}
                  {track.difficulty && <span>难度 {DIFFICULTY_LABEL[track.difficulty]}</span>}
                  {track.durationMin !== null && <span>时长 {formatDuration(track.durationMin)}</span>}
                </div>
                {countPoints(track.segments) > 1 && (
                  <div className={styles.trackPreview}>
                    <TrackMap segments={track.segments} base={track.baseLayer} />
                  </div>
                )}
                {track.link && (
                  <a
                    className={styles.trackLink}
                    href={track.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    🔗 查看轨迹
                  </a>
                )}
                {track.notes && <p className={styles.trackNotes}>{track.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <PlanForm
        open={editOpen}
        initial={plan}
        onClose={() => setEditOpen(false)}
        onSubmit={(input) => updatePlan(plan.id, input)}
      />

      <ExportDialog open={exportOpen} plan={plan} onClose={() => setExportOpen(false)} />

      <ScheduleForm
        open={scheduleFormOpen}
        initial={editingSchedule}
        onClose={() => setScheduleFormOpen(false)}
        onSubmit={(input) => {
          if (editingSchedule) updateSchedule(editingSchedule.id, input);
          else createPlanSchedule(plan.id, input);
        }}
      />

      <ListForm
        open={listFormOpen}
        initial={editingList}
        onClose={() => setListFormOpen(false)}
        onSubmit={(input) => {
          if (editingList) updateList(editingList.id, input);
          else createPlanList(plan.id, input);
        }}
      />

      <AttachPicker
        open={attachListOpen}
        title="引用已有清单"
        emptyHint="没有可引用的清单，先去「清单」页新建一个。"
        items={otherLists.map((l) => ({
          id: l.id,
          label: l.title,
          sub: `${l.items.length} 项`,
          icon: l.cover || '📋',
        }))}
        onPick={(lid) => attachPlanList(plan.id, lid)}
        onClose={() => setAttachListOpen(false)}
      />

      <TrackForm
        open={trackFormOpen}
        initial={editingTrack}
        onClose={() => setTrackFormOpen(false)}
        onSubmit={(input) => {
          if (editingTrack) updateTrack(plan.id, editingTrack.id, input);
          else addTrack(plan.id, input);
        }}
      />
    </div>
  );
}
