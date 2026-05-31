'use client';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import useGraphql from '@/lib/services/useGraphql';
import { UPDATE_USER_MUTATION } from '@/lib/services/queries/users';

export interface PersistablePreferences {
  inflationRate: number;
  safeWithdrawalRate: number;
  filingStatus: 'SINGLE' | 'MFJ' | 'MFS' | 'HOH';
  returnType: 'NOMINAL' | 'REAL';
  currencyType: string;
  deductionType: 'STANDARD' | 'ITEMIZED';
  deductionAmount?: string;
}

export function usePlannerPersist(userId: string | null, preferences: PersistablePreferences) {
  const { request } = useGraphql();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<Error | null>(null);

  const updateUserMutation = useMutation({
    mutationFn: async (prefs: PersistablePreferences) => {
      if (!userId) throw new Error('No user ID');
      const input = {
        id: userId,
        inflationRate: (prefs.inflationRate / 100).toFixed(4),
        safeWithdrawalRate: (prefs.safeWithdrawalRate / 100).toFixed(4),
        filingStatus: prefs.filingStatus,
        returnType: prefs.returnType,
        currencyType: prefs.currencyType,
        deductionType: prefs.deductionType,
        deductionAmount: prefs.deductionAmount,
        identityProviderId: '',
        email: '',
        payoffStrategy: 'AVALANCHE',
        maxTaxBracketId: null,
      };
      await request(UPDATE_USER_MUTATION, { input });
    },
    onSuccess: () => {
      setSaveStatus('saved');
      setSaveError(null);
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error: Error) => {
      setSaveStatus('error');
      setSaveError(error);
    },
  });

  useEffect(() => {
    if (!userId) return;

    const currentPayload = JSON.stringify(preferences);
    if (currentPayload === lastSavedRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('saving');
    debounceTimerRef.current = setTimeout(() => {
      lastSavedRef.current = currentPayload;
      updateUserMutation.mutate(preferences);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userId, preferences, updateUserMutation]);

  return {
    saveStatus,
    saveError,
    isSaving: saveStatus === 'saving',
    isSaved: saveStatus === 'saved',
    hasError: saveStatus === 'error',
  };
}

export default usePlannerPersist;
