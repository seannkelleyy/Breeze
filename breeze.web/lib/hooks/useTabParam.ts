'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Syncs a tab value with the `?tab=` URL search param.
 * Falls back to `defaultValue` if the param is missing or not in `validValues`.
 * Updates the URL via `router.replace` (no history entry).
 */
export function useTabParam<T extends string>(defaultValue: T, validValues: readonly T[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const param = searchParams.get('tab') as T | null;
  const tab = param && validValues.includes(param) ? param : defaultValue;

  const setTab = (value: T) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return [tab, setTab] as const;
}
