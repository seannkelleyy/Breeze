import { useCallback } from 'react';
import { useMutation, UseMutationResult } from '@tanstack/react-query';

interface EntityMutationProps<TVars> {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * Factory for entity mutation hooks (post/patch/delete per budget entity).
 * Each generated hook pulls its service function from the entity's data hook
 * and wraps it in a react-query mutation with shared onSuccess/onSettled wiring.
 *
 * @param useService - Data hook exposing the entity's service functions.
 * @param toMutationFn - Adapts the service functions to a mutationFn taking the hook's variables.
 */
export function createMutationHook<TVars, TService>(
  useService: () => TService,
  toMutationFn: (service: TService) => (variables: TVars) => Promise<unknown>,
) {
  return function useEntityMutation(
    props: EntityMutationProps<TVars> = {},
  ): UseMutationResult<unknown, Error, TVars> {
    const service = useService();
    const mutationFn = useCallback(
      (variables: TVars) => toMutationFn(service)(variables),
      [service],
    );

    return useMutation({
      mutationFn,
      onSuccess: props.onSuccess,
      onSettled: props.onSettled,
    });
  };
}
