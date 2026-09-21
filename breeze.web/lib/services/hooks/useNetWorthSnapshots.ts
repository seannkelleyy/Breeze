'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useGraphql from '@/lib/services/useGraphql';
import {
  CREATE_NET_WORTH_SNAPSHOT,
  DELETE_NET_WORTH_SNAPSHOT,
  GET_NET_WORTH_SNAPSHOTS,
} from '@/lib/services/queries/planning';

export interface NetWorthSnapshotItem {
  id: string;
  snapshotId: string;
  accountId: string | null;
  label: string;
  amount: number;
  kind: 'ASSET' | 'LIABILITY';
}

export interface NetWorthSnapshot {
  id: string;
  userId: string;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  items: NetWorthSnapshotItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotItemInput {
  accountId?: string | null;
  label: string;
  amount: number;
  kind: 'ASSET' | 'LIABILITY';
}

export interface CreateSnapshotInput {
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  items?: SnapshotItemInput[];
}

interface SnapshotDto {
  id: string;
  userId: string;
  snapshotDate: string;
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  items: Array<{
    id: string;
    snapshotId: string;
    accountId: string | null;
    label: string;
    amount: string;
    kind: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const mapSnapshot = (s: SnapshotDto): NetWorthSnapshot => ({
  id: s.id,
  userId: s.userId,
  snapshotDate: s.snapshotDate,
  totalAssets: Number(s.totalAssets) || 0,
  totalLiabilities: Number(s.totalLiabilities) || 0,
  netWorth: Number(s.netWorth) || 0,
  items: (s.items ?? []).map((i) => ({
    id: i.id,
    snapshotId: i.snapshotId,
    accountId: i.accountId,
    label: i.label,
    amount: Number(i.amount) || 0,
    kind: (i.kind === 'LIABILITY' ? 'LIABILITY' : 'ASSET') as 'ASSET' | 'LIABILITY',
  })),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export const useNetWorthSnapshots = (userId?: string | null) => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();
  const queryKey = ['netWorthSnapshots', userId];

  const { data, isLoading, isError } = useQuery<NetWorthSnapshot[]>({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await request<{ netWorthSnapshots: SnapshotDto[] }, { userId: string }>(
        GET_NET_WORTH_SNAPSHOTS,
        { userId: userId as string },
      );
      return (response.netWorthSnapshots ?? []).map(mapSnapshot);
    },
  });

  const createSnapshot = useMutation({
    mutationFn: async (input: CreateSnapshotInput) => {
      const gqlItems = (input.items ?? []).map((i) => ({
        accountId: i.accountId ?? null,
        label: i.label,
        amount: String(i.amount),
        kind: i.kind,
      }));
      const response = await request<{ createNetWorthSnapshot: SnapshotDto }, { input: object }>(
        CREATE_NET_WORTH_SNAPSHOT,
        {
          input: {
            userId: userId as string,
            snapshotDate: input.snapshotDate,
            totalAssets: String(input.totalAssets),
            totalLiabilities: String(input.totalLiabilities),
            netWorth: String(input.netWorth),
            items: gqlItems,
          },
        },
      );
      const created = mapSnapshot(response.createNetWorthSnapshot);
      queryClient.setQueryData<NetWorthSnapshot[]>(queryKey, (prev = []) =>
        [...prev.filter((s) => s.snapshotDate !== created.snapshotDate), created].sort((a, b) =>
          a.snapshotDate.localeCompare(b.snapshotDate),
        ),
      );
      return created;
    },
  });

  const deleteSnapshot = useMutation({
    mutationFn: async (id: string) => {
      await request<{ deleteNetWorthSnapshot: boolean }, { id: string }>(
        DELETE_NET_WORTH_SNAPSHOT,
        { id },
      );
      queryClient.setQueryData<NetWorthSnapshot[]>(queryKey, (prev = []) =>
        prev.filter((s) => s.id !== id),
      );
    },
  });

  return { snapshots: data ?? [], isLoading, isError, createSnapshot, deleteSnapshot };
};

export default useNetWorthSnapshots;
