import styles from './RouteFallback.module.css';

export function RouteFallback() {
  return (
    <div className={styles.fallback} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      加载中…
    </div>
  );
}
