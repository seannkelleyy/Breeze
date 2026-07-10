import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Goal } from '../../types/goal';
import { useGoals } from './index';

interface FetchGoalProps {
  userId: string;
}

/**
 * A hook for fetching goal data.
 * @param props.userId: The user id to fetch goals from.
 */
const useFetchGoals = ({}: FetchGoalProps) => {
  const { getGoals } = useGoals();

  const fetchGoals = useCallback(() => {
    return getGoals();
  }, [getGoals]);

  return useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
    enabled: true,
  });
};

export default useFetchGoals;
