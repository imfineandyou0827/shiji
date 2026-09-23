import { Link } from 'react-router-dom';
import type { AppObject } from '../../types';
import { Icon } from '../../components/Icon';
import { TagList } from '../../components/Tag';
import styles from './ObjectCard.module.css';

export function ObjectCard({ object }: { object: AppObject }) {
  return (
    <Link to={`/objects/${object.id}`} className={styles.card}>
      <div className={styles.media}>
        <Icon value={object.icon} type={object.iconType} size={40} alt={object.name} />
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{object.name}</h3>
          {object.kind === 'section' && (
            <span className={styles.badge}>
              {object.memberIds.length > 0 ? `分区 · ${object.memberIds.length}` : '分区'}
            </span>
          )}
        </div>
        {object.category && <span className={styles.category}>{object.category}</span>}
        {object.notes && <p className={styles.notes}>{object.notes}</p>}
        <TagList tags={object.tags} max={3} />
      </div>
    </Link>
  );
}
