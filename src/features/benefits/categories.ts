import type { BenefitCategory } from '../../types';

export const BENEFIT_CATEGORY_LABEL: Record<BenefitCategory, string> = {
  card: '银行卡',
  insurance: '保险',
  membership: '会员',
  other: '其他',
};

export const BENEFIT_CATEGORIES: BenefitCategory[] = ['card', 'insurance', 'membership', 'other'];
