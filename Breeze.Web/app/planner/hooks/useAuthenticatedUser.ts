'use client';
import { CREATE_USER_MUTATION, ME_QUERY } from '@/lib/services/queries/users';
import useGraphql from '@/lib/services/useGraphql';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface AuthenticatedUserData {
  id: string;
  email: string;
  inflationRate: string;
  safeWithdrawalRate: string;
  filingStatus: 'SINGLE' | 'MFJ' | 'MFS' | 'HOH';
  returnType: 'NOMINAL' | 'REAL';
  currencyType: string;
  deductionType: 'STANDARD' | 'ITEMIZED';
  deductionAmount?: string;
}

export function useAuthenticatedUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  // Query: Get backend user (returns null if not found - not an error)
  const meQuery = useQuery({
    queryKey: ['me', clerkUser?.id],
    queryFn: async () => {
      try {
        const result = await request<{ me: AuthenticatedUserData | null }>(ME_QUERY);
        // result.me will be null if user doesn't exist in DB
        // this is NOT an error, it's a valid response
        return result.me;
      } catch (error) {
        console.error('Me query error:', error);
        throw error;
      }
    },
    enabled: !!clerkUser?.id && clerkLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once before treating as "user not found"
  });

  // Mutation: Create user if missing
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!clerkUser?.id || !clerkUser?.primaryEmailAddress?.emailAddress) {
        throw new Error('Clerk user not ready');
      }
      console.log('Creating user for Clerk ID:', clerkUser.id);
      const input = {
        identityProviderId: clerkUser.id,
        email: clerkUser.primaryEmailAddress.emailAddress,
        inflationRate: '0.025', // 2.5% default
        safeWithdrawalRate: '0.04', // 4% default
        filingStatus: 'SINGLE',
        returnType: 'NOMINAL',
        currencyType: 'USD',
        deductionType: 'STANDARD',
        deductionAmount: '13850', // 2023 standard deduction for single
        payoffStrategy: 'AVALANCHE',
      };
      const result = await request<{ createUser: AuthenticatedUserData }>(CREATE_USER_MUTATION, {
        input,
      });
      console.log('User created successfully:', result.createUser.id);
      return result.createUser;
    },
    onSuccess: (newUser) => {
      console.log('Create user mutation succeeded, invalidating me query');
      // Invalidate and refetch the me query
      queryClient.setQueryData(['me', clerkUser?.id], newUser);
      meQuery.refetch();
    },
    onError: (error) => {
      console.error('Create user mutation failed:', error);
    },
  });

  // Auto-create user if:
  // 1. Me query finished loading
  // 2. Me query succeeded but returned null (user doesn't exist by Clerk ID)
  // 3. Create mutation is not already pending
  // 4. Create mutation hasn't failed yet (to prevent infinite retries)
  // 5. User has authenticated with Clerk
  useEffect(() => {
    const shouldCreateUser =
      clerkLoaded &&
      clerkUser?.id &&
      meQuery.isSuccess &&
      meQuery.data === null &&
      !createUserMutation.isPending &&
      !createUserMutation.isError; // Don't retry if mutation already failed

    if (shouldCreateUser) {
      console.log('Auto-creating user: me query returned null, triggering create mutation');
      createUserMutation.mutate();
    }
  }, [
    clerkLoaded,
    clerkUser?.id,
    meQuery.isSuccess,
    meQuery.data,
    createUserMutation.isPending,
    createUserMutation.isError,
  ]);

  // Derive return values
  const isLoading =
    !clerkLoaded || // Clerk still loading
    meQuery.isLoading || // Me query still loading
    (meQuery.isSuccess && meQuery.data === null && createUserMutation.isPending); // Create in progress

  const user = meQuery.data;
  const userId = user?.id || null;
  const isError = meQuery.isError || createUserMutation.isError;
  const error = meQuery.error || createUserMutation.error;

  return {
    userId,
    user,
    isLoading,
    isError,
    error,
    isCreatingUser: createUserMutation.isPending,
    clerkUser,
  };
}

export default useAuthenticatedUser;
