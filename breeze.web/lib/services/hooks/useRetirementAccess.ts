'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RETIREMENT_ACCESS,
  CREATE_HSA_RECEIPT,
  DELETE_HSA_RECEIPT,
  CREATE_HSA_REIMBURSEMENT,
  DELETE_HSA_REIMBURSEMENT,
  CREATE_ROTH_CONVERSION,
  DELETE_ROTH_CONVERSION,
} from '../queries/retirementAccess';
import useGraphql from '../useGraphql';

export interface HsaReceipt {
  id: string;
  userId: string;
  incurredOn: string;
  description: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

export interface HsaReimbursement {
  id: string;
  userId: string;
  reimbursedOn: string;
  amount: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface HsaLadderSummary {
  totalReceipts: string;
  totalReimbursed: string;
  availableToReimburse: string;
}

export interface RothConversion {
  id: string;
  userId: string;
  convertedOn: string;
  amount: string;
  fromAssetId: string | null;
  toAssetId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface RothConversionBucket {
  year: number;
  amount: string;
  availableOn: string;
  accessible: boolean;
}

export interface RetirementAccess {
  hsaReceipts: HsaReceipt[];
  hsaReimbursements: HsaReimbursement[];
  hsaSummary: HsaLadderSummary;
  rothConversions: RothConversion[];
  rothBuckets: RothConversionBucket[];
}

export const RETIREMENT_ACCESS_KEY = ['retirement-access'];

export const useRetirementAccess = (userId?: string) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: [...RETIREMENT_ACCESS_KEY, userId],
    queryFn: async () => {
      const resp = await request<{ retirementAccess: RetirementAccess }>(RETIREMENT_ACCESS, {
        userId,
      } as unknown as Record<string, unknown>);
      return resp.retirementAccess;
    },
    enabled: !!userId,
  });
};

const useInvalidateRetirementAccess = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: RETIREMENT_ACCESS_KEY });
};

export interface CreateHsaReceiptValues {
  incurredOn: string;
  description: string;
  amount: string;
}

export const useCreateHsaReceipt = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (input: CreateHsaReceiptValues) => {
      const resp = await request<{ createHsaReceipt: HsaReceipt }>(CREATE_HSA_RECEIPT, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.createHsaReceipt;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteHsaReceipt = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (id: string) => {
      await request<{ deleteHsaReceipt: boolean }>(DELETE_HSA_RECEIPT, {
        id,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: invalidate,
  });
};

export interface CreateHsaReimbursementValues {
  reimbursedOn: string;
  amount: string;
  note?: string;
}

export const useCreateHsaReimbursement = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (input: CreateHsaReimbursementValues) => {
      const resp = await request<{ createHsaReimbursement: HsaReimbursement }>(
        CREATE_HSA_REIMBURSEMENT,
        { input } as unknown as Record<string, unknown>,
      );
      return resp.createHsaReimbursement;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteHsaReimbursement = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (id: string) => {
      await request<{ deleteHsaReimbursement: boolean }>(DELETE_HSA_REIMBURSEMENT, {
        id,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: invalidate,
  });
};

export interface CreateRothConversionValues {
  convertedOn: string;
  amount: string;
  fromAssetId?: string;
  toAssetId?: string;
  note?: string;
}

export const useCreateRothConversion = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (input: CreateRothConversionValues) => {
      const resp = await request<{ createRothConversion: RothConversion }>(CREATE_ROTH_CONVERSION, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.createRothConversion;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteRothConversion = () => {
  const { request } = useGraphql();
  const invalidate = useInvalidateRetirementAccess();

  return useMutation({
    mutationFn: async (id: string) => {
      await request<{ deleteRothConversion: boolean }>(DELETE_ROTH_CONVERSION, {
        id,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: invalidate,
  });
};
