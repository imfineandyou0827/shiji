import { Link } from 'react-router-dom';
import type { AppObject, ListItem } from '../../types';
import { useStore } from '../../store/useStore';
import { Icon } from '../../components/Icon';
import { TagList } from '../../components/Tag';
import styles from './ListItemCard.module.css';

interface ListItemCardProps {
  listId: string;
  item: ListItem;
  object?: AppObject;
  sections: AppObject[];
  index: number;
  total: number;
}

export function ListItemCard({ listId, item, object, sections, index, total }: ListItemCardProps) {
  const updateListItem = useStore((s) => s.updateListItem);
  const removeListItem = useStore((s) => s.removeListItem);
  const moveListItem = useStore((s) => s.moveListItem);

  const name = object?.name ?? '（对象已删除）';

  return (
    <div className={[styles.card, item.checked ? styles.checked : ''].join(' ')}>
      <button
        className={[styles.check, item.checked ? styles.checkOn : ''].join(' ')}
        onClick={() => updateListItem(listId, item.id, { checked: !item.checked })}
        aria-label={item.checked ? '标记为未备好' : '标记为已备好'}
      >
        {item.checked ? '✓' : ''}
      </button>

      <div className={styles.media}>
        {object ? (
          <Icon value={object.icon} type={object.iconType} size={34} alt={name} />
        ) : (
          <span className={styles.missing}>?</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          {object ? (
            <Link to={`/objects/${object.id}`} className={styles.name}>
              {name}
            </Link>
          ) : (
            <span className={styles.name}>{name}</span>
          )}
          {object?.category && <span className={styles.category}>{object.category}</span>}
        </div>
        {object && object.tags.length > 0 && <TagList tags={object.tags} max={3} />}
        <input
          className={styles.note}
          value={item.note}
          placeholder="清单备注…"
          onChange={(e) => updateListItem(listId, item.id, { note: e.target.value })}
        />
        {sections.length > 0 && (
          <select
            className={styles.sectionSelect}
            value={item.sectionId ?? ''}
            onChange={(e) =>
              updateListItem(listId, item.id, { sectionId: e.target.value || null })
            }
            aria-label="所属分区"
          >
            <option value="">未分区</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.side}>
        <div className={styles.stepper}>
          <button onClick={() => updateListItem(listId, item.id, { quantity: Math.max(1, item.quantity - 1) })}>
            −
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => updateListItem(listId, item.id, { quantity: item.quantity + 1 })}>
            +
          </button>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => moveListItem(listId, item.id, -1)}
            disabled={index === 0}
            aria-label="上移"
          >
            ↑
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => moveListItem(listId, item.id, 1)}
            disabled={index === total - 1}
            aria-label="下移"
          >
            ↓
          </button>
          <button
            className={[styles.iconBtn, styles.remove].join(' ')}
            onClick={() => removeListItem(listId, item.id)}
            aria-label="移除"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
