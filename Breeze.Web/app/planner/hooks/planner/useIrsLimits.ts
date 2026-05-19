import { defaultIrsLimits } from '../../lib/plannerMath';

const useIrsLimits = () => {
  const irsLimits = defaultIrsLimits;

  return {
    irsLimits,
    isIrsAccountsLoading: false,
    isIrsAccountsError: false,
  };
};

export default useIrsLimits;
