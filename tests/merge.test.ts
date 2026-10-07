import { describe, expect, it } from 'vitest';
import type { AppList, AppObject, Benefit, Database, Schedule } from '../src/types';
import { SCHEMA_VERSION } from '../src/storage/db';
import { mergeDatabases } from '../src/utils/merge';

function object(id: string, updatedAt: string, name = id): AppObject {
  return {
    id,
    kind: 'item',
    name,
    category: '',
    tags: [],
    icon: '📦',
    iconType: 'emoji',
    notes: '',
    fields: [],
    memberIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt,
  };
}

function list(id: string, updatedAt: string, title = id): AppList {
  return {
    id,
    title,
    description: '',
    cover: '📋',
    tags: [],
    sectionIds: [],
    items: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt,
  };
}

function schedule(id: string, updatedAt: string, title = id): Schedule {
  return {
    id,
    title,
    objectId: null,
    listId: null,
    recurrence: { type: 'weekly', weekdays: [1], dayOfMonth: null, date: null },
    time: '',
    notes: '',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt,
  };
}

function benefit(id: string, updatedAt: string, title = id): Benefit {
  return {
    id,
    title,
    category: 'card',
    provider: '',
    icon: '💳',
    iconType: 'emoji',
    identifier: '',
    link: '',
    expiresAt: null,
    tags: [],
    perks: [],
    notes: '',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt,
  };
}

function db(partial: Partial<Database> = {}): Database {
  return {
    version: SCHEMA_VERSION,
    objects: [],
    lists: [],
    schedules: [],
    plans: [],
    benefits: [],
    categories: [],
    tombstones: [],
    ...partial,
  };
}

describe('mergeDatabases', () => {
  it('keeps the newer version of an entity by updatedAt', () => {
    const merged = mergeDatabases(
      db({ objects: [object('a', '2024-03-01T00:00:00.000Z', 'newer')] }),
      db({ objects: [object('a', '2024-01-01T00:00:00.000Z', 'older')] }),
    );
    expect(merged.objects).toHaveLength(1);
    expect(merged.objects[0].name).toBe('newer');
  });

  it('prefers the remote copy when updatedAt values are equal', () => {
    const merged = mergeDatabases(
      db({ objects: [object('a', '2024-01-01T00:00:00.000Z', 'local')] }),
      db({ objects: [object('a', '2024-01-01T00:00:00.000Z', 'remote')] }),
    );
    expect(merged.objects[0].name).toBe('remote');
  });

  it('unions entities with distinct ids', () => {
    const merged = mergeDatabases(
      db({ objects: [object('a', '2024-01-01T00:00:00.000Z')] }),
      db({ objects: [object('b', '2024-01-01T00:00:00.000Z')] }),
    );
    expect(merged.objects.map((o) => o.id).sort()).toEqual(['a', 'b']);
  });

  it('removes entities covered by a newer tombstone', () => {
    const merged = mergeDatabases(
      db({ objects: [object('a', '2024-01-01T00:00:00.000Z')] }),
      db({ tombstones: [{ id: 'a', deletedAt: '2024-02-01T00:00:00.000Z' }] }),
    );
    expect(merged.objects).toHaveLength(0);
    expect(merged.tombstones).toHaveLength(1);
  });

  it('keeps an entity that was updated after it was deleted', () => {
    const merged = mergeDatabases(
      db({ objects: [object('a', '2024-03-01T00:00:00.000Z', 'revived')] }),
      db({ tombstones: [{ id: 'a', deletedAt: '2024-02-01T00:00:00.000Z' }] }),
    );
    expect(merged.objects).toHaveLength(1);
    expect(merged.objects[0].name).toBe('revived');
  });

  it('keeps the latest tombstone for the same id', () => {
    const merged = mergeDatabases(
      db({ tombstones: [{ id: 'x', deletedAt: '2024-01-01T00:00:00.000Z' }] }),
      db({ tombstones: [{ id: 'x', deletedAt: '2024-05-01T00:00:00.000Z' }] }),
    );
    expect(merged.tombstones).toEqual([{ id: 'x', deletedAt: '2024-05-01T00:00:00.000Z' }]);
  });

  it('merges lists and schedules by id', () => {
    const merged = mergeDatabases(
      db({
        lists: [list('l1', '2024-01-01T00:00:00.000Z', '旧')],
        schedules: [schedule('s1', '2024-01-01T00:00:00.000Z', '旧')],
      }),
      db({
        lists: [list('l1', '2024-02-01T00:00:00.000Z', '新')],
        schedules: [schedule('s2', '2024-01-01T00:00:00.000Z')],
      }),
    );
    expect(merged.lists[0].title).toBe('新');
    expect(merged.schedules.map((s) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('unions, dedupes, filters and sorts categories', () => {
    const merged = mergeDatabases(
      db({ categories: ['b', ''], objects: [object('a', '2024-01-01T00:00:00.000Z')] }),
      (() => {
        const remote = db({ categories: ['a', 'b', ''] });
        remote.objects = [{ ...object('c', '2024-01-01T00:00:00.000Z'), category: 'c' }];
        return remote;
      })(),
    );
    expect(merged.categories).toEqual(['a', 'b', 'c']);
  });

  it('merges benefits by id with the newer copy winning', () => {
    const merged = mergeDatabases(
      db({ benefits: [benefit('b1', '2024-01-01T00:00:00.000Z', '旧')] }),
      db({ benefits: [benefit('b1', '2024-03-01T00:00:00.000Z', '新')] }),
    );
    expect(merged.benefits).toHaveLength(1);
    expect(merged.benefits[0].title).toBe('新');
  });

  it('removes a benefit covered by a tombstone', () => {
    const merged = mergeDatabases(
      db({ benefits: [benefit('b1', '2024-01-01T00:00:00.000Z')] }),
      db({ tombstones: [{ id: 'b1', deletedAt: '2024-02-01T00:00:00.000Z' }] }),
    );
    expect(merged.benefits).toHaveLength(0);
  });
});
