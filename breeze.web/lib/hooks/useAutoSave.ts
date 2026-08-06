'use client';
import { useEffect, useRef, DependencyList } from 'react';

/**
 * Debounced auto-save hook that triggers a callback after dependencies change.
 * Clears and resets the timer on each dependency change.
 *
 * @param callback - Function to call when saving
 * @param deps - Dependencies that trigger the save
 * @param delay - Debounce delay in milliseconds (default: 600)
 */
export function useAutoSave(callback: () => void, deps: DependencyList, delay: number = 600): void {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(callback, delay);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
