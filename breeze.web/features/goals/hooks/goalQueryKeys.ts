const GOALS_QUERY_ROOT = ['goals'] as const;

export const goalQueryKeys = {
  all: GOALS_QUERY_ROOT,
  byUser: (userId: string | null) => [...GOALS_QUERY_ROOT, userId] as const,
};
