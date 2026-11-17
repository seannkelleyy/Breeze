'use client';
import { useEffect, useRef, DependencyList } from 'react';

/**
 * Debounced auto-save hook that triggers a callback after dependencies change.
 * Clears and resets the timer on each dependency change.
 *
 * The callback is read from a ref so an inline arrow function does not re-arm
 * the timer on every render; only a change in `deps` (or `delay`) does.
 *
 * @param callback - Function to call when saving
 * @param deps - Dependencies that trigger the save
 * @param delay - Debounce delay in milliseconds (default: 600)
 */
export function useAutoSave(callback: () => void, deps: DependencyList, delay: number = 600): void {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => callbackRef.current(), delay);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [depsKey, delay]);
}
