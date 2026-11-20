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
} from '../retirementAccess.operations';
import useGraphql from '../../../lib/services/useGraphql';
import type { RetirementAccessQuery } from '@/lib/gql/graphql';

type Access = RetirementAccessQuery['retirementAccess'];

/** Response shapes derived from the generated documents. */
export type HsaReceipt = Access['hsaReceipts'][number];
export type HsaReimbursement = Access['hsaReimbursements'][number];
export type HsaLadderSummary = Access['hsaSummary'];
export type RothConversion = Access['rothConversions'][number];
export type RothConversionBucket = Access['rothBuckets'][number];
export type RetirementAccess = Access;

const RETIREMENT_ACCESS_KEY = ['retirement-access'];

export const useRetirementAccess = (userId?: string) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: [...RETIREMENT_ACCESS_KEY, userId],
    queryFn: async () => {
      if (!userId) throw new Error('A user is required to load retirement access');
      const resp = await request(RETIREMENT_ACCESS);
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
      const resp = await request(CREATE_HSA_RECEIPT, { input });
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
      await request(DELETE_HSA_RECEIPT, { id });
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
      const resp = await request(CREATE_HSA_REIMBURSEMENT, { input });
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
      await request(DELETE_HSA_REIMBURSEMENT, { id });
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
      const resp = await request(CREATE_ROTH_CONVERSION, { input });
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
      await request(DELETE_ROTH_CONVERSION, { id });
    },
    onSuccess: invalidate,
  });
};
