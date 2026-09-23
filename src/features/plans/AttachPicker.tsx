import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import styles from './AttachPicker.module.css';

export interface AttachItem {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
}

interface AttachPickerProps {
  open: boolean;
  title: string;
  items: AttachItem[];
  emptyHint: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function AttachPicker({ open, title, items, emptyHint, onPick, onClose }: AttachPickerProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyHint}</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.row}
              onClick={() => {
                onPick(item.id);
                onClose();
              }}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span className={styles.info}>
                <span className={styles.label}>{item.label}</span>
                {item.sub && <span className={styles.sub}>{item.sub}</span>}
              </span>
              <span className={styles.add}>+</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          完成
        </Button>
      </div>
    </Modal>
  );
}
