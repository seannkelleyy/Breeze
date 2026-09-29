/**
 * Wealth by tax treatment: splits investment balances into pre-tax / Roth /
 * taxable buckets — the raw material for retirement drawdown planning.
 * Property (home/vehicle) and liabilities are excluded: they aren't
 * drawdown buckets. Split accounts (e.g. a 70/30 401(k)) feed both sides
 * proportionally, using the same share as the paycheck waterfall.
 */
import type { PlannerAccount } from '../../future/types/account';
import { isCombinedAssetType, isLiabilityAccountType, TAX_ADVANTAGED_ACCOUNT_TYPES } from '../../future/lib/config';
import { getPretaxShare } from '../../future/lib/paycheck';

export type WealthBucketKey = 'pretax' | 'roth' | 'taxable';

export interface WealthBucketAccount {
  id: string;
  name: string;
  personIds: string[];
  amount: number;
}

export interface WealthBucket {
  key: WealthBucketKey;
  label: string;
  description: string;
  balance: number;
  percent: number;
  accounts: WealthBucketAccount[];
}

export interface WealthByTreatment {
  buckets: WealthBucket[];
  totalInvestment: number;
}

export function getWealthByTaxTreatment(accounts: PlannerAccount[]): WealthByTreatment {
  const totals: Record<WealthBucketKey, number> = { pretax: 0, roth: 0, taxable: 0 };
  const byBucket: Record<WealthBucketKey, WealthBucketAccount[]> = {
    pretax: [],
    roth: [],
    taxable: [],
  };

  for (const account of accounts) {
    if (isLiabilityAccountType(account.accountType)) continue;
    if (isCombinedAssetType(account.accountType)) continue; // property equity isn't a drawdown bucket
    const balance = Math.max(0, account.startingBalance);
    if (balance <= 0) continue;

    if (TAX_ADVANTAGED_ACCOUNT_TYPES.has(account.accountType)) {
      const share = getPretaxShare(account);
      const pretax = balance * share;
      const roth = balance - pretax;
      if (pretax > 0) {
        totals.pretax += pretax;
        byBucket.pretax.push({ id: account.id, name: account.name, personIds: account.personIds, amount: pretax });
      }
      if (roth > 0) {
        totals.roth += roth;
        byBucket.roth.push({ id: account.id, name: account.name, personIds: account.personIds, amount: roth });
      }
    } else {
      totals.taxable += balance;
      byBucket.taxable.push({ id: account.id, name: account.name, personIds: account.personIds, amount: balance });
    }
  }

  const totalInvestment = totals.pretax + totals.roth + totals.taxable;
  const meta: Record<WealthBucketKey, { label: string; description: string }> = {
    pretax: {
      label: 'Pre-tax',
      description: 'Tax-deferred: every withdrawal in retirement is ordinary income.',
    },
    roth: {
      label: 'Roth',
      description: 'Tax-free: qualified withdrawals never count as income.',
    },
    taxable: {
      label: 'Taxable',
      description: 'Regular accounts: gains are taxable, but the basis is withdrawable anytime.',
    },
  };

  const buckets = (Object.keys(totals) as WealthBucketKey[]).map((key) => ({
    key,
    label: meta[key].label,
    description: meta[key].description,
    balance: totals[key],
    percent: totalInvestment > 0 ? totals[key] / totalInvestment : 0,
    accounts: byBucket[key],
  }));

  return { buckets, totalInvestment };
}
