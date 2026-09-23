import type { Plan } from '../../types';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useStore } from '../../store/useStore';
import {
  downloadText,
  planToHtml,
  planToMarkdown,
  printHtml,
  safeFilename,
} from '../../utils/exportPlan';
import styles from './ExportDialog.module.css';

interface ExportDialogProps {
  open: boolean;
  plan: Plan;
  onClose: () => void;
}

export function ExportDialog(props: ExportDialogProps) {
  if (!props.open) return null;
  return <ExportDialogBody {...props} />;
}

function ExportDialogBody({ plan, onClose }: Omit<ExportDialogProps, 'open'>) {
  const objects = useStore((s) => s.objects);
  const lists = useStore((s) => s.lists);
  const schedules = useStore((s) => s.schedules);
  const ctx = { objects, lists, schedules };
  const base = safeFilename(plan.title);

  const exportMarkdown = () => {
    downloadText(`${base}.md`, planToMarkdown(plan, ctx), 'text/markdown');
    onClose();
  };

  const exportHtml = () => {
    downloadText(`${base}.html`, planToHtml(plan, ctx), 'text/html');
    onClose();
  };

  const exportPdf = () => {
    printHtml(planToHtml(plan, ctx));
    onClose();
  };

  return (
    <Modal
      open
      title="导出计划"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <p className={styles.hint}>
        HTML 会内嵌轨迹图形，可离线打开；PDF 会打开打印窗口，选择「另存为 PDF」即可。
      </p>
      <div className={styles.options}>
        <button className={styles.option} onClick={exportMarkdown}>
          <span className={styles.icon}>📝</span>
          <span className={styles.title}>Markdown</span>
          <span className={styles.sub}>.md 纯文本，便于编辑或粘贴</span>
        </button>
        <button className={styles.option} onClick={exportHtml}>
          <span className={styles.icon}>🌐</span>
          <span className={styles.title}>HTML</span>
          <span className={styles.sub}>.html 自包含，含轨迹图形</span>
        </button>
        <button className={styles.option} onClick={exportPdf}>
          <span className={styles.icon}>🖨️</span>
          <span className={styles.title}>PDF</span>
          <span className={styles.sub}>通过浏览器打印另存为 PDF</span>
        </button>
      </div>
    </Modal>
  );
}
