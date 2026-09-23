import type { AppList, AppObject, Difficulty, Plan, Schedule, Track } from '../types';
import { describeRecurrence } from './date';
import { trackSvg } from './trackSvg';

export interface ExportContext {
  objects: AppObject[];
  lists: AppList[];
  schedules: Schedule[];
}

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

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Resolved {
  schedules: Schedule[];
  lists: AppList[];
  tracks: Track[];
  objectById: Map<string, AppObject>;
}

function resolve(plan: Plan, ctx: ExportContext): Resolved {
  const objectById = new Map(ctx.objects.map((o) => [o.id, o]));
  return {
    schedules: plan.scheduleIds
      .map((id) => ctx.schedules.find((s) => s.id === id))
      .filter((s): s is Schedule => s !== undefined),
    lists: plan.listIds
      .map((id) => ctx.lists.find((l) => l.id === id))
      .filter((l): l is AppList => l !== undefined),
    tracks: plan.tracks,
    objectById,
  };
}

export function planToMarkdown(plan: Plan, ctx: ExportContext): string {
  const { schedules, lists, tracks, objectById } = resolve(plan, ctx);
  const lines: string[] = [];

  lines.push(`# ${plan.icon} ${plan.title}`, '');
  lines.push(`- 日期：${formatRange(plan.startDate, plan.endDate)}`);
  if (plan.tags.length > 0) lines.push(`- 标签：${plan.tags.join('、')}`);
  lines.push('');
  if (plan.description) lines.push(plan.description, '');

  lines.push('## 日程', '');
  if (schedules.length === 0) {
    lines.push('_无_', '');
  } else {
    for (const s of schedules) {
      const parts = [describeRecurrence({ recurrence: s.recurrence })];
      if (s.time) parts.push(s.time);
      lines.push(`- **${s.title}** — ${parts.join(' · ')}`);
      if (s.notes) lines.push(`  - ${s.notes.replace(/\n/g, ' ')}`);
    }
    lines.push('');
  }

  for (const list of lists) {
    lines.push(`## 清单：${list.title}`, '');
    if (list.description) lines.push(list.description, '');
    const sections = list.sectionIds
      .map((id) => objectById.get(id))
      .filter((o): o is AppObject => o !== undefined);
    const renderItem = (objectId: string, quantity: number, checked: boolean, note: string) => {
      const o = objectById.get(objectId);
      const name = o ? o.name : '（对象已删除）';
      const qty = quantity > 1 ? ` ×${quantity}` : '';
      const noteText = note ? ` — ${note}` : '';
      return `- [${checked ? 'x' : ' '}] ${name}${qty}${noteText}`;
    };
    for (const section of sections) {
      const items = list.items.filter((i) => i.sectionId === section.id);
      lines.push(`### ${section.icon} ${section.name}`);
      if (items.length === 0) lines.push('_无_');
      else items.forEach((i) => lines.push(renderItem(i.objectId, i.quantity, i.checked, i.note)));
      lines.push('');
    }
    const unsectioned = list.items.filter(
      (i) => !i.sectionId || !list.sectionIds.includes(i.sectionId),
    );
    if (unsectioned.length > 0) {
      lines.push('### 未分区');
      unsectioned.forEach((i) =>
        lines.push(renderItem(i.objectId, i.quantity, i.checked, i.note)),
      );
      lines.push('');
    }
  }

  lines.push('## 轨迹', '');
  if (tracks.length === 0) {
    lines.push('_无_');
  } else {
    for (const t of tracks) {
      lines.push(`### ${t.name}`, '');
      const stats: string[] = [];
      if (t.distanceKm !== null) stats.push(`距离：${t.distanceKm} km`);
      if (t.elevationGainM !== null) stats.push(`累计爬升：${t.elevationGainM} m`);
      if (t.difficulty) stats.push(`难度：${DIFFICULTY_LABEL[t.difficulty]}`);
      if (t.durationMin !== null) stats.push(`预计时长：${formatDuration(t.durationMin)}`);
      if (stats.length > 0) lines.push(`- ${stats.join(' · ')}`);
      if (t.link) lines.push(`- 链接：${t.link}`);
      if (t.notes) lines.push('', t.notes);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function planToHtml(plan: Plan, ctx: ExportContext): string {
  const { schedules, lists, tracks, objectById } = resolve(plan, ctx);

  const scheduleHtml =
    schedules.length === 0
      ? '<p class="empty">暂无日程</p>'
      : `<ul class="timeline">${schedules
          .map((s) => {
            const recurrence = describeRecurrence({ recurrence: s.recurrence });
            const time = s.time
              ? `<span class="time">${esc(s.time)}</span>`
              : '<span class="time muted">--:--</span>';
            const note = s.notes ? `<div class="note">${esc(s.notes)}</div>` : '';
            return `<li>${time}<div class="tl-body"><div class="tl-title">${esc(
              s.title,
            )}</div><div class="sub">${esc(recurrence)}</div>${note}</div></li>`;
          })
          .join('')}</ul>`;

  const listHtml = lists
    .map((list) => {
      const sections = list.sectionIds
        .map((id) => objectById.get(id))
        .filter((o): o is AppObject => o !== undefined);
      const total = list.items.length;
      const done = list.items.filter((i) => i.checked).length;
      const renderItem = (objectId: string, quantity: number, checked: boolean, note: string) => {
        const o = objectById.get(objectId);
        const name = o ? esc(o.name) : '（对象已删除）';
        const qty = quantity > 1 ? `<span class="qty">×${quantity}</span>` : '';
        const noteText = note ? `<span class="note-inline">${esc(note)}</span>` : '';
        return `<li class="${checked ? 'done' : ''}"><span class="box">${
          checked ? '✓' : ''
        }</span><span class="item">${name}${qty}${noteText}</span></li>`;
      };
      const blocks: string[] = [];
      for (const section of sections) {
        const items = list.items.filter((i) => i.sectionId === section.id);
        blocks.push(
          `<div class="subhead">${section.icon} ${esc(section.name)}<span class="cnt">${
            items.length
          }</span></div>`,
        );
        blocks.push(
          items.length === 0
            ? '<p class="empty">无</p>'
            : `<ul class="items">${items
                .map((i) => renderItem(i.objectId, i.quantity, i.checked, i.note))
                .join('')}</ul>`,
        );
      }
      const unsectioned = list.items.filter(
        (i) => !i.sectionId || !list.sectionIds.includes(i.sectionId),
      );
      if (unsectioned.length > 0) {
        blocks.push(`<div class="subhead">未分区<span class="cnt">${unsectioned.length}</span></div>`);
        blocks.push(
          `<ul class="items">${unsectioned
            .map((i) => renderItem(i.objectId, i.quantity, i.checked, i.note))
            .join('')}</ul>`,
        );
      }
      const desc = list.description ? `<p class="card-desc">${esc(list.description)}</p>` : '';
      return `<article class="card"><div class="card-head"><h3>${
        list.cover || '📋'
      } ${esc(list.title)}</h3><span class="progress">${done}/${total} 已备</span></div>${desc}${blocks.join(
        '',
      )}</article>`;
    })
    .join('');

  const trackHtml =
    tracks.length === 0
      ? '<p class="empty">暂无轨迹</p>'
      : tracks
          .map((t) => {
            const stats: string[] = [];
            if (t.distanceKm !== null) stats.push(`距离 ${t.distanceKm} km`);
            if (t.elevationGainM !== null) stats.push(`爬升 ${t.elevationGainM} m`);
            if (t.difficulty) stats.push(`难度 ${DIFFICULTY_LABEL[t.difficulty]}`);
            if (t.durationMin !== null) stats.push(`时长 ${formatDuration(t.durationMin)}`);
            const chips = stats.length
              ? `<div class="chips">${stats.map((s) => `<span>${esc(s)}</span>`).join('')}</div>`
              : '';
            const svg = trackSvg(t.segments);
            const map = svg ? `<div class="map">${svg}</div>` : '';
            const link = t.link
              ? `<p class="link"><a href="${esc(t.link)}">${esc(t.link)}</a></p>`
              : '';
            const notes = t.notes ? `<p class="note">${esc(t.notes)}</p>` : '';
            return `<article class="card"><div class="card-head"><h3>🗺️ ${esc(
              t.name,
            )}</h3></div>${chips}${map}${link}${notes}</article>`;
          })
          .join('');

  const dateRange = formatRange(plan.startDate, plan.endDate);
  const generated = new Date().toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(plan.title)}</title>
<style>
  :root {
    --bg:#f5f4f0; --card:#ffffff; --ink:#26241f; --muted:#7c7970;
    --line:#e7e4dc; --accent:#3f7d5c; --accent-dark:#2f6249; --accent-soft:#e9f1ec;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: var(--bg); color: var(--ink); line-height: 1.7;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { max-width: 860px; margin: 0 auto; padding: 28px 22px 48px; }
  .hero {
    display: flex; align-items: center; gap: 16px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    color: #fff; border-radius: 18px; padding: 22px 24px;
    box-shadow: 0 12px 30px rgba(47,98,73,.28);
  }
  .hero .icon { font-size: 46px; line-height: 1; }
  .hero h1 { font-size: 25px; margin: 0 0 6px; letter-spacing: .2px; }
  .hero .range { font-size: 13px; opacity: .92; }
  .hero .tags { margin-top: 10px; }
  .hero .tag { display: inline-block; background: rgba(255,255,255,.2); border-radius: 999px;
    padding: 2px 11px; font-size: 12px; margin: 0 6px 6px 0; }
  .desc { margin: 16px 4px 0; color: #3d3b35; }
  .block { margin-top: 30px; }
  .block > h2 { display: flex; align-items: center; gap: 9px; font-size: 16px; margin: 0 0 14px; color: var(--accent-dark); }
  .block > h2::before { content: ''; width: 5px; height: 18px; border-radius: 3px; background: var(--accent); display: inline-block; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 16px 18px; box-shadow: 0 2px 10px rgba(30,28,22,.05); margin-bottom: 14px; break-inside: avoid; }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .card-head h3 { font-size: 16px; margin: 0; }
  .progress { flex-shrink: 0; font-size: 12px; color: var(--muted); background: var(--bg); border-radius: 999px; padding: 2px 10px; }
  .card-desc { color: var(--muted); font-size: 13px; margin: 0 0 10px; }
  .subhead { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
    color: var(--accent-dark); margin: 14px 0 6px; }
  .subhead .cnt { margin-left: auto; color: var(--muted); font-weight: 400; font-size: 12px; }
  ul.items { list-style: none; margin: 0; padding: 0; }
  ul.items li { display: flex; gap: 10px; align-items: baseline; padding: 5px 0; border-bottom: 1px dashed var(--line); }
  ul.items li:last-child { border-bottom: none; }
  .box { width: 17px; height: 17px; border: 1.6px solid #cdcabf; border-radius: 5px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; transform: translateY(1px); }
  .done .box { background: var(--accent); border-color: var(--accent); }
  .done .item { color: var(--muted); text-decoration: line-through; }
  .qty { color: var(--muted); margin-left: 6px; font-size: 13px; }
  .note-inline { color: var(--muted); margin-left: 8px; font-size: 12px; }
  .timeline { list-style: none; margin: 0; padding: 0; background: var(--card); border: 1px solid var(--line);
    border-radius: 14px; padding: 6px 18px; box-shadow: 0 2px 10px rgba(30,28,22,.05); }
  .timeline li { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .timeline li:last-child { border-bottom: none; }
  .time { flex-shrink: 0; width: 54px; font-variant-numeric: tabular-nums; font-weight: 600; color: var(--accent); }
  .time.muted { color: var(--muted); font-weight: 400; }
  .tl-title { font-weight: 600; }
  .sub { color: var(--muted); font-size: 13px; }
  .note { color: var(--muted); font-size: 13px; white-space: pre-wrap; margin: 4px 0 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .chips span { background: var(--accent-soft); color: var(--accent-dark); border-radius: 999px;
    padding: 3px 11px; font-size: 12px; font-weight: 500; }
  .map { margin: 8px 0; }
  .map svg { display: block; border-radius: 10px; }
  .link { margin: 8px 0 0; font-size: 13px; }
  a { color: var(--accent); word-break: break-all; }
  .empty { color: var(--muted); font-size: 13px; margin: 4px 0; }
  .footer { margin-top: 38px; text-align: center; color: var(--muted); font-size: 12px; }
  @media print {
    body { background: #fff; }
    .page { max-width: none; padding: 0; }
    .hero, .card, .timeline { box-shadow: none; }
    .card, .timeline, .map { break-inside: avoid; }
    @page { margin: 14mm; }
  }
</style>
</head>
<body>
<div class="page">
  <header class="hero">
    <div class="icon">${esc(plan.icon)}</div>
    <div>
      <h1>${esc(plan.title)}</h1>
      <div class="range">${esc(dateRange)}</div>
      ${
        plan.tags.length
          ? `<div class="tags">${plan.tags
              .map((t) => `<span class="tag">${esc(t)}</span>`)
              .join('')}</div>`
          : ''
      }
    </div>
  </header>
  ${plan.description ? `<p class="desc">${esc(plan.description)}</p>` : ''}
  <section class="block"><h2>日程</h2>${scheduleHtml}</section>
  <section class="block"><h2>清单</h2>${
    listHtml || '<p class="empty">暂无清单</p>'
  }</section>
  <section class="block"><h2>轨迹</h2>${trackHtml}</section>
  <footer class="footer">由「拾集」生成 · ${generated}</footer>
</div>
</body>
</html>`;
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHtml(html: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    window.alert('浏览器拦截了弹出窗口，请允许后重试，或改用「导出 HTML」。');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 350);
}

export function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || '计划';
}
