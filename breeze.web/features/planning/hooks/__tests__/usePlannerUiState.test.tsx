import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { usePlannerUiState } from '../usePlannerUiState';

describe('usePlannerUiState', () => {
  it('starts with account breakdown expanded', () => {
    const { result } = renderHook(() => usePlannerUiState());

    expect(result.current.collapsedSections).toEqual({ accountBreakdown: false });
  });

  it('toggles a section independently', () => {
    const { result } = renderHook(() => usePlannerUiState());

    act(() => result.current.toggleSection('accountBreakdown'));
    expect(result.current.collapsedSections.accountBreakdown).toBe(true);

    act(() => result.current.toggleSection('accounts'));
    expect(result.current.collapsedSections).toEqual({
      accountBreakdown: true,
      accounts: true,
    });

    act(() => result.current.toggleSection('accountBreakdown'));
    expect(result.current.collapsedSections.accountBreakdown).toBe(false);
  });
});
