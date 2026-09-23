import { useEffect } from 'react';
import { currentDatabase } from '../../store/useStore';
import { serializeDatabase } from '../../storage/db';
import { pruneSnapshots, saveSnapshot } from '../../utils/backup';

const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
const KEEP = 10;

function hasData(): boolean {
  const db = currentDatabase();
  return (
    db.objects.length > 0 ||
    db.lists.length > 0 ||
    db.schedules.length > 0 ||
    db.plans.length > 0
  );
}

export function BackupManager() {
  useEffect(() => {
    let lastJson = '';

    const backup = () => {
      if (!hasData()) return;
      const json = serializeDatabase(currentDatabase());
      if (json === lastJson) return;
      lastJson = json;
      void saveSnapshot(json)
        .then(() => pruneSnapshots(KEEP))
        .catch(() => {
          /* IndexedDB unavailable */
        });
    };

    const startTimer = window.setTimeout(backup, 5000);
    const interval = window.setInterval(backup, BACKUP_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') backup();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
