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

const usePlanner = () => {
  const { request } = useGraphql();
  const { user, userId, currencyCode, returnDisplayMode, inflationRate, safeWithdrawalRate } =
    useCurrentUser();

  const getLatestBudgetMonthlyExpenses = useCallback(async (): Promise<number> => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const response = await request<{ budgetByDate: { monthlyExpenses: string } | null }>(
      GET_BUDGET_BY_DATE,
      { userId, date },
    );

    return response.budgetByDate ? Number.parseFloat(response.budgetByDate.monthlyExpenses) : 0;
  }, [request, userId]);

  const getPlanner = async (): Promise<never> => {
    throw new Error('Planner persistence has moved off the REST planner record');
  };

  const upsertPlanner = async (payload: PlannerUpsertRequest): Promise<number> => {
    // Persist minimal user preference fields so planner edits produce network activity.
    // Full planner persistence (assets/liabilities/people) is handled separately.
    const UPDATE_USER_MUTATION = `
      mutation UpdateUserPreferences($input: UpdateUserInput!) {
        updateUser(input: $input) {
          id
        }
      }
    `;

    try {
      const input = {
        id: userId,
        identityProviderId: user?.publicMetadata?.userId?.toString() ?? user?.id ?? '',
        email: user?.emailAddresses?.[0]?.emailAddress ?? '',
        returnType: returnDisplayMode === 'real' ? 'REAL' : 'NOMINAL',
        safeWithdrawalRate: (payload.safeWithdrawalRate / 100).toFixed(4),
        currencyType: currencyCode,
        inflationRate: (payload.inflationRate / 100).toFixed(4),
        deductionType: 'STANDARD',
        deductionAmount: null,
        maxTaxBracketId: null,
        filingStatus: 'SINGLE',
        payoffStrategy: 'AVALANCHE',
      };

      await request<{ updateUser: { id: string } }, { input: typeof input }>(UPDATE_USER_MUTATION, {
        input,
      });

      // Fetch existing assets and liabilities to decide create vs update
      const existingAssetsResp = await request<{ assets: Array<any> }, { userId: string }>(
        GET_ASSETS_BY_USER,
        { userId },
      );
      const existingLiabilitiesResp = await request<
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

      const mapToAssetType = (acctType: string) => {
        switch (acctType) {
          case '401k':
          case '403b':
          case '457':
          case 'roth-ira':
          case 'traditional-ira':
          case 'hsa':
            return 'RETIREMENT';
          case 'brokerage':
          case 'checking':
          case 'emergency-fund':
            return 'CASH';
          case 'home':
            return 'REAL_ESTATE';
          case 'vehicle':
            return 'VEHICLE';
          default:
            return 'OTHER';
        }
      };

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
            interestRate: ((acct.annualRate ?? 0) / 100).toFixed(4),
            minimumPayment: String(acct.contributionValue ?? 0),
            targetExtraPayment: '0',
            payoffPriority: 0,
            owner: acct.owner,
            contributionMode: acct.contributionMode,
            contributionValue: String(acct.contributionValue ?? 0),
          };

          const existing = existingLiabilities.find(
            (l) => l.name === acct.name && l.liabilityType === liabilityInput.liabilityType,
          );

          if (existing) {
            const { userId: _userId, ...updateFields } = liabilityInput;
            // eslint-disable-next-line no-await-in-loop
            await request<{ updateLiability: { id: string } }, { input: typeof updateFields & { id: string } }>(
              UPDATE_LIABILITY,
              { input: { id: existing.id, ...updateFields } },
            );
          } else {
            // eslint-disable-next-line no-await-in-loop
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
            owner: acct.owner,
            contributionMode: acct.contributionMode,
            contributionValue: String(acct.contributionValue ?? 0),
            employerMatchRate: String(acct.employerMatchRate ?? 0),
            employerMatchMaxPercentOfSalary: String(acct.employerMatchMaxPercentOfSalary ?? 0),
            annualRate: String(acct.annualRate ?? 0),
          };

          const existing = existingAssets.find(
            (a) => a.name === acct.name && a.assetType === assetInput.assetType,
          );

          if (existing) {
            const { userId: _userId, ...updateFields } = assetInput;
            // eslint-disable-next-line no-await-in-loop
            await request<{ updateAsset: { id: string } }, { input: typeof updateFields & { id: string } }>(
              UPDATE_ASSET,
              { input: { id: existing.id, ...updateFields } },
            );
          } else {
            // eslint-disable-next-line no-await-in-loop
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

  return { getPlanner, getLatestBudgetMonthlyExpenses, upsertPlanner };
};

export default usePlanner;
