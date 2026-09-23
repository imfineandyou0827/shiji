import type { IconType } from '../types';
import styles from './Icon.module.css';

interface IconProps {
  value: string;
  type?: IconType;
  size?: number;
  alt?: string;
}

export function Icon({ value, type = 'emoji', size = 24, alt = '' }: IconProps) {
  if (type === 'image' && value) {
    return (
      <img
        src={value}
        alt={alt}
        className={styles.image}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className={styles.emoji} style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {value || '📦'}
    </span>
  );
}
