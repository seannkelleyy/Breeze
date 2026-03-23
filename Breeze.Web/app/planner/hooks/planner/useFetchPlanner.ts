import { useCallback } from 'react';

import { useAuth } from '@/node_modules/@clerk/nextjs/dist/types';
import { useQuery } from '@tanstack/react-query';
import { PlannerResponse } from '../../types/planner';
import { usePlanner } from './index';

const useFetchPlanner = () => {
  const { isSignedIn } = useAuth();
  const { getPlanner } = usePlanner();

  const fetchPlanner = useCallback(() => {
    return getPlanner();
  }, [getPlanner]);

  return useQuery<PlannerResponse, Error>({
    queryKey: ['planner'],
    queryFn: fetchPlanner,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
    enabled: Boolean(isSignedIn),
  });
};

export default useFetchPlanner;
