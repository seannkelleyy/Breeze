import { useCallback } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  CREATE_ASSET,
  CREATE_LIABILITY,
  GET_ASSETS_BY_USER,
  GET_LIABILITIES_BY_USER,
  UPDATE_ASSET,
  UPDATE_LIABILITY,
} from '@/lib/services/queries/assets';
import { GET_BUDGET_BY_DATE } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { PlannerAccountDto } from '../../types/account';
import { PlannerUpsertRequest } from '../../types/planner';
import { accountTypeToApiAssetType } from '../../lib/typeMapping';

const usePlanner = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getLatestBudgetMonthlyExpenses = useCallback(async (): Promise<number> => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const response = await request<{ budgetByDate: { monthlyExpenses: string } | null }>(
      GET_BUDGET_BY_DATE,
      { userId, date },
    );

    return response.budgetByDate ? Number.parseFloat(response.budgetByDate.monthlyExpenses) : 0;
  }, [request, userId]);

  const upsertPlanner = async (payload: PlannerUpsertRequest): Promise<number> => {
    try {
      // Fetch existing assets and liabilities to decide create vs update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingAssetsResp = await request<{ assets: Array<any> }, { userId: string }>(
        GET_ASSETS_BY_USER,
        { userId },
      );

      const existingLiabilitiesResp = await request<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { liabilities: Array<any> },
        { userId: string }
      >(GET_LIABILITIES_BY_USER, { userId });

      const existingAssets = existingAssetsResp.assets ?? [];
      const existingLiabilities = existingLiabilitiesResp.liabilities ?? [];

      // Helper mappers
      const isLiabilityType = (acctType: string) =>
        ['student-loan', 'credit-card', 'personal-loan', 'auto-loan', 'mortgage'].includes(
          acctType,
        );

      const mapToAssetType = (acctType: string): ReturnType<typeof accountTypeToApiAssetType> =>
        accountTypeToApiAssetType(acctType as Parameters<typeof accountTypeToApiAssetType>[0]);

      const mapToLiabilityType = (acctType: string) => {
        switch (acctType) {
          case 'student-loan':
            return 'STUDENT_LOAN';
          case 'credit-card':
            return 'CREDIT_CARD';
          case 'auto-loan':
            return 'AUTO_LOAN';
          case 'mortgage':
            return 'MORTGAGE';
          case 'personal-loan':
            return 'PERSONAL_LOAN';
          default:
            return 'OTHER';
        }
      };

      // Persist accounts
      for (const acct of payload.accounts as PlannerAccountDto[]) {
        if (isLiabilityType(acct.accountType)) {
          const liabilityInput = {
            userId,
            name: acct.name,
            liabilityType: mapToLiabilityType(acct.accountType),
            currentBalance: String(acct.startingBalance ?? 0),
            originalLoanAmount: acct.originalLoanAmount?.toString() ?? null,
            interestRate: ((acct.annualRate ?? 0) / 100).toFixed(4),
            minimumPayment: String(acct.contributionValue ?? 0),
            targetExtraPayment: '0',
            payoffPriority: 0,
            contributionMode: acct.contributionMode,
            contributionValue: String(acct.contributionValue ?? 0),
            personIds: acct.personIds,
          };

          const existing = existingLiabilities.find(
            (l) => l.name === acct.name && l.liabilityType === liabilityInput.liabilityType,
          );

          if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId: _userId, ...updateFields } = liabilityInput;

            await request<
              { updateLiability: { id: string } },
              { input: typeof updateFields & { id: string } }
            >(UPDATE_LIABILITY, { input: { id: existing.id, ...updateFields } });
          } else {
            await request<{ createLiability: { id: string } }, { input: typeof liabilityInput }>(
              CREATE_LIABILITY,
              { input: liabilityInput },
            );
          }
        } else {
          const assetInput = {
            userId,
            name: acct.name,
            assetType: mapToAssetType(acct.accountType),
            currentValue: String(acct.currentValue ?? acct.startingBalance ?? 0),
            contributionMode: acct.contributionMode,
            contributionValue: String(acct.contributionValue ?? 0),
            employerMatchRate: String((acct.employerMatchRate ?? 0) / 100),
            employerMatchMaxPercentOfSalary: String(
              (acct.employerMatchMaxPercentOfSalary ?? 0) / 100,
            ),
            annualRate: String((acct.annualRate ?? 0) / 100),
            returnProfile: null,
            personIds: acct.personIds,
            purchaseDate: acct.purchaseDate ?? null,
            purchasePrice: acct.purchasePrice?.toString() ?? null,
            homeGrowthProfile: acct.homeGrowthProfile ?? null,
            vehicleDepreciationProfile: acct.vehicleDepreciationProfile ?? null,
            linkedLiabilityId: acct.linkedLiabilityId ?? null,
          };

          const existing = existingAssets.find(
            (a) => a.name === acct.name && a.assetType === assetInput.assetType,
          );

          if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId: _userId, ...updateFields } = assetInput;

            await request<
              { updateAsset: { id: string } },
              { input: typeof updateFields & { id: string } }
            >(UPDATE_ASSET, { input: { id: existing.id, ...updateFields } });
          } else {
            await request<{ createAsset: { id: string } }, { input: typeof assetInput }>(
              CREATE_ASSET,
              { input: assetInput },
            );
          }
        }
      }

      return 1;
    } catch (err) {
      // Surface error to caller
      throw err;
    }
  };

  return { getLatestBudgetMonthlyExpenses, upsertPlanner };
};

export default usePlanner;
