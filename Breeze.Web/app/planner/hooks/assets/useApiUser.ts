import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import useApiUserBootstrap from '@/lib/services/useApiUserBootstrap';
import { ApiUser } from '../../types/apiAsset';

interface UseApiUserProps {
  identityProviderId: string;
  email: string;
  currencyCode: string;
  returnDisplayMode: 'real' | 'nominal';
  inflationRate: number;
  safeWithdrawalRate: number;
  enabled?: boolean;
}

const toRateString = (value: number): string => {
  if (Number.isNaN(value)) {
    return '0.0000';
  }
  return (value / 100).toFixed(4);
};

const useApiUser = ({
  identityProviderId,
  email,
  currencyCode,
  returnDisplayMode,
  inflationRate,
  safeWithdrawalRate,
  enabled,
}: UseApiUserProps) => {
  const { getCurrentApiUser, createApiUser } = useApiUserBootstrap();

  const queryFn = useCallback(async (): Promise<ApiUser> => {
    const existingUser = await getCurrentApiUser();
    if (existingUser) {
      return existingUser;
    }

    if (!email) {
      throw new Error('Signed-in user email is required to create API user');
    }

    const created = await createApiUser({
      identityProviderId,
      email,
      returnType: returnDisplayMode === 'real' ? 'REAL' : 'NOMINAL',
      safeWithdrawalRate: toRateString(safeWithdrawalRate),
      currencyType: currencyCode,
      inflationRate: toRateString(inflationRate),
      deductionType: 'STANDARD',
      deductionAmount: null,
      filingStatus: 'SINGLE',
      payoffStrategy: 'AVALANCHE',
    });

    return created;
  }, [
    createApiUser,
    currencyCode,
    email,
    getCurrentApiUser,
    identityProviderId,
    inflationRate,
    returnDisplayMode,
    safeWithdrawalRate,
  ]);

  return useQuery<ApiUser, Error>({
    queryKey: ['api-user', identityProviderId],
    queryFn,
    enabled: Boolean(enabled && identityProviderId),
    retry: 1,
    retryDelay: 1000,
  });
};

export default useApiUser;
