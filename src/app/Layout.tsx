import { NavLink, Outlet } from 'react-router-dom';
import { ReminderManager } from '../features/reminders/ReminderManager';
import { BackupManager } from '../features/backup/BackupManager';
import styles from './Layout.module.css';

const NAV = [
  { to: '/', label: '对象库', icon: '🧳', end: true },
  { to: '/lists', label: '清单', icon: '📋', end: false },
  { to: '/schedules', label: '日程', icon: '🗓️', end: false },
  { to: '/plans', label: '计划', icon: '🥾', end: false },
  { to: '/settings', label: '设置', icon: '⚙️', end: false },
];

export function Layout() {
  return (
    <div className={styles.shell}>
      <ReminderManager />
      <BackupManager />
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>拾</span>
          <span className={styles.name}>拾集</span>
        </div>
        <nav className={styles.topNav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [styles.topLink, isActive ? styles.active : ''].filter(Boolean).join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.tabIcon}>{item.icon}</span>
            <span className={styles.tabLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
