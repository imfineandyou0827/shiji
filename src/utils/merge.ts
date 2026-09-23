import type { Database, Tombstone } from '../types';
import { SCHEMA_VERSION } from '../storage/db';

interface Entity {
  id: string;
  updatedAt: string;
}

function mergeEntities<T extends Entity>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) {
    const existing = map.get(item.id);
    if (!existing) map.set(item.id, item);
    else map.set(item.id, item.updatedAt >= existing.updatedAt ? item : existing);
  }
  return [...map.values()];
}

function mergeTombstones(a: Tombstone[], b: Tombstone[]): Tombstone[] {
  const map = new Map<string, Tombstone>();
  const put = (t: Tombstone) => {
    const existing = map.get(t.id);
    if (!existing || t.deletedAt > existing.deletedAt) map.set(t.id, t);
  };
  a.forEach(put);
  b.forEach(put);
  return [...map.values()];
}

export function mergeDatabases(local: Database, remote: Database): Database {
  const tombstones = mergeTombstones(local.tombstones ?? [], remote.tombstones ?? []);
  const deletedAt = new Map(tombstones.map((t) => [t.id, t.deletedAt]));

  const applyTombstones = <T extends Entity>(items: T[]): T[] =>
    items.filter((item) => {
      const del = deletedAt.get(item.id);
      return !del || del < item.updatedAt;
    });

  const objects = applyTombstones(mergeEntities(local.objects, remote.objects));
  const categories = [
    ...new Set([...(local.categories ?? []), ...(remote.categories ?? []), ...objects.map((o) => o.category)]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    version: SCHEMA_VERSION,
    objects,
    lists: applyTombstones(mergeEntities(local.lists, remote.lists)),
    schedules: applyTombstones(mergeEntities(local.schedules, remote.schedules)),
    plans: applyTombstones(mergeEntities(local.plans, remote.plans)),
    categories,
    tombstones,
  };
}
