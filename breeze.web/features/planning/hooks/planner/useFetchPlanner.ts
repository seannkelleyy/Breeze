import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/features/assets/asset.operations';
import { GET_PLANNER_PEOPLE } from '@/features/planning/plannerPeople.operations';
import { ME_QUERY } from '@/features/planning/user.operations';
import useGraphql from '@/lib/services/useGraphql';
import { useQuery } from '@tanstack/react-query';
import { PlannerAccount } from '../../../../features/planning/types/account';
import type { ApiAssetType, ApiLiabilityType } from '../../../../features/planning/types/apiAsset';
import { PayCadence, PlannerPerson } from '../../../../features/planning/types/person';
import { apiAssetTypeToAccountType, apiLiabilityTypeToAccountType } from '../../../../features/planning/lib/typeMapping';
import { resolveTaxTreatment } from '../../../../features/planning/lib/config';

interface PlannerLoadResult {
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
        request(ME_QUERY),
        request(GET_PLANNER_PEOPLE, { userId }),
        request(GET_ASSETS_BY_USER, { userId }),
        request(GET_LIABILITIES_BY_USER, { userId }),
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
          'dollars' | 'salary-percent',
        bonusFrequency: (['annual', 'quarterly', 'monthly'].includes(p.bonusFrequency)
          ? p.bonusFrequency
          : 'annual') as 'annual' | 'quarterly' | 'monthly',
        annualBonus: Number(p.annualBonus),
        incomeGrowthRate: Number(p.incomeGrowthRate),
        isPrimary: index === 0,
        payType: (((p as Record<string, unknown>).payType as string) || 'salary') as
          'salary' | 'hourly' | 'commission',
        payDay: ((p as Record<string, unknown>).payDay as number) ?? 1,
        payCadence: (((p as Record<string, unknown>).payCadence as string) ||
          'biweekly') as PayCadence,
        hourlyRate: Number((p as Record<string, unknown>).hourlyRate) || 0,
        expectedHoursPerWeek: Number((p as Record<string, unknown>).expectedHoursPerWeek) || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      // Map API assets and liabilities into the planner's local account format
      const mappedAssets: PlannerAccount[] = assets.map((a) => {
        const accountType = apiAssetTypeToAccountType(a.assetType as ApiAssetType);
        return {
          id: a.id,
          name: a.name,
          personIds: a.personIds,
          accountType,
          contributionMode: (a.contributionMode || 'monthly') as PlannerAccount['contributionMode'],
          contributionValue: Number(a.contributionValue) || 0,
          employerMatchRate: (Number(a.employerMatchRate) || 0) * 100,
          employerMatchMaxPercentOfSalary: (Number(a.employerMatchMaxPercentOfSalary) || 0) * 100,
          startingBalance: Number(a.currentValue) || 0,
          annualRate: (Number(a.annualRate) || 0) * 100,
          returnProfile: a.returnProfile as PlannerAccount['returnProfile'] | null,
          taxTreatment: resolveTaxTreatment(accountType, a.taxTreatment),
          pretaxSharePercent: a.pretaxSharePercent ?? null,
          purchaseDate: a.purchaseDate ?? null,
          purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : null,
          homeGrowthProfile: a.homeGrowthProfile ?? null,
          vehicleDepreciationProfile: a.vehicleDepreciationProfile ?? null,
          linkedLiabilityId: a.linkedLiabilityId ?? null,
          plaidAccountId: a.plaidAccountId ?? null,
          lastValueUpdatedAt: a.lastValueUpdatedAt ?? null,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        };
      });

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
          'real' | 'nominal',
      };
    },
    enabled: typeof window !== 'undefined' && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export default useFetchPlanner;
