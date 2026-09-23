import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import styles from './InstallApp.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent));

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || isStandalone()) {
    return <p className={styles.hint}>已安装到设备，可从桌面图标独立打开，支持离线使用。</p>;
  }

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div>
      {deferred ? (
        <Button variant="primary" onClick={install}>
          安装到设备
        </Button>
      ) : isIOS ? (
        <p className={styles.hint}>
          在 Safari 中点击底部的「分享」按钮 → 选择「添加到主屏幕」，即可像 App 一样使用。
        </p>
      ) : (
        <p className={styles.hint}>
          在浏览器菜单中选择「安装应用 / 添加到主屏幕」即可安装；安装后支持离线使用。
        </p>
      )}
    </div>
  );
}
