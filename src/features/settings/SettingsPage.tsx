import { useRef } from 'react';
import { currentDatabase, useStore } from '../../store/useStore';
import { parseDatabase, serializeDatabase } from '../../storage/db';

declare const __BUILD_TIME__: string;
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { InstallApp } from './InstallApp';
import { SyncSettings } from './SyncSettings';
import { ReminderSettings } from './ReminderSettings';
import { BackupSettings } from './BackupSettings';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const objects = useStore((s) => s.objects);
  const lists = useStore((s) => s.lists);
  const schedules = useStore((s) => s.schedules);
  const plans = useStore((s) => s.plans);
  const importDatabase = useStore((s) => s.importDatabase);
  const resetDatabase = useStore((s) => s.resetDatabase);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const text = serializeDatabase(currentDatabase());
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `拾集备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseDatabase(String(reader.result));
      if (!result.ok || !result.database) {
        window.alert(`导入失败：${result.error ?? '未知错误'}`);
        return;
      }
      const db = result.database;
      if (
        window.confirm(
          `导入将覆盖当前全部数据：${db.objects.length} 个对象、${db.lists.length} 份清单、${db.schedules.length} 条日程。继续？`,
        )
      ) {
        importDatabase(db);
        window.alert('导入完成。');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('确定清空所有对象、清单和日程？此操作不可撤销。')) {
      resetDatabase();
    }
  };

  return (
    <div>
      <PageHeader title="设置" subtitle="数据保存在本设备浏览器中，可随时备份或迁移" />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>数据概览</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{objects.length}</span>
            <span className={styles.statLabel}>对象</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{lists.length}</span>
            <span className={styles.statLabel}>清单</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{schedules.length}</span>
            <span className={styles.statLabel}>日程</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{plans.length}</span>
            <span className={styles.statLabel}>计划</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>安装到设备</h2>
        <InstallApp />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>日程提醒</h2>
        <ReminderSettings />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>云同步（GitHub Gist）</h2>
        <SyncSettings />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>本地自动备份</h2>
        <BackupSettings />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>备份与恢复</h2>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleExport}>
            导出 JSON 备份
          </Button>
          <Button onClick={() => fileRef.current?.click()}>导入 JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
        <p className={styles.hint}>导出文件可保存到网盘或另一台设备，导入时覆盖当前数据。</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>危险操作</h2>
        <Button variant="danger" onClick={handleReset}>
          清空全部数据
        </Button>
      </section>

      <p className={styles.buildInfo}>
        版本：构建于 {new Date(__BUILD_TIME__).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}
