import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabParam } from '../useTabParam';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: 'overview',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

const VALID = ['overview', 'accounts', 'goals'] as const;

describe('useTabParam', () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.search = '';
  });

  it('returns the default when no tab param exists', () => {
    const { result } = renderHook(() => useTabParam('overview', VALID));
    expect(result.current[0]).toBe('overview');
  });

  it('returns the current tab when the param is valid', () => {
    mocks.search = 'tab=accounts';
    const { result } = renderHook(() => useTabParam('overview', VALID));
    expect(result.current[0]).toBe('accounts');
  });

  it('falls back to the default for unknown tab values', () => {
    mocks.search = 'tab=not-a-real-tab';
    const { result } = renderHook(() => useTabParam('overview', VALID));
    expect(result.current[0]).toBe('overview');
  });

  it('replaces the URL without a history entry', () => {
    const { result } = renderHook(() => useTabParam('overview', VALID));
    act(() => result.current[1]('goals'));
    expect(mocks.replace).toHaveBeenCalledWith('?tab=goals', { scroll: false });
  });

  it('preserves unrelated search params when switching tabs', () => {
    mocks.search = 'person=abc&tab=overview';
    const { result } = renderHook(() => useTabParam('overview', VALID));
    act(() => result.current[1]('accounts'));
    const [url] = mocks.replace.mock.calls[0];
    expect(new URLSearchParams(url).get('person')).toBe('abc');
    expect(new URLSearchParams(url).get('tab')).toBe('accounts');
  });
});
