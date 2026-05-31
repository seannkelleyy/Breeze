import { useCallback, useMemo } from 'react';

import useHttp from './useHttp';

interface GraphQLErrorItem {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorItem[];
}

const useGraphql = () => {
  const { post } = useHttp();

  const request = useCallback(
    async <TData, TVariables = Record<string, unknown>>(
      query: string,
      variables?: TVariables,
    ): Promise<TData> => {
      const response = await post<
        GraphQLResponse<TData>,
        { query: string; variables?: TVariables }
      >('query', {
        query,
        variables,
      });

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.map((item) => item.message).join('; '));
      }

      // `null` is a valid GraphQL response (e.g., user not found)
      // Only throw if the response itself is missing or undefined
      if (response.data === undefined) {
        throw new Error('GraphQL response did not include data');
      }

      return response.data;
    },
    [post],
  );

  return useMemo(() => ({ request }), [request]);
};

export default useGraphql;
