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
      ? '<p class="muted">无</p>'
      : `<ul>${schedules
          .map((s) => {
            const parts = [describeRecurrence({ recurrence: s.recurrence })];
            if (s.time) parts.push(s.time);
            const note = s.notes ? `<div class="note">${esc(s.notes)}</div>` : '';
            return `<li><strong>${esc(s.title)}</strong><span class="meta">${esc(
              parts.join(' · '),
            )}</span>${note}</li>`;
          })
          .join('')}</ul>`;

  const listHtml = lists
    .map((list) => {
      const sections = list.sectionIds
        .map((id) => objectById.get(id))
        .filter((o): o is AppObject => o !== undefined);
      const renderItem = (objectId: string, quantity: number, checked: boolean, note: string) => {
        const o = objectById.get(objectId);
        const name = o ? esc(o.name) : '（对象已删除）';
        const qty = quantity > 1 ? `<span class="qty">×${quantity}</span>` : '';
        const noteText = note ? `<span class="note inline">${esc(note)}</span>` : '';
        return `<li class="${checked ? 'done' : ''}"><span class="box">${
          checked ? '✓' : ''
        }</span><span class="item">${name}${qty}${noteText}</span></li>`;
      };
      const blocks = sections.map((section) => {
        const items = list.items.filter((i) => i.sectionId === section.id);
        const body =
          items.length === 0
            ? '<p class="muted">无</p>'
            : `<ul class="items">${items
                .map((i) => renderItem(i.objectId, i.quantity, i.checked, i.note))
                .join('')}</ul>`;
        return `<h3>${section.icon} ${esc(section.name)}</h3>${body}`;
      });
      const unsectioned = list.items.filter(
        (i) => !i.sectionId || !list.sectionIds.includes(i.sectionId),
      );
      if (unsectioned.length > 0) {
        blocks.push(
          `<h3>未分区</h3><ul class="items">${unsectioned
            .map((i) => renderItem(i.objectId, i.quantity, i.checked, i.note))
            .join('')}</ul>`,
        );
      }
      const desc = list.description ? `<p class="muted">${esc(list.description)}</p>` : '';
      return `<section class="list"><h2>清单：${esc(list.title)}</h2>${desc}${blocks.join('')}</section>`;
    })
    .join('');

  const trackHtml =
    tracks.length === 0
      ? '<p class="muted">无</p>'
      : tracks
          .map((t) => {
            const stats: string[] = [];
            if (t.distanceKm !== null) stats.push(`距离 ${t.distanceKm} km`);
            if (t.elevationGainM !== null) stats.push(`爬升 ${t.elevationGainM} m`);
            if (t.difficulty) stats.push(`难度 ${DIFFICULTY_LABEL[t.difficulty]}`);
            if (t.durationMin !== null) stats.push(`时长 ${formatDuration(t.durationMin)}`);
            const svg = trackSvg(t.segments);
            const link = t.link ? `<p><a href="${esc(t.link)}">${esc(t.link)}</a></p>` : '';
            const notes = t.notes ? `<p class="note">${esc(t.notes)}</p>` : '';
            return `<section class="track"><h3>${esc(t.name)}</h3>${
              stats.length ? `<p class="stats">${esc(stats.join(' · '))}</p>` : ''
            }${svg}${link}${notes}</section>`;
          })
          .join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(plan.icon)} ${esc(plan.title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    max-width: 820px; margin: 0 auto; padding: 32px 24px; color: #24231f; line-height: 1.65; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  h2 { font-size: 17px; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e4e2dc; }
  h3 { font-size: 14px; margin: 18px 0 8px; color: #3f7d5c; }
  .meta { color: #7a776e; margin-left: 8px; font-size: 13px; }
  .stats { color: #3f7d5c; font-weight: 500; }
  .muted, .note { color: #7a776e; font-size: 13px; }
  ul { padding-left: 0; list-style: none; margin: 0; }
  ul.items li { display: flex; gap: 8px; align-items: baseline; padding: 3px 0; }
  .box { width: 16px; height: 16px; border: 1.5px solid #c9c7c0; border-radius: 4px; display: inline-flex;
    align-items: center; justify-content: center; font-size: 11px; color: #3f7d5c; flex-shrink: 0; }
  .done .box { background: #e6f0ea; border-color: #3f7d5c; }
  .done .item { color: #7a776e; text-decoration: line-through; }
  .qty { color: #7a776e; margin-left: 6px; }
  .note.inline { margin-left: 8px; }
  .list, .track { margin-bottom: 22px; }
  .track svg { margin-top: 8px; }
  .tag { display: inline-block; background: #f0efeb; border-radius: 999px; padding: 1px 10px; font-size: 12px; color: #7a776e; margin-right: 6px; }
  a { color: #3f7d5c; word-break: break-all; }
  @media print { body { padding: 0; } .track { break-inside: avoid; } }
</style>
</head>
<body>
  <h1>${plan.icon} ${esc(plan.title)}</h1>
  <p class="muted">${esc(formatRange(plan.startDate, plan.endDate))}</p>
  ${plan.tags.length ? `<p>${plan.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
  ${plan.description ? `<p>${esc(plan.description)}</p>` : ''}
  <h2>日程</h2>
  ${scheduleHtml}
  ${listHtml}
  <h2>轨迹</h2>
  ${trackHtml}
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
