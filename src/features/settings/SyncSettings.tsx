import { useState } from 'react';
import { Button } from '../../components/Button';
import { Field, TextInput } from '../../components/forms';
import { currentDatabase, useStore } from '../../store/useStore';
import { verifyToken } from '../../utils/gist';
import {
  clearSyncSettings,
  emptySyncSettings,
  loadSyncSettings,
  runSync,
  saveSyncSettings,
  type SyncSettings as Settings,
} from '../../utils/sync';
import styles from './SyncSettings.module.css';

export function SyncSettings() {
  const importDatabase = useStore((s) => s.importDatabase);
  const [settings, setSettings] = useState<Settings>(() => loadSyncSettings());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const save = () => {
    saveSyncSettings(settings);
    setError('');
    setMessage('配置已保存到本机。');
  };

  const checkToken = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const login = await verifyToken(settings.token.trim());
      setMessage(`Token 有效，已登录为 ${login}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '校验失败');
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const outcome = await runSync(settings, currentDatabase());
      importDatabase(outcome.database);
      const next: Settings = {
        ...settings,
        gistId: outcome.gistId,
        lastSyncAt: new Date().toISOString(),
      };
      setSettings(next);
      saveSyncSettings(next);
      const r = outcome.result;
      const summary = `对象 ${r.objects} · 清单 ${r.lists} · 日程 ${r.schedules} · 计划 ${r.plans}`;
      const label =
        outcome.action === 'created'
          ? `已创建新的私有 Gist（ID 见下方）。请在其它设备填入同一个 Gist ID 和相同口令，再点同步。`
          : outcome.action === 'uploaded'
            ? `云端为空，已上传本地数据。`
            : `已双向合并。云端原有 ${outcome.remote?.objects ?? 0} 个对象，合并后：${summary}。`;
      setMessage(label);
    } catch (e) {
      setError(e instanceof Error ? e.message : '同步失败');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    if (!window.confirm('确定清除本机的同步配置？（不会删除 GitHub 上的数据）')) return;
    clearSyncSettings();
    setSettings({ ...emptySyncSettings });
    setMessage('已清除同步配置。');
    setError('');
  };

  const copyGistId = async () => {
    try {
      await navigator.clipboard.writeText(settings.gistId);
      setMessage('Gist ID 已复制。');
    } catch {
      setError('复制失败，请手动选择复制。');
    }
  };

  const lastSync = settings.lastSyncAt
    ? new Date(settings.lastSyncAt).toLocaleString('zh-CN')
    : '从未';

  return (
    <div>
      <p className={styles.hint}>
        通过你自己的 GitHub 私有 Gist 同步。数据在本地用口令加密后才上传，GitHub 上只有密文。
        <br />
        Token 只需 <code>gist</code> 权限；首次同步会自动创建私有 Gist。
      </p>

      <Field label="GitHub Token">
        <TextInput
          type="password"
          value={settings.token}
          onChange={(e) => update({ token: e.target.value })}
          placeholder="ghp_… / github_pat_…"
          autoComplete="off"
        />
      </Field>

      <Field label="Gist ID" hint="留空则首次同步时自动创建">
        <TextInput
          value={settings.gistId}
          onChange={(e) => update({ gistId: e.target.value })}
          placeholder="留空自动创建"
          autoComplete="off"
        />
      </Field>

      <Field label="同步口令" hint="用于加密，务必牢记；换设备需输入同一口令">
        <TextInput
          type="password"
          value={settings.passphrase}
          onChange={(e) => update({ passphrase: e.target.value })}
          placeholder="自定义口令"
          autoComplete="off"
        />
      </Field>

      {settings.gistId && (
        <p className={styles.gistId}>
          <span>当前 Gist ID：</span>
          <code>{settings.gistId}</code>
          <button type="button" onClick={copyGistId}>
            复制
          </button>
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="primary" onClick={sync} disabled={busy}>
          {busy ? '同步中…' : '立即同步'}
        </Button>
        <Button onClick={save} disabled={busy}>
          保存配置
        </Button>
        <Button onClick={checkToken} disabled={busy || !settings.token.trim()}>
          校验 Token
        </Button>
        <Button variant="ghost" onClick={clear} disabled={busy}>
          清除配置
        </Button>
      </div>

      <p className={styles.status}>上次同步：{lastSync}</p>
      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.warn}>
        注意：Token 和口令保存在本机浏览器中，请勿在公用电脑上使用。
      </p>
    </div>
  );
}
