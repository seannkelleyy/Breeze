import { useMemo } from 'react';

import type { ChartConfig } from '@/components/ui/chart';
import { accountLineColors, plannerChartConfig } from '../../../lib/plannerMath';
import type { PlannerAccount } from '../../../types/account';

export function useChartConfig(accounts: PlannerAccount[]) {
  return useMemo(() => {
    const entries = Object.fromEntries(
      accounts.map((a, i) => [
        `account-${i}`,
        { label: a.name, color: accountLineColors[i % accountLineColors.length] },
      ]),
    );
    return { ...plannerChartConfig, ...entries } satisfies ChartConfig;
  }, [accounts]);
}
