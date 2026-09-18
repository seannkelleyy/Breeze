import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/lib/services/queries/assets';
import { GET_PLANNER_PEOPLE } from '@/lib/services/queries/plannerPeople';
import { ME_QUERY } from '@/lib/services/queries/users';
import useGraphql from '@/lib/services/useGraphql';
import { useQuery } from '@tanstack/react-query';
import { PlannerAccount } from '../../types/account';
import type { ApiAssetType, ApiLiabilityType } from '../../types/apiAsset';
import { PlannerPerson } from '../../types/person';
import { apiAssetTypeToAccountType, apiLiabilityTypeToAccountType } from '../../lib/typeMapping';

interface MeResponse {
  me: {
    id: string;
    safeWithdrawalRate: string;
    inflationRate: string;
    currencyType: string;
    returnType: 'REAL' | 'NOMINAL';
  } | null;
}

interface PlannerPeopleResponse {
  plannerPeople: Array<{
    id: string;
    userId: string;
    name: string;
    birthday: string;
    retirementAge: number;
    annualSalary: string;
    bonusMode: string;
    annualBonus: string;
    incomeGrowthRate: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface AssetsResponse {
  assets: Array<{
    id: string;
    name: string;
    assetType: string;
    currentValue: string;
    contributionMode: string;
    contributionValue: string;
    employerMatchRate: string;
    employerMatchMaxPercentOfSalary: string;
    annualRate: string;
    returnProfile: string | null;
    personIds: string[];
    purchaseDate: string | null;
    purchasePrice: string | null;
    homeGrowthProfile: string | null;
    vehicleDepreciationProfile: string | null;
    linkedLiabilityId: string | null;
    plaidAccountId: string | null;
    lastValueUpdatedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface LiabilitiesResponse {
  liabilities: Array<{
    id: string;
    name: string;
    liabilityType: string;
    currentBalance: string;
    originalLoanAmount: string | null;
    interestRate: string;
    minimumPayment: string;
    contributionMode: string;
    contributionValue: string;
    personIds: string[];
    plaidAccountId: string | null;
    lastBalanceUpdatedAt: string | null;
    createdAt: string;
    updatedAt: string;
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
      const [meResp, plannerPeopleResp, assetsResp, liabilitiesResp] = await Promise.all([
        request<MeResponse>(ME_QUERY),
        request<PlannerPeopleResponse>(GET_PLANNER_PEOPLE, { userId } as Record<string, unknown>),
        request<AssetsResponse>(GET_ASSETS_BY_USER, { userId } as Record<string, unknown>),
        request<LiabilitiesResponse>(GET_LIABILITIES_BY_USER, { userId } as Record<
          string,
          unknown
        >),
      ]);

      const me = meResp?.me;
      const plannerPeople = plannerPeopleResp?.plannerPeople ?? [];
      const assets = assetsResp?.assets ?? [];
      const liabilities = liabilitiesResp?.liabilities ?? [];

      const mappedPeople: PlannerPerson[] = plannerPeople.map((p, index) => ({
        id: p.id,
        name: p.name,
        birthday: p.birthday,
        retirementAge: p.retirementAge,
        annualSalary: Number(p.annualSalary),
        bonusMode: (p.bonusMode === 'salary-percent' ? 'salary-percent' : 'dollars') as
          | 'dollars'
          | 'salary-percent',
        annualBonus: Number(p.annualBonus),
        incomeGrowthRate: Number(p.incomeGrowthRate),
        isPrimary: index === 0,
        payType: (((p as Record<string, unknown>).payType as string) || 'salary') as
          | 'salary'
          | 'hourly'
          | 'commission',
        payDay: ((p as Record<string, unknown>).payDay as number) ?? 1,
        payCadence: (((p as Record<string, unknown>).payCadence as string) || 'biweekly') as
          | 'weekly'
          | 'biweekly'
          | 'monthly',
        hourlyRate: Number((p as Record<string, unknown>).hourlyRate) || 0,
        expectedHoursPerWeek: Number((p as Record<string, unknown>).expectedHoursPerWeek) || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      // Map API assets and liabilities into the planner's local account format
      const mappedAssets: PlannerAccount[] = assets.map((a) => ({
        id: a.id,
        name: a.name,
        personIds: a.personIds,
        accountType: apiAssetTypeToAccountType(a.assetType as ApiAssetType),
        contributionMode: (a.contributionMode || 'monthly') as PlannerAccount['contributionMode'],
        contributionValue: Number(a.contributionValue) || 0,
        employerMatchRate: (Number(a.employerMatchRate) || 0) * 100,
        employerMatchMaxPercentOfSalary: (Number(a.employerMatchMaxPercentOfSalary) || 0) * 100,
        startingBalance: Number(a.currentValue) || 0,
        annualRate: (Number(a.annualRate) || 0) * 100,
        returnProfile: a.returnProfile as PlannerAccount['returnProfile'] | null,
        purchaseDate: a.purchaseDate ?? null,
        purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : null,
        homeGrowthProfile: a.homeGrowthProfile ?? null,
        vehicleDepreciationProfile: a.vehicleDepreciationProfile ?? null,
        linkedLiabilityId: a.linkedLiabilityId ?? null,
        plaidAccountId: a.plaidAccountId ?? null,
        lastValueUpdatedAt: a.lastValueUpdatedAt ?? null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));

      const mappedLiabilities: PlannerAccount[] = liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        personIds: l.personIds,
        accountType: apiLiabilityTypeToAccountType(l.liabilityType as ApiLiabilityType),
        contributionMode: (l.contributionMode || 'monthly') as PlannerAccount['contributionMode'],
        contributionValue: Number(l.contributionValue) || 0,
        employerMatchRate: 0,
        employerMatchMaxPercentOfSalary: 0,
        startingBalance: Number(l.currentBalance) || 0,
        annualRate: (Number(l.interestRate) || 0) * 100,
        returnProfile: null,
        purchaseDate: null,
        purchasePrice: null,
        homeGrowthProfile: null,
        vehicleDepreciationProfile: null,
        linkedLiabilityId: null,
        plaidAccountId: l.plaidAccountId ?? null,
        lastValueUpdatedAt: l.lastBalanceUpdatedAt ?? null,
        originalLoanAmount: l.originalLoanAmount ? Number(l.originalLoanAmount) : null,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }));

      return {
        people: mappedPeople,
        accounts: [...mappedAssets, ...mappedLiabilities],
        inflationRate: me ? Number(me.inflationRate) * 100 : 3,
        safeWithdrawalRate: me ? Number(me.safeWithdrawalRate) * 100 : 4,
        currencyCode: me?.currencyType || 'USD',
        returnDisplayMode: (me?.returnType === 'NOMINAL' ? 'nominal' : 'real') as
          | 'real'
          | 'nominal',
      };
    },
    enabled: typeof window !== 'undefined' && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export default useFetchPlanner;
