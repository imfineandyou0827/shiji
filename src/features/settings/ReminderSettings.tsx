import { useState } from 'react';
import { Button } from '../../components/Button';
import { useStore } from '../../store/useStore';
import { describeReminder } from '../../utils/reminders';
import styles from './ReminderSettings.module.css';

function currentPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export function ReminderSettings() {
  const schedules = useStore((s) => s.schedules);
  const [permission, setPermission] = useState(currentPermission);

  const request = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('拾集', { body: '提醒已开启，日程到点会通知你。', icon: '/pwa-192x192.png' });
    }
  };

  const active = schedules.filter((s) => s.active);

  return (
    <div>
      {permission === 'unsupported' && (
        <p className={styles.hint}>当前浏览器不支持通知。</p>
      )}
      {permission === 'granted' && (
        <p className={styles.ok}>提醒已开启。日程到点时会弹出通知。</p>
      )}
      {permission === 'denied' && (
        <p className={styles.warn}>
          通知被禁用。请在浏览器地址栏的站点设置里允许通知后重试。
        </p>
      )}
      {permission === 'default' && (
        <>
          <p className={styles.hint}>
            开启后，日程到点会弹出系统通知（例如「番剧更新」「出发集合」）。
          </p>
          <Button variant="primary" onClick={request}>
            开启提醒
          </Button>
        </>
      )}

      <p className={styles.hint}>
        共 {active.length} 个启用中的日程会提醒（无时间的按 09:00）。
        <br />
        网页提醒只在 App 打开或前台时有效，手机后台会被系统暂停。
        <br />
        <strong>想要关着 App 也能提醒</strong>：到「日程」页点「导出到日历」，把 .ics 导入手机系统日历，由系统日历负责提醒。
      </p>

      {active.length > 0 && (
        <ul className={styles.list}>
          {active.slice(0, 8).map((s) => (
            <li key={s.id}>
              <span>{s.title}</span>
              <span className={styles.time}>{describeReminder(s)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
