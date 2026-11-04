export interface EntityBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  key: string;
  value: string;
}

export type IconType = 'emoji' | 'image';

export type ObjectKind = 'item' | 'section';

export interface AppObject extends EntityBase {
  kind: ObjectKind;
  name: string;
  category: string;
  tags: string[];
  icon: string;
  iconType: IconType;
  notes: string;
  fields: CustomField[];
  memberIds: string[];
}

export interface ListItem {
  id: string;
  objectId: string;
  sectionId: string | null;
  quantity: number;
  checked: boolean;
  note: string;
}

export interface AppList extends EntityBase {
  title: string;
  description: string;
  cover: string;
  tags: string[];
  sectionIds: string[];
  items: ListItem[];
}

export type RecurrenceType = 'weekly' | 'monthly' | 'once';

export interface Recurrence {
  type: RecurrenceType;
  weekdays: number[];
  dayOfMonth: number | null;
  date: string | null;
}

export interface Schedule extends EntityBase {
  title: string;
  objectId: string | null;
  listId: string | null;
  recurrence: Recurrence;
  time: string;
  notes: string;
  active: boolean;
}

export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export type Difficulty = '' | 'easy' | 'moderate' | 'hard' | 'expert';

export type BaseLayer = 'osm' | 'topo' | 'satellite';

export interface Track {
  id: string;
  name: string;
  link: string;
  distanceKm: number | null;
  elevationGainM: number | null;
  difficulty: Difficulty;
  durationMin: number | null;
  notes: string;
  segments: TrackPoint[][];
  baseLayer: BaseLayer;
}

export interface Plan extends EntityBase {
  title: string;
  icon: string;
  description: string;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  scheduleIds: string[];
  listIds: string[];
  tracks: Track[];
}

export type BenefitCategory = 'card' | 'insurance' | 'membership' | 'other';

export interface BenefitPerk {
  id: string;
  title: string;
  note: string;
  expiresAt: string | null;
  used: boolean;
}

export interface Benefit extends EntityBase {
  title: string;
  category: BenefitCategory;
  provider: string;
  icon: string;
  iconType: IconType;
  identifier: string;
  link: string;
  expiresAt: string | null;
  tags: string[];
  perks: BenefitPerk[];
  notes: string;
  active: boolean;
}

export interface Habit extends EntityBase {
  title: string;
  icon: string;
  notes: string;
  checkins: string[];
}

export interface Tombstone {
  id: string;
  deletedAt: string;
}

export interface Database {
  version: number;
  objects: AppObject[];
  lists: AppList[];
  schedules: Schedule[];
  plans: Plan[];
  benefits: Benefit[];
  habits: Habit[];
  categories: string[];
  tombstones: Tombstone[];
}
