import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { occurrenceOn } from '../../utils/reminders';
import { showLocalNotification } from '../../utils/notify';

const NOTIFIED_KEY = 'shiji:notified';
const WINDOW_MS = 15 * 60_000;
const CHECK_MS = 45_000;
const PRUNE_DAYS = 8;

type Notified = Record<string, string>;

function loadNotified(): Notified {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '{}') as Notified;
  } catch {
    return {};
  }
}

function prune(notified: Notified, now: number): Notified {
  const cutoff = now - PRUNE_DAYS * 24 * 60 * 60 * 1000;
  const next: Notified = {};
  for (const [key, iso] of Object.entries(notified)) {
    if (new Date(iso).getTime() >= cutoff) next[key] = iso;
  }
  return next;
}

export function ReminderManager() {
  useEffect(() => {
    const check = async () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const now = new Date();
      const nowMs = now.getTime();
      const notified = loadNotified();
      let changed = false;

      for (const schedule of useStore.getState().schedules) {
        const occurrence = occurrenceOn(schedule, now);
        if (!occurrence) continue;
        const diff = nowMs - occurrence.getTime();
        if (diff < 0 || diff >= WINDOW_MS) continue;
        const key = `${schedule.id}:${occurrence.toISOString()}`;
        if (notified[key]) continue;
        const body = schedule.time ? `今天 ${schedule.time} · ${schedule.title}` : schedule.title;
        await showLocalNotification('拾集提醒', { body, tag: key });
        notified[key] = now.toISOString();
        changed = true;
      }

      const pruned = prune(notified, nowMs);
      if (changed || Object.keys(pruned).length !== Object.keys(notified).length) {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(pruned));
      }
    };

    void check();
    const id = window.setInterval(() => void check(), CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
