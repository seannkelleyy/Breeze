import { IRSAccount } from '../../types/irs';

const useIRSAccounts = () => {
  const getIRSAccounts = async (): Promise<IRSAccount[]> => [];

  return { getIRSAccounts };
};

export default useIRSAccounts;
