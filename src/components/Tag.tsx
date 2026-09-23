import styles from './Tag.module.css';

interface TagProps {
  children: string;
  tone?: 'default' | 'accent';
  className?: string;
}

export function Tag({ children, tone = 'default', className }: TagProps) {
  return (
    <span className={[styles.tag, styles[tone], className].filter(Boolean).join(' ')}>{children}</span>
  );
}

export function TagList({ tags, max = 4 }: { tags: string[]; max?: number }) {
  if (tags.length === 0) return null;
  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;
  return (
    <div className={styles.list}>
      {visible.map((t) => (
        <Tag key={t}>{t}</Tag>
      ))}
      {rest > 0 && <span className={styles.more}>+{rest}</span>}
    </div>
  );
}
