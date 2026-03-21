import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { PlannerUpsertRequest } from '../../types/planner';
import { usePlanner } from './index';

const usePutPlanner = () => {
  const { upsertPlanner } = usePlanner();

  const mutationFn = useCallback(
    (payload: PlannerUpsertRequest) => upsertPlanner(payload),
    [upsertPlanner],
  );

  return useMutation({
    mutationFn,
  });
};

export default usePutPlanner;
