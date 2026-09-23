const icon = `${import.meta.env.BASE_URL}pwa-192x192.png`;

export async function showLocalNotification(
  title: string,
  options: NotificationOptions = {},
): Promise<boolean> {
  const opts: NotificationOptions = { icon, badge: icon, ...options };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, opts);
        return true;
      }
    }
  } catch {
    // fall through
  }
  try {
    new Notification(title, opts);
    return true;
  } catch {
    return false;
  }
}
