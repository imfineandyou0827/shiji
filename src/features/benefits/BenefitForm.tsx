import { useState } from 'react';
import type { Benefit, BenefitCategory, BenefitPerk } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Field, Select, TextArea, TextInput } from '../../components/forms';
import { parseTags, tagsToInput } from '../../utils/format';
import { createId } from '../../utils/id';
import type { BenefitInput } from '../../store/useStore';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_LABEL } from './categories';
import styles from './BenefitForm.module.css';

const ICONS = [
  '💳', '🏦', '🛡️', '🎫', '✈️', '🏥', '🛒', '📺',
  '🏨', '🚗', '☕', '🎁', '🏋️', '🅿️', '📱', '🎟️',
];

interface BenefitFormProps {
  open: boolean;
  initial?: Benefit | null;
  onClose: () => void;
  onSubmit: (input: BenefitInput) => void;
}

export function BenefitForm(props: BenefitFormProps) {
  if (!props.open) return null;
  return <BenefitFormBody {...props} />;
}

function BenefitFormBody({ initial, onClose, onSubmit }: BenefitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<BenefitCategory>(initial?.category ?? 'card');
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '💳');
  const [identifier, setIdentifier] = useState(initial?.identifier ?? '');
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [tagsInput, setTagsInput] = useState(initial ? tagsToInput(initial.tags) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [perks, setPerks] = useState<BenefitPerk[]>(initial?.perks ?? []);

  const valid = title.trim().length > 0;

  const addPerk = () =>
    setPerks((prev) => [
      ...prev,
      { id: createId(), title: '', note: '', expiresAt: null, used: false },
    ]);

  const updatePerk = (id: string, patch: Partial<BenefitPerk>) =>
    setPerks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePerk = (id: string) => setPerks((prev) => prev.filter((p) => p.id !== id));

  const submit = () => {
    if (!valid) return;
    onSubmit({
      title: title.trim(),
      category,
      provider: provider.trim(),
      icon,
      iconType: 'emoji',
      identifier: identifier.trim(),
      link: link.trim(),
      expiresAt: expiresAt || null,
      tags: parseTags(tagsInput),
      perks: perks
        .map((p) => ({ ...p, title: p.title.trim(), note: p.note.trim() }))
        .filter((p) => p.title),
      notes: notes.trim(),
      active: initial?.active ?? true,
    });
    onClose();
  };

  return (
    <Modal
      open
      title={initial ? '编辑权益' : '新建权益'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid}>
            保存
          </Button>
        </>
      }
    >
      <Field label="图标">
        <div className={styles.iconGrid}>
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={[styles.iconBtn, icon === i ? styles.iconActive : ''].join(' ')}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>

      <Field label="名称">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：招行经典白金卡"
        />
      </Field>

      <div className={styles.row}>
        <Field label="类型">
          <Select value={category} onChange={(e) => setCategory(e.target.value as BenefitCategory)}>
            {BENEFIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {BENEFIT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="机构 / 品牌">
          <TextInput
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="例如：招商银行"
          />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label="卡号 / 保单号 / 会员号">
          <TextInput
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="选填"
          />
        </Field>
        <Field label="有效期至">
          <TextInput type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </div>

      <Field label="详情 / 领取链接">
        <TextInput
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <Field label="标签" hint="用逗号或空格分隔">
        <TextInput
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例如：出行, 每年 6 次"
        />
      </Field>

      <div className={styles.perksHead}>
        <span className={styles.perksLabel}>权益条目</span>
        <Button size="sm" variant="ghost" onClick={addPerk}>
          + 添加权益
        </Button>
      </div>
      {perks.length === 0 ? (
        <p className={styles.perksEmpty}>
          还没有权益条目，点「添加权益」把这张卡 / 保单 / 会员附带的具体权益列出来。
        </p>
      ) : (
        <div className={styles.perks}>
          {perks.map((perk) => (
            <div key={perk.id} className={styles.perkRow}>
              <TextInput
                value={perk.title}
                onChange={(e) => updatePerk(perk.id, { title: e.target.value })}
                placeholder="权益名称，如：机场贵宾厅"
                aria-label="权益名称"
              />
              <TextInput
                value={perk.note}
                onChange={(e) => updatePerk(perk.id, { note: e.target.value })}
                placeholder="额度 / 说明，如：每年 6 次"
                aria-label="权益说明"
              />
              <div className={styles.perkFoot}>
                <label className={styles.perkDate}>
                  到期
                  <TextInput
                    type="date"
                    value={perk.expiresAt ?? ''}
                    onChange={(e) => updatePerk(perk.id, { expiresAt: e.target.value || null })}
                    aria-label="权益到期日"
                  />
                </label>
                <label className={styles.perkUsed}>
                  <input
                    type="checkbox"
                    checked={perk.used}
                    onChange={(e) => updatePerk(perk.id, { used: e.target.checked })}
                  />
                  已使用
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePerk(perk.id)}
                  aria-label="删除权益条目"
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Field label="备注">
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="补充说明，如激活方式、客服电话…"
        />
      </Field>
    </Modal>
  );
}
