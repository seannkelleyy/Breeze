import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { PlannerResponse } from '../../types/planner';

const useFetchPlanner = () => {
  const fetchPlanner = useCallback(() => {
    const now = new Date().toISOString();
    return Promise.resolve({
      id: 0,
      userId: '',
      desiredInvestmentAmount: 0,
      monthlyExpenses: 0,
      inflationRate: 3,
      safeWithdrawalRate: 4,
      people: [],
      accounts: [],
      createdAtUtc: now,
      updatedAtUtc: now,
    });
  }, []);

  return useQuery<PlannerResponse, Error>({
    queryKey: ['planner'],
    queryFn: fetchPlanner,
    refetchInterval: false,
    retryDelay: 1 * 1000,
    retry: 0,
    enabled: true,
  });
};

export default useFetchPlanner;
