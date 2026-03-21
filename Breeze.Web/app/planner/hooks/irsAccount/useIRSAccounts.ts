import useHttp from '@/lib/services/useHttp';
import { IRSAccount } from '../../types/irs';

const useIRSAccounts = () => {
  const { getMany } = useHttp();

  const getIRSAccounts = async (): Promise<IRSAccount[]> =>
    await getMany<IRSAccount>('irs-accounts');

  return { getIRSAccounts };
};

export default useIRSAccounts;
