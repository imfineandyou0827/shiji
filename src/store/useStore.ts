import { create } from 'zustand';
import type { AppList, AppObject, Database, ListItem, Plan, Schedule, Tombstone, Track } from '../types';
import { emptyDatabase, loadDatabase, saveDatabase, SCHEMA_VERSION } from '../storage/db';
import { createId, now } from '../utils/id';

export type ObjectInput = Omit<AppObject, 'id' | 'createdAt' | 'updatedAt'>;
export type ListInput = Omit<AppList, 'id' | 'createdAt' | 'updatedAt'>;
export type ScheduleInput = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>;
export type ListItemPatch = Partial<Pick<ListItem, 'quantity' | 'checked' | 'note' | 'sectionId'>>;
export type PlanInput = Pick<
  Plan,
  'title' | 'icon' | 'description' | 'tags' | 'startDate' | 'endDate'
>;
export type TrackInput = Omit<Track, 'id'>;

interface Store {
  objects: AppObject[];
  lists: AppList[];
  schedules: Schedule[];
  plans: Plan[];
  categories: string[];
  tombstones: Tombstone[];
  addObject: (input: ObjectInput) => AppObject;
  updateObject: (id: string, patch: Partial<ObjectInput>) => void;
  removeObject: (id: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  removeCategory: (name: string) => void;
  addList: (input: ListInput) => AppList;
  updateList: (id: string, patch: Partial<ListInput>) => void;
  removeList: (id: string) => void;
  attachSection: (listId: string, objectId: string, memberIds?: string[]) => void;
  removeSection: (listId: string, sectionId: string) => void;
  moveSection: (listId: string, sectionId: string, direction: -1 | 1) => void;
  addSectionMember: (sectionId: string, objectId: string) => void;
  removeSectionMember: (sectionId: string, objectId: string) => void;
  moveSectionMember: (sectionId: string, objectId: string, direction: -1 | 1) => void;
  addListItem: (listId: string, objectId: string, sectionId?: string | null, quantity?: number) => void;
  updateListItem: (listId: string, itemId: string, patch: ListItemPatch) => void;
  removeListItem: (listId: string, itemId: string) => void;
  moveListItem: (listId: string, itemId: string, direction: -1 | 1) => void;
  addSchedule: (input: ScheduleInput) => Schedule;
  updateSchedule: (id: string, patch: Partial<ScheduleInput>) => void;
  removeSchedule: (id: string) => void;
  addPlan: (input: PlanInput) => Plan;
  updatePlan: (id: string, patch: Partial<PlanInput>) => void;
  removePlan: (id: string) => void;
  attachPlanSchedule: (planId: string, scheduleId: string) => void;
  detachPlanSchedule: (planId: string, scheduleId: string) => void;
  createPlanSchedule: (planId: string, input: ScheduleInput) => Schedule;
  attachPlanList: (planId: string, listId: string) => void;
  detachPlanList: (planId: string, listId: string) => void;
  createPlanList: (planId: string, input: ListInput) => AppList;
  addTrack: (planId: string, input: TrackInput) => Track;
  updateTrack: (planId: string, trackId: string, patch: Partial<TrackInput>) => void;
  removeTrack: (planId: string, trackId: string) => void;
  importDatabase: (db: Database) => void;
  resetDatabase: () => void;
}

function stamp() {
  return now();
}

function tombstone(id: string): Tombstone {
  return { id, deletedAt: stamp() };
}

function withCategory(categories: string[], name: string): string[] {
  const value = name.trim();
  if (!value || categories.includes(value)) return categories;
  return [...categories, value].sort((a, b) => a.localeCompare(b));
}

const initial = loadDatabase();

export const useStore = create<Store>()((set, get) => ({
  objects: initial.objects,
  lists: initial.lists,
  schedules: initial.schedules,
  plans: initial.plans,
  categories: initial.categories,
  tombstones: initial.tombstones,

  addObject: (input) => {
    const object: AppObject = { ...input, id: createId(), createdAt: stamp(), updatedAt: stamp() };
    set((s) => ({
      objects: [object, ...s.objects],
      categories: withCategory(s.categories, object.category),
    }));
    return object;
  },

  updateObject: (id, patch) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: stamp() } : o)),
      categories:
        patch.category !== undefined
          ? withCategory(s.categories, patch.category)
          : s.categories,
    })),

  addCategory: (name) => set((s) => ({ categories: withCategory(s.categories, name) })),

  renameCategory: (oldName, newName) => {
    const value = newName.trim();
    if (!value || value === oldName) return;
    set((s) => ({
      objects: s.objects.map((o) =>
        o.category === oldName ? { ...o, category: value, updatedAt: stamp() } : o,
      ),
      categories: [...new Set(s.categories.map((c) => (c === oldName ? value : c)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    }));
  },

  removeCategory: (name) =>
    set((s) => ({ categories: s.categories.filter((c) => c !== name) })),

  removeObject: (id) =>
    set((s) => ({
      objects: s.objects
        .filter((o) => o.id !== id)
        .map((o) =>
          o.memberIds.includes(id)
            ? { ...o, memberIds: o.memberIds.filter((m) => m !== id), updatedAt: stamp() }
            : o,
        ),
      lists: s.lists.map((l) => ({
        ...l,
        sectionIds: l.sectionIds.filter((sid) => sid !== id),
        items: l.items
          .filter((i) => i.objectId !== id)
          .map((i) => (i.sectionId === id ? { ...i, sectionId: null } : i)),
      })),
      schedules: s.schedules.map((sc) =>
        sc.objectId === id ? { ...sc, objectId: null, updatedAt: stamp() } : sc,
      ),
      tombstones: [...s.tombstones, tombstone(id)],
    })),

  addList: (input) => {
    const list: AppList = { ...input, id: createId(), createdAt: stamp(), updatedAt: stamp() };
    set((s) => ({ lists: [list, ...s.lists] }));
    return list;
  },

  updateList: (id, patch) =>
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: stamp() } : l)),
    })),

  removeList: (id) =>
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      schedules: s.schedules.map((sc) =>
        sc.listId === id ? { ...sc, listId: null, updatedAt: stamp() } : sc,
      ),
      plans: s.plans.map((p) =>
        p.listIds.includes(id)
          ? { ...p, listIds: p.listIds.filter((x) => x !== id), updatedAt: stamp() }
          : p,
      ),
      tombstones: [...s.tombstones, tombstone(id)],
    })),

  attachSection: (listId, objectId, memberIds) =>
    set((s) => {
      const section = s.objects.find((o) => o.id === objectId);
      const ids = memberIds ?? section?.memberIds ?? [];
      return {
        lists: s.lists.map((l) => {
          if (l.id !== listId || l.sectionIds.includes(objectId)) return l;
          const existing = new Set(l.items.map((i) => i.objectId));
          const members = ids
            .filter((id) => !existing.has(id))
            .map((memberId) => ({
              id: createId(),
              objectId: memberId,
              sectionId: objectId,
              quantity: 1,
              checked: false,
              note: '',
            }));
          return {
            ...l,
            sectionIds: [...l.sectionIds, objectId],
            items: [...l.items, ...members],
            updatedAt: stamp(),
          };
        }),
      };
    }),

  addSectionMember: (sectionId, objectId) =>
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === sectionId && !o.memberIds.includes(objectId)
          ? { ...o, memberIds: [...o.memberIds, objectId], updatedAt: stamp() }
          : o,
      ),
    })),

  removeSectionMember: (sectionId, objectId) =>
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === sectionId
          ? { ...o, memberIds: o.memberIds.filter((id) => id !== objectId), updatedAt: stamp() }
          : o,
      ),
    })),

  moveSectionMember: (sectionId, objectId, direction) =>
    set((s) => ({
      objects: s.objects.map((o) => {
        if (o.id !== sectionId) return o;
        const index = o.memberIds.indexOf(objectId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= o.memberIds.length) return o;
        const memberIds = [...o.memberIds];
        [memberIds[index], memberIds[target]] = [memberIds[target], memberIds[index]];
        return { ...o, memberIds, updatedAt: stamp() };
      }),
    })),

  removeSection: (listId, sectionId) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              sectionIds: l.sectionIds.filter((id) => id !== sectionId),
              items: l.items.map((i) =>
                i.sectionId === sectionId ? { ...i, sectionId: null } : i,
              ),
              updatedAt: stamp(),
            }
          : l,
      ),
    })),

  moveSection: (listId, sectionId, direction) =>
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== listId) return l;
        const index = l.sectionIds.indexOf(sectionId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= l.sectionIds.length) return l;
        const sectionIds = [...l.sectionIds];
        [sectionIds[index], sectionIds[target]] = [sectionIds[target], sectionIds[index]];
        return { ...l, sectionIds, updatedAt: stamp() };
      }),
    })),

  addListItem: (listId, objectId, sectionId = null, quantity = 1) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId && !l.items.some((i) => i.objectId === objectId)
          ? {
              ...l,
              updatedAt: stamp(),
              items: [
                ...l.items,
                { id: createId(), objectId, sectionId, quantity, checked: false, note: '' },
              ],
            }
          : l,
      ),
    })),

  updateListItem: (listId, itemId, patch) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              updatedAt: stamp(),
              items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
            }
          : l,
      ),
    })),

  removeListItem: (listId, itemId) =>
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, updatedAt: stamp(), items: l.items.filter((i) => i.id !== itemId) }
          : l,
      ),
    })),

  moveListItem: (listId, itemId, direction) =>
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== listId) return l;
        const index = l.items.findIndex((i) => i.id === itemId);
        if (index < 0) return l;
        const sectionId = l.items[index].sectionId;
        let neighbor = -1;
        if (direction === -1) {
          for (let i = index - 1; i >= 0; i -= 1) {
            if (l.items[i].sectionId === sectionId) {
              neighbor = i;
              break;
            }
          }
        } else {
          for (let i = index + 1; i < l.items.length; i += 1) {
            if (l.items[i].sectionId === sectionId) {
              neighbor = i;
              break;
            }
          }
        }
        if (neighbor < 0) return l;
        const items = [...l.items];
        [items[index], items[neighbor]] = [items[neighbor], items[index]];
        return { ...l, items, updatedAt: stamp() };
      }),
    })),

  addSchedule: (input) => {
    const schedule: Schedule = { ...input, id: createId(), createdAt: stamp(), updatedAt: stamp() };
    set((s) => ({ schedules: [schedule, ...s.schedules] }));
    return schedule;
  },

  updateSchedule: (id, patch) =>
    set((s) => ({
      schedules: s.schedules.map((sc) =>
        sc.id === id ? { ...sc, ...patch, updatedAt: stamp() } : sc,
      ),
    })),

  removeSchedule: (id) =>
    set((s) => ({
      schedules: s.schedules.filter((sc) => sc.id !== id),
      plans: s.plans.map((p) =>
        p.scheduleIds.includes(id)
          ? { ...p, scheduleIds: p.scheduleIds.filter((x) => x !== id), updatedAt: stamp() }
          : p,
      ),
      tombstones: [...s.tombstones, tombstone(id)],
    })),

  addPlan: (input) => {
    const plan: Plan = {
      ...input,
      id: createId(),
      scheduleIds: [],
      listIds: [],
      tracks: [],
      createdAt: stamp(),
      updatedAt: stamp(),
    };
    set((s) => ({ plans: [plan, ...s.plans] }));
    return plan;
  },

  updatePlan: (id, patch) =>
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: stamp() } : p)),
    })),

  removePlan: (id) =>
    set((s) => ({
      plans: s.plans.filter((p) => p.id !== id),
      tombstones: [...s.tombstones, tombstone(id)],
    })),

  attachPlanSchedule: (planId, scheduleId) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId && !p.scheduleIds.includes(scheduleId)
          ? { ...p, scheduleIds: [...p.scheduleIds, scheduleId], updatedAt: stamp() }
          : p,
      ),
    })),

  detachPlanSchedule: (planId, scheduleId) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              scheduleIds: p.scheduleIds.filter((x) => x !== scheduleId),
              updatedAt: stamp(),
            }
          : p,
      ),
    })),

  createPlanSchedule: (planId, input) => {
    const schedule = get().addSchedule({ ...input, planId: null });
    get().attachPlanSchedule(planId, schedule.id);
    return schedule;
  },

  attachPlanList: (planId, listId) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId && !p.listIds.includes(listId)
          ? { ...p, listIds: [...p.listIds, listId], updatedAt: stamp() }
          : p,
      ),
    })),

  detachPlanList: (planId, listId) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? { ...p, listIds: p.listIds.filter((x) => x !== listId), updatedAt: stamp() }
          : p,
      ),
    })),

  createPlanList: (planId, input) => {
    const list = get().addList({ ...input, planId: null });
    get().attachPlanList(planId, list.id);
    return list;
  },

  addTrack: (planId, input) => {
    const track: Track = { ...input, id: createId() };
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId ? { ...p, tracks: [...p.tracks, track], updatedAt: stamp() } : p,
      ),
    }));
    return track;
  },

  updateTrack: (planId, trackId, patch) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              tracks: p.tracks.map((t) => (t.id === trackId ? { ...t, ...patch } : t)),
              updatedAt: stamp(),
            }
          : p,
      ),
    })),

  removeTrack: (planId, trackId) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId), updatedAt: stamp() }
          : p,
      ),
    })),

  importDatabase: (db) =>
    set(() => ({
      objects: db.objects,
      lists: db.lists,
      schedules: db.schedules,
      plans: db.plans,
      categories: db.categories,
      tombstones: db.tombstones,
    })),

  resetDatabase: () => {
    const empty = emptyDatabase();
    set(() => ({
      objects: empty.objects,
      lists: empty.lists,
      schedules: empty.schedules,
      plans: empty.plans,
      categories: empty.categories,
      tombstones: empty.tombstones,
    }));
  },
}));

export function currentDatabase(): Database {
  const s = useStore.getState();
  return {
    version: SCHEMA_VERSION,
    objects: s.objects,
    lists: s.lists,
    schedules: s.schedules,
    plans: s.plans,
    categories: s.categories,
    tombstones: s.tombstones,
  };
}

useStore.subscribe((s) => {
  saveDatabase({
    version: SCHEMA_VERSION,
    objects: s.objects,
    lists: s.lists,
    schedules: s.schedules,
    plans: s.plans,
    categories: s.categories,
    tombstones: s.tombstones,
  });
});
