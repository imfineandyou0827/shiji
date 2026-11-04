import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  emptyDatabase,
  migrate,
  parseDatabase,
  serializeDatabase,
} from '../src/storage/db';

describe('migrate', () => {
  it('returns an empty database for non-object input', () => {
    expect(migrate(null)).toEqual(emptyDatabase());
    expect(migrate(42)).toEqual(emptyDatabase());
    expect(migrate('nope')).toEqual(emptyDatabase());
  });

  it('stamps the current schema version', () => {
    expect(migrate({}).version).toBe(SCHEMA_VERSION);
  });

  it('applies defaults and drops invalid entries', () => {
    const result = migrate({
      objects: [
        { id: 'i1', kind: 'item', name: 'Item' },
        { id: 's1', kind: 'section', name: 'Section' },
        null,
        'oops',
      ],
    });
    expect(result.objects).toHaveLength(2);
    expect(result.objects.find((o) => o.id === 'i1')?.icon).toBe('📦');
    expect(result.objects.find((o) => o.id === 'i1')?.kind).toBe('item');
    expect(result.objects.find((o) => o.id === 's1')?.kind).toBe('section');
  });

  it('drops list items whose object is missing and nulls invalid section refs', () => {
    const result = migrate({
      objects: [
        { id: 'i1', kind: 'item', name: 'Item' },
        { id: 's1', kind: 'section', name: 'Section' },
      ],
      lists: [
        {
          id: 'l1',
          title: 'List',
          sectionIds: ['s1', 'missing'],
          items: [
            { objectId: 'i1', sectionId: 's1' },
            { objectId: 'ghost' },
            { objectId: 'i1', sectionId: 'missing' },
          ],
        },
      ],
    });
    const list = result.lists[0];
    expect(list.sectionIds).toEqual(['s1']);
    expect(list.items).toHaveLength(2);
    expect(list.items[1].sectionId).toBeNull();
  });

  it('drops plan references to missing schedules and lists', () => {
    const result = migrate({
      schedules: [{ id: 's1', title: 'Schedule' }],
      lists: [{ id: 'l1', title: 'List' }],
      plans: [{ id: 'p1', title: 'Plan', scheduleIds: ['s1', 'x'], listIds: ['l1', 'y'] }],
    });
    expect(result.plans[0].scheduleIds).toEqual(['s1']);
    expect(result.plans[0].listIds).toEqual(['l1']);
  });

  it('strips the legacy planId field from lists and schedules', () => {
    const result = migrate({
      lists: [{ id: 'l1', title: 'List', planId: 'p1' }],
      schedules: [{ id: 's1', title: 'Schedule', planId: 'p1' }],
    });
    expect('planId' in result.lists[0]).toBe(false);
    expect('planId' in result.schedules[0]).toBe(false);
  });

  it('normalizes tombstones and drops entries without an id', () => {
    const result = migrate({
      tombstones: [{ id: '', deletedAt: '2024-01-01T00:00:00.000Z' }, { id: 'a' }],
    });
    expect(result.tombstones).toHaveLength(1);
    expect(result.tombstones[0].id).toBe('a');
    expect(result.tombstones[0].deletedAt).toBeTruthy();
  });

  it('collects categories from the raw list and objects, then sorts them', () => {
    const result = migrate({
      categories: ['z'],
      objects: [{ id: 'i1', kind: 'item', name: 'Item', category: 'a' }],
    });
    expect(result.categories).toEqual(['a', 'z']);
  });

  it('clamps item quantity to at least 1 and rounds it', () => {
    const result = migrate({
      objects: [
        { id: 'i1', kind: 'item' },
        { id: 'i2', kind: 'item' },
      ],
      lists: [
        {
          id: 'l1',
          items: [
            { objectId: 'i1', quantity: 0 },
            { objectId: 'i2', quantity: 2.6 },
          ],
        },
      ],
    });
    expect(result.lists[0].items.map((i) => i.quantity)).toEqual([1, 3]);
  });

  it('normalizes benefits and their perks', () => {
    const result = migrate({
      benefits: [
        { id: 'b1', title: '招行卡', perks: [{ title: '贵宾厅', used: true }, null] },
        { title: '无类型' },
      ],
    });
    expect(result.benefits).toHaveLength(2);
    const b1 = result.benefits.find((b) => b.id === 'b1');
    expect(b1?.category).toBe('other');
    expect(b1?.icon).toBe('💳');
    expect(b1?.perks).toHaveLength(1);
    expect(b1?.perks[0].used).toBe(true);
  });

  it('normalizes habits and dedupes their check-in dates', () => {
    const result = migrate({
      habits: [
        {
          id: 'h1',
          title: '每天阅读',
          checkins: ['2024-01-02', 'bad', '2024-01-01', '2024-01-02', null],
          resources: [
            { id: 'r1', title: '跟练视频', url: 'https://example.com/video' },
            { id: 'r2', title: '坏链接', url: 'javascript:alert(1)' },
            { title: '没有链接' },
          ],
        },
        { title: '早起' },
        null,
      ],
    });
    expect(result.habits).toHaveLength(2);
    const h1 = result.habits.find((h) => h.id === 'h1');
    expect(h1?.icon).toBe('🌱');
    expect(h1?.checkins).toEqual(['2024-01-01', '2024-01-02']);
    expect(h1?.resources).toEqual([
      { id: 'r1', title: '跟练视频', url: 'https://example.com/video' },
    ]);
    expect(result.habits.find((h) => h.title === '早起')?.resources).toEqual([]);
  });
});

describe('parseDatabase', () => {
  it('rejects invalid JSON', () => {
    const result = parseDatabase('{ not json');
    expect(result.ok).toBe(false);
    expect(result.database).toBeUndefined();
  });

  it('rejects JSON without known data arrays', () => {
    expect(parseDatabase('{"foo":1}').ok).toBe(false);
  });

  it('accepts and normalizes a valid database', () => {
    const result = parseDatabase(
      JSON.stringify({ objects: [{ id: 'i1', kind: 'item', name: 'Item' }] }),
    );
    expect(result.ok).toBe(true);
    expect(result.database?.objects).toHaveLength(1);
  });

  it('accepts a database that only has benefits', () => {
    const result = parseDatabase(JSON.stringify({ benefits: [{ id: 'b1', title: '机场贵宾厅' }] }));
    expect(result.ok).toBe(true);
    expect(result.database?.benefits).toHaveLength(1);
  });

  it('accepts a database that only has habits', () => {
    const result = parseDatabase(JSON.stringify({ habits: [{ id: 'h1', title: '每天阅读' }] }));
    expect(result.ok).toBe(true);
    expect(result.database?.habits).toHaveLength(1);
  });

  it('round-trips through serializeDatabase', () => {
    const source = migrate({
      objects: [{ id: 'i1', kind: 'item', name: 'Item', category: 'a' }],
    });
    const result = parseDatabase(serializeDatabase(source));
    expect(result.ok).toBe(true);
    expect(result.database).toEqual(source);
  });
});
