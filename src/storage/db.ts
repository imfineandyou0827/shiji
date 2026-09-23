import type {
  AppList,
  AppObject,
  Database,
  ListItem,
  Plan,
  Recurrence,
  Schedule,
  Tombstone,
  Track,
  TrackPoint,
} from '../types';
import { createId, now } from '../utils/id';

export const STORAGE_KEY = 'shiji:data';
export const SCHEMA_VERSION = 5;

export function emptyDatabase(): Database {
  return {
    version: SCHEMA_VERSION,
    objects: [],
    lists: [],
    schedules: [],
    plans: [],
    categories: [],
    tombstones: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeObject(raw: unknown): AppObject | null {
  if (!isRecord(raw)) return null;
  return {
    id: str(raw.id) || createId(),
    kind: raw.kind === 'section' ? 'section' : 'item',
    name: str(raw.name),
    category: str(raw.category),
    tags: strArray(raw.tags),
    icon: str(raw.icon) || '📦',
    iconType: raw.iconType === 'image' ? 'image' : 'emoji',
    notes: str(raw.notes),
    fields: asArray(raw.fields)
      .filter(isRecord)
      .map((f) => ({ key: str(f.key), value: str(f.value) })),
    memberIds: strArray(raw.memberIds),
    createdAt: str(raw.createdAt) || now(),
    updatedAt: str(raw.updatedAt) || now(),
  };
}

function normalizeListItem(raw: unknown): ListItem | null {
  if (!isRecord(raw)) return null;
  return {
    id: str(raw.id) || createId(),
    objectId: str(raw.objectId),
    sectionId: nullableStr(raw.sectionId),
    quantity: Math.max(1, Math.round(num(raw.quantity, 1))),
    checked: bool(raw.checked),
    note: str(raw.note),
  };
}

function normalizeList(raw: unknown): AppList | null {
  if (!isRecord(raw)) return null;
  return {
    id: str(raw.id) || createId(),
    title: str(raw.title),
    description: str(raw.description),
    cover: str(raw.cover) || '📋',
    tags: strArray(raw.tags),
    sectionIds: strArray(raw.sectionIds),
    items: asArray(raw.items)
      .map(normalizeListItem)
      .filter((i): i is ListItem => i !== null),
    planId: nullableStr(raw.planId),
    createdAt: str(raw.createdAt) || now(),
    updatedAt: str(raw.updatedAt) || now(),
  };
}

function normalizeRecurrence(raw: unknown): Recurrence {
  const r = isRecord(raw) ? raw : {};
  const type = r.type === 'monthly' || r.type === 'once' ? r.type : 'weekly';
  return {
    type,
    weekdays: Array.isArray(r.weekdays)
      ? r.weekdays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
      : [],
    dayOfMonth: typeof r.dayOfMonth === 'number' ? r.dayOfMonth : null,
    date: typeof r.date === 'string' ? r.date : null,
  };
}

function normalizeSchedule(raw: unknown): Schedule | null {
  if (!isRecord(raw)) return null;
  return {
    id: str(raw.id) || createId(),
    title: str(raw.title),
    objectId: nullableStr(raw.objectId),
    listId: nullableStr(raw.listId),
    recurrence: normalizeRecurrence(raw.recurrence),
    time: str(raw.time),
    notes: str(raw.notes),
    active: bool(raw.active, true),
    planId: nullableStr(raw.planId),
    createdAt: str(raw.createdAt) || now(),
    updatedAt: str(raw.updatedAt) || now(),
  };
}

function normalizePoints(raw: unknown): TrackPoint[] {
  return asArray(raw)
    .filter(isRecord)
    .map((p) => {
      const point: TrackPoint = { lat: num(p.lat, NaN), lon: num(p.lon, NaN) };
      if (typeof p.ele === 'number' && Number.isFinite(p.ele)) point.ele = p.ele;
      return point;
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
}

function normalizeSegments(rawSegments: unknown, rawFlat: unknown): TrackPoint[][] {
  if (Array.isArray(rawSegments)) {
    return rawSegments.map(normalizePoints).filter((s) => s.length > 0);
  }
  const flat = normalizePoints(rawFlat);
  return flat.length > 0 ? [flat] : [];
}

function normalizeTrack(raw: unknown): Track | null {
  if (!isRecord(raw)) return null;
  const difficulty = raw.difficulty;
  const baseLayer =
    raw.baseLayer === 'topo' || raw.baseLayer === 'satellite' ? raw.baseLayer : 'osm';
  return {
    id: str(raw.id) || createId(),
    name: str(raw.name),
    link: str(raw.link),
    distanceKm: nullableNum(raw.distanceKm),
    elevationGainM: nullableNum(raw.elevationGainM),
    difficulty:
      difficulty === 'easy' ||
      difficulty === 'moderate' ||
      difficulty === 'hard' ||
      difficulty === 'expert'
        ? difficulty
        : '',
    durationMin: nullableNum(raw.durationMin),
    notes: str(raw.notes),
    segments: normalizeSegments(raw.segments, raw.points),
    baseLayer,
  };
}

function normalizeTombstones(raw: unknown): Tombstone[] {
  return asArray(raw)
    .filter(isRecord)
    .map((t) => ({ id: str(t.id), deletedAt: str(t.deletedAt) || now() }))
    .filter((t) => t.id.length > 0);
}

function normalizePlan(raw: unknown): Plan | null {
  if (!isRecord(raw)) return null;
  return {
    id: str(raw.id) || createId(),
    title: str(raw.title),
    icon: str(raw.icon) || '🥾',
    description: str(raw.description),
    tags: strArray(raw.tags),
    startDate: nullableStr(raw.startDate),
    endDate: nullableStr(raw.endDate),
    scheduleIds: strArray(raw.scheduleIds),
    listIds: strArray(raw.listIds),
    tracks: asArray(raw.tracks)
      .map(normalizeTrack)
      .filter((t): t is Track => t !== null),
    createdAt: str(raw.createdAt) || now(),
    updatedAt: str(raw.updatedAt) || now(),
  };
}

export function migrate(raw: unknown): Database {
  if (!isRecord(raw)) return emptyDatabase();

  const objects = asArray(raw.objects)
    .map(normalizeObject)
    .filter((o): o is AppObject => o !== null);
  const objectIds = new Set(objects.map((o) => o.id));
  const itemIds = new Set(objects.filter((o) => o.kind === 'item').map((o) => o.id));
  const sectionIds = new Set(objects.filter((o) => o.kind === 'section').map((o) => o.id));

  const normalizedObjects = objects.map((o) =>
    o.kind === 'section'
      ? { ...o, memberIds: o.memberIds.filter((id) => itemIds.has(id)) }
      : o,
  );

  const lists = asArray(raw.lists)
    .map(normalizeList)
    .filter((l): l is AppList => l !== null)
    .map((l) => {
      const validSections = l.sectionIds.filter((id) => sectionIds.has(id));
      return {
        ...l,
        sectionIds: validSections,
        items: l.items
          .filter((i) => objectIds.has(i.objectId))
          .map((i) => ({
            ...i,
            sectionId: i.sectionId && validSections.includes(i.sectionId) ? i.sectionId : null,
          })),
      };
    });

  const schedules = asArray(raw.schedules)
    .map(normalizeSchedule)
    .filter((s): s is Schedule => s !== null);

  const scheduleIdSet = new Set(schedules.map((s) => s.id));
  const listIdSet = new Set(lists.map((l) => l.id));

  const plans = asArray(raw.plans)
    .map(normalizePlan)
    .filter((p): p is Plan => p !== null)
    .map((p) => ({
      ...p,
      scheduleIds: p.scheduleIds.filter((id) => scheduleIdSet.has(id)),
      listIds: p.listIds.filter((id) => listIdSet.has(id)),
    }));

  const fixedLists = lists.map((l) => ({ ...l, planId: null }));
  const fixedSchedules = schedules.map((s) => ({ ...s, planId: null }));

  const categorySet = new Set(strArray(raw.categories));
  normalizedObjects.forEach((o) => {
    if (o.category) categorySet.add(o.category);
  });

  return {
    version: SCHEMA_VERSION,
    objects: normalizedObjects,
    lists: fixedLists,
    schedules: fixedSchedules,
    plans,
    categories: [...categorySet].sort((a, b) => a.localeCompare(b)),
    tombstones: normalizeTombstones(raw.tombstones),
  };
}

export function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDatabase();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyDatabase();
  }
}

export function saveDatabase(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...db, version: SCHEMA_VERSION }));
  } catch {
    // storage full or unavailable: keep the app usable in memory
  }
}

export function serializeDatabase(db: Database): string {
  return JSON.stringify({ ...db, version: SCHEMA_VERSION }, null, 2);
}

export interface ImportResult {
  ok: boolean;
  database?: Database;
  error?: string;
}

export function parseDatabase(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '不是有效的 JSON 文件' };
  }
  if (!isRecord(raw)) {
    return { ok: false, error: '数据格式不正确' };
  }
  if (!('objects' in raw) && !('lists' in raw) && !('schedules' in raw) && !('plans' in raw)) {
    return { ok: false, error: '缺少对象、清单、日程或计划数据' };
  }
  return { ok: true, database: migrate(raw) };
}
