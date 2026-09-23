const DB_NAME = 'shiji-backups';
const STORE = 'snapshots';
const DB_VERSION = 1;

export interface Snapshot {
  id: number;
  createdAt: string;
  json: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

export async function saveSnapshot(json: string): Promise<void> {
  await tx('readwrite', (store) =>
    store.add({ createdAt: new Date().toISOString(), json }),
  );
}

export async function listSnapshots(): Promise<Snapshot[]> {
  const all = await tx<Snapshot[]>('readonly', (store) => store.getAll() as IDBRequest<Snapshot[]>);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSnapshot(id: number): Promise<Snapshot | undefined> {
  return tx<Snapshot | undefined>('readonly', (store) => store.get(id) as IDBRequest<Snapshot | undefined>);
}

export async function deleteSnapshot(id: number): Promise<void> {
  await tx('readwrite', (store) => store.delete(id));
}

export async function pruneSnapshots(keep = 10): Promise<void> {
  const all = await listSnapshots();
  await Promise.all(all.slice(keep).map((s) => deleteSnapshot(s.id)));
}
