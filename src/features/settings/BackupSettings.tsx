import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { currentDatabase, useStore } from '../../store/useStore';
import { parseDatabase, serializeDatabase } from '../../storage/db';
import {
  deleteSnapshot,
  listSnapshots,
  pruneSnapshots,
  saveSnapshot,
  type Snapshot,
} from '../../utils/backup';
import { downloadText } from '../../utils/exportPlan';
import styles from './BackupSettings.module.css';

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function BackupSettings() {
  const importDatabase = useStore((s) => s.importDatabase);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [supported] = useState(() => typeof indexedDB !== 'undefined');

  const refresh = useCallback(() => {
    if (typeof indexedDB === 'undefined') return;
    void listSnapshots()
      .then(setSnapshots)
      .catch(() => {
        /* ignore */
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const backupNow = async () => {
    await saveSnapshot(serializeDatabase(currentDatabase()));
    await pruneSnapshots(10);
    refresh();
  };

  const restore = (snapshot: Snapshot) => {
    const result = parseDatabase(snapshot.json);
    if (!result.ok || !result.database) {
      window.alert('该备份无法解析。');
      return;
    }
    if (window.confirm('恢复将覆盖当前全部数据，确定继续？')) {
      importDatabase(result.database);
      window.alert('已恢复。');
    }
  };

  const remove = async (snapshot: Snapshot) => {
    if (!window.confirm('删除这份备份？')) return;
    await deleteSnapshot(snapshot.id);
    refresh();
  };

  if (!supported) {
    return <p className={styles.hint}>当前浏览器不支持本地备份。</p>;
  }

  return (
    <div>
      <p className={styles.hint}>
        应用会自动保留最近 {10} 份本地快照（约每 5 分钟或切到后台时），存在 IndexedDB，不占 localStorage。
      </p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={backupNow}>
          立即备份
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <p className={styles.muted}>还没有备份。</p>
      ) : (
        <div className={styles.list}>
          {snapshots.map((s) => (
            <div key={s.id} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.date}>{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                <span className={styles.size}>{formatSize(s.json.length)}</span>
              </div>
              <div className={styles.rowActions}>
                <Button size="sm" onClick={() => restore(s)}>
                  恢复
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    downloadText(
                      `拾集备份-${s.createdAt.slice(0, 19).replace(/[:T]/g, '-')}.json`,
                      s.json,
                      'application/json',
                    )
                  }
                >
                  导出
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
