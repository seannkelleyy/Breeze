import { useQuery } from '@tanstack/react-query';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { ME_QUERY } from '@/lib/services/queries/users';
import useGraphql from '@/lib/services/useGraphql';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { PlannerAccount } from '../../types/account';
import { PlannerPerson } from '../../types/person';

interface MeResponse {
  me: {
    id: string;
    safeWithdrawalRate: string;
    inflationRate: string;
    currencyType: string;
    returnType: 'REAL' | 'NOMINAL';
  } | null;
}

interface AssetsResponse {
  assets: Array<{
    id: string;
    name: string;
    assetType: string;
    currentValue: string;
    owner: string;
    contributionMode: string;
    contributionValue: string;
    employerMatchRate: string;
    employerMatchMaxPercentOfSalary: string;
    annualRate: string;
  }>;
}

interface LiabilitiesResponse {
  liabilities: Array<{
    id: string;
    name: string;
    liabilityType: string;
    currentBalance: string;
    interestRate: string;
    minimumPayment: string;
    owner: string;
    contributionMode: string;
    contributionValue: string;
  }>;
}

export interface PlannerLoadResult {
  people: PlannerPerson[];
  accounts: PlannerAccount[];
  inflationRate: number;
  safeWithdrawalRate: number;
  currencyCode: string;
  returnDisplayMode: 'real' | 'nominal';
}

/**
 * Loads the user's financial data from the API (assets, liabilities,
 * preferences) and returns it for the planner page to hydrate.
 *
 * This replaces the old mock-data approach that never called the API.
 */
const useFetchPlanner = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  return useQuery<PlannerLoadResult>({
    queryKey: ['planner', userId],
    queryFn: async () => {
      const [meResp, assetsResp, liabilitiesResp] = await Promise.all([
        request<MeResponse>(ME_QUERY),
        request<AssetsResponse>(GET_ASSETS_BY_USER, { userId } as Record<string, unknown>),
        request<LiabilitiesResponse>(GET_LIABILITIES_BY_USER, { userId } as Record<
          string,
          unknown
        >),
      ]);

      const me = meResp?.me;
      const assets = assetsResp?.assets ?? [];
      const liabilities = liabilitiesResp?.liabilities ?? [];

      // Map API assets and liabilities into the planner's local account format
      const mappedAssets: PlannerAccount[] = assets.map((a) => ({
        id: a.id,
        name: a.name,
        owner: (a.owner === 'spouse' ? 'spouse' : 'self') as PlannerAccount['owner'],
        accountType: mapApiAssetTypeToPlanner(a.assetType),
        contributionMode: (a.contributionMode || 'monthly') as PlannerAccount['contributionMode'],
        contributionValue: Number(a.contributionValue) || 0,
        employerMatchRate: Number(a.employerMatchRate) || 0,
        employerMatchMaxPercentOfSalary: Number(a.employerMatchMaxPercentOfSalary) || 0,
        startingBalance: Number(a.currentValue) || 0,
        annualRate: Number(a.annualRate) || 0,
      }));

      const mappedLiabilities: PlannerAccount[] = liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        owner: (l.owner === 'spouse' ? 'spouse' : 'self') as PlannerAccount['owner'],
        accountType: mapApiLiabilityTypeToPlanner(l.liabilityType),
        contributionMode: (l.contributionMode || 'monthly') as PlannerAccount['contributionMode'],
        contributionValue: Number(l.contributionValue) || 0,
        employerMatchRate: 0,
        employerMatchMaxPercentOfSalary: 0,
        startingBalance: Number(l.currentBalance) || 0,
        annualRate: Number(l.interestRate) || 0,
      }));

      return {
        people: [] as PlannerPerson[],
        accounts: [...mappedAssets, ...mappedLiabilities],
        inflationRate: me ? Number(me.inflationRate) * 100 : 3,
        safeWithdrawalRate: me ? Number(me.safeWithdrawalRate) * 100 : 4,
        currencyCode: me?.currencyType || 'USD',
        returnDisplayMode: (me?.returnType === 'NOMINAL' ? 'nominal' : 'real') as
          | 'real'
          | 'nominal',
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

function mapApiAssetTypeToPlanner(apiType: string): PlannerAccount['accountType'] {
  switch (apiType) {
    case '_401K':
    case '_403B':
    case '_457':
      return '401k';
    case 'ROTH_IRA':
      return 'roth-ira';
    case 'TRADITIONAL_IRA':
      return 'traditional-ira';
    case 'HSA':
      return 'hsa';
    case 'BROKERAGE':
      return 'brokerage';
    case 'HOME':
      return 'home';
    case 'VEHICLE':
      return 'vehicle';
    case 'CHECKING':
      return 'checking';
    case 'EMERGENCY_FUND':
      return 'emergency-fund';
    default:
      return 'other';
  }
}

function mapApiLiabilityTypeToPlanner(apiType: string): PlannerAccount['accountType'] {
  switch (apiType) {
    case 'STUDENT_LOAN':
      return 'student-loan';
    case 'CREDIT_CARD':
      return 'credit-card';
    case 'PERSONAL_LOAN':
      return 'personal-loan';
    case 'AUTO_LOAN':
      return 'auto-loan';
    case 'MORTGAGE':
      return 'mortgage';
    default:
      return 'other';
  }
}

export default useFetchPlanner;
