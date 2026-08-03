import { useQuery } from '@tanstack/react-query';
import { IRSAccount } from '../../types/irs';
import { useIRSAccounts } from './index';

const useFetchIRSAccounts = () => {
  const { getIRSAccounts } = useIRSAccounts();

  return useQuery<IRSAccount[], Error>({
    queryKey: ['irs-accounts'],
    queryFn: getIRSAccounts,
    refetchInterval: false,
    retryDelay: 1 * 1000,
    retry: 0,
    enabled: false,
  });
};

export default useFetchIRSAccounts;
