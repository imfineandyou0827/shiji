import type { Database } from '../types';
import { decryptJson, encryptJson } from './crypto';
import { createGist, fetchGist, updateGist } from './gist';
import { mergeDatabases } from './merge';

const SYNC_KEY = 'shiji:sync';

export interface SyncSettings {
  token: string;
  gistId: string;
  passphrase: string;
  lastSyncAt: string | null;
}

export const emptySyncSettings: SyncSettings = {
  token: '',
  gistId: '',
  passphrase: '',
  lastSyncAt: null,
};

export function loadSyncSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return { ...emptySyncSettings };
    const parsed = JSON.parse(raw) as Partial<SyncSettings>;
    return {
      token: parsed.token ?? '',
      gistId: parsed.gistId ?? '',
      passphrase: parsed.passphrase ?? '',
      lastSyncAt: parsed.lastSyncAt ?? null,
    };
  } catch {
    return { ...emptySyncSettings };
  }
}

export function saveSyncSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function clearSyncSettings(): void {
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {
    // ignore
  }
}

export type SyncAction = 'created' | 'uploaded' | 'synced';

export interface SyncCounts {
  objects: number;
  lists: number;
  schedules: number;
  plans: number;
}

export interface SyncOutcome {
  gistId: string;
  database: Database;
  action: SyncAction;
  remote: SyncCounts | null;
  result: SyncCounts;
}

function counts(db: Database): SyncCounts {
  return {
    objects: db.objects.length,
    lists: db.lists.length,
    schedules: db.schedules.length,
    plans: db.plans.length,
  };
}

export async function runSync(config: SyncSettings, local: Database): Promise<SyncOutcome> {
  if (!config.token.trim()) throw new Error('请先填写 GitHub Token');
  if (!config.passphrase) throw new Error('请先设置同步口令');

  const encryptedLocal = await encryptJson(config.passphrase, local);
  let gistId = config.gistId.trim();

  if (!gistId) {
    gistId = await createGist(config.token, encryptedLocal);
    return { gistId, database: local, action: 'created', remote: null, result: counts(local) };
  }

  const remoteRaw = await fetchGist(config.token, gistId);
  if (!remoteRaw) {
    await updateGist(config.token, gistId, encryptedLocal);
    return { gistId, database: local, action: 'uploaded', remote: null, result: counts(local) };
  }

  const remote = await decryptJson<Database>(config.passphrase, remoteRaw);
  const merged = mergeDatabases(local, remote);
  await updateGist(config.token, gistId, await encryptJson(config.passphrase, merged));
  return {
    gistId,
    database: merged,
    action: 'synced',
    remote: counts(remote),
    result: counts(merged),
  };
}
