import { useState } from 'react';
import { Button } from '../../components/Button';
import { useStore } from '../../store/useStore';
import { describeReminder } from '../../utils/reminders';
import { showLocalNotification } from '../../utils/notify';
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
      await showLocalNotification('拾集', { body: '提醒已开启，日程到点会通知你。' });
    }
  };

  const test = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        window.alert('需要允许通知才能测试。');
        return;
      }
    }
    const ok = await showLocalNotification('拾集测试提醒', {
      body: '如果你看到这条通知，说明提醒能用。',
    });
    if (!ok) window.alert('通知发送失败，可能未授予权限或系统限制。');
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
          通知被禁用。请到浏览器/系统设置里允许本网站的通知后重试。
        </p>
      )}
      {permission === 'default' && (
        <p className={styles.hint}>
          点「开启提醒」允许通知，再用「测试提醒」验证。
        </p>
      )}

      {permission !== 'unsupported' && (
        <div className={styles.actions}>
          {permission !== 'granted' && (
            <Button variant="primary" onClick={request}>
              开启提醒
            </Button>
          )}
          <Button onClick={test}>测试提醒</Button>
        </div>
      )}

      <p className={styles.hint}>
        共 {active.length} 个启用中的日程会提醒（无时间的按 09:00）。
        <br />
        注意：提醒只在 App 打开或前台时有效，手机切到后台会被系统暂停。
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
