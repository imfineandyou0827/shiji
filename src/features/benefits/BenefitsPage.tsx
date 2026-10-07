import { useMemo, useState } from 'react';
import type { Benefit } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import { TagList } from '../../components/Tag';
import { TextInput } from '../../components/forms';
import { toISODate } from '../../utils/date';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_LABEL } from './categories';
import { BenefitForm } from './BenefitForm';
import styles from './BenefitsPage.module.css';

export function BenefitsPage() {
  const benefits = useStore((s) => s.benefits);
  const addBenefit = useStore((s) => s.addBenefit);
  const updateBenefit = useStore((s) => s.updateBenefit);
  const removeBenefit = useStore((s) => s.removeBenefit);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Benefit['category'] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Benefit | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const today = toISODate(new Date());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return benefits.filter((b) => {
      if (category && b.category !== category) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.provider.toLowerCase().includes(q) ||
        b.identifier.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        b.perks.some(
          (p) => p.title.toLowerCase().includes(q) || p.note.toLowerCase().includes(q),
        )
      );
    });
  }, [benefits, query, category]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (benefit: Benefit) => {
    setEditing(benefit);
    setFormOpen(true);
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const togglePerk = (benefit: Benefit, perkId: string) =>
    updateBenefit(benefit.id, {
      perks: benefit.perks.map((p) => (p.id === perkId ? { ...p, used: !p.used } : p)),
    });

  return (
    <div>
      <PageHeader
        title="权益"
        subtitle="记录银行卡、保险、会员等附带的权益，别忘了在到期前用掉"
        actions={
          <Button variant="primary" onClick={openNew}>
            + 新建权益
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索名称、机构、权益…"
          aria-label="搜索权益"
        />
      </div>

      <div className={styles.chips}>
        <button
          className={[styles.chip, category === null ? styles.chipActive : ''].join(' ')}
          onClick={() => setCategory(null)}
        >
          全部
        </button>
        {BENEFIT_CATEGORIES.map((c) => (
          <button
            key={c}
            className={[styles.chip, category === c ? styles.chipActive : ''].join(' ')}
            onClick={() => setCategory(c)}
          >
            {BENEFIT_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {benefits.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="还没有权益"
          description="把银行卡、保险、会员等附带的权益记下来，比如「机场贵宾厅」「免费体检」，需要时一眼就能找到。"
          action={
            <Button variant="primary" onClick={openNew}>
              + 新建权益
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="没有匹配的权益" description="换个关键词或类型试试。" />
      ) : (
        <div className={styles.list}>
          {filtered.map((b) => {
            const isExpired = b.expiresAt !== null && b.expiresAt < today;
            const isOpen = expanded.includes(b.id);
            const usedCount = b.perks.filter((p) => p.used).length;
            return (
              <article
                key={b.id}
                className={[styles.card, b.active ? '' : styles.inactive].join(' ')}
              >
                <div className={styles.head}>
                  <span className={styles.icon}>
                    <Icon value={b.icon} type={b.iconType} size={26} />
                  </span>
                  <div className={styles.headMain}>
                    <div className={styles.titleRow}>
                      <strong>{b.title}</strong>
                      <span className={styles.category}>{BENEFIT_CATEGORY_LABEL[b.category]}</span>
                      {isExpired && <span className={styles.expired}>已过期</span>}
                    </div>
                    <div className={styles.meta}>
                      {b.provider && <span>{b.provider}</span>}
                      {b.identifier && <span className={styles.mono}>{b.identifier}</span>}
                      {b.expiresAt && <span>有效期至 {b.expiresAt}</span>}
                      {b.link && (
                        <a
                          className={styles.link}
                          href={b.link}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          🔗 详情
                        </a>
                      )}
                    </div>
                  </div>
                  <label className={styles.toggle} title="是否仍在用">
                    <input
                      type="checkbox"
                      checked={b.active}
                      onChange={(e) => updateBenefit(b.id, { active: e.target.checked })}
                      aria-label="是否仍在用"
                    />
                    <span className={styles.switch} />
                  </label>
                  <div className={styles.actions}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`删除权益「${b.title}」？`)) removeBenefit(b.id);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>

                {b.perks.length > 0 ? (
                  <>
                    <button
                      className={styles.perksToggle}
                      onClick={() => toggleExpanded(b.id)}
                      aria-expanded={isOpen}
                    >
                      <span>{isOpen ? '▾' : '▸'}</span>
                      {b.perks.length} 项权益 · 已用 {usedCount}/{b.perks.length}
                    </button>
                    {isOpen && (
                      <ul className={styles.perks}>
                        {b.perks.map((perk) => {
                          const perkExpired = perk.expiresAt !== null && perk.expiresAt < today;
                          return (
                            <li
                              key={perk.id}
                              className={[styles.perk, perk.used ? styles.perkUsed : ''].join(' ')}
                            >
                              <label className={styles.perkCheck}>
                                <input
                                  type="checkbox"
                                  checked={perk.used}
                                  onChange={() => togglePerk(b, perk.id)}
                                  aria-label={`${perk.title} 是否已使用`}
                                />
                                <span className={styles.perkBox}>{perk.used ? '✓' : ''}</span>
                              </label>
                              <div className={styles.perkMain}>
                                <span className={styles.perkTitle}>{perk.title}</span>
                                {perk.note && <span className={styles.perkNote}>{perk.note}</span>}
                              </div>
                              {perk.expiresAt && (
                                <span
                                  className={[styles.perkExpiry, perkExpired ? styles.expired : '']
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {perkExpired ? '已过期 ' : ''}
                                  {perk.expiresAt}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className={styles.noPerks}>暂无权益条目，点「编辑」添加。</p>
                )}

                {b.notes && <p className={styles.notes}>{b.notes}</p>}
                {b.tags.length > 0 && (
                  <div className={styles.tags}>
                    <TagList tags={b.tags} max={8} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <BenefitForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) updateBenefit(editing.id, input);
          else addBenefit(input);
        }}
      />
    </div>
  );
}
