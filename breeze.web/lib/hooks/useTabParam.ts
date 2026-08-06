'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Syncs a tab value with the `?tab=` URL search param.
 * Falls back to `defaultValue` if the param is missing or not in `validValues`.
 * Updates the URL via `router.replace` (no history entry).
 */
export function useTabParam<T extends string>(defaultValue: T, validValues: readonly T[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = useMemo(() => {
    const param = searchParams.get('tab') as T | null;
    if (param && validValues.includes(param)) return param;
    return defaultValue;
  }, [searchParams, defaultValue, validValues]);

  const setTab = useCallback(
    (value: T) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return [tab, setTab] as const;
}
