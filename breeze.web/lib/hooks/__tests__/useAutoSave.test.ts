import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires after the default 600ms delay', () => {
    const cb = vi.fn();
    renderHook(() => useAutoSave(cb, [1]));

    act(() => vi.advanceTimersByTime(599));
    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('honors a custom delay', () => {
    const cb = vi.fn();
    renderHook(() => useAutoSave(cb, [1], 1200));

    act(() => vi.advanceTimersByTime(600));
    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(600));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid dependency changes into a single save', () => {
    const cb = vi.fn();
    const { rerender } = renderHook(({ v }) => useAutoSave(cb, [v], 300), {
      initialProps: { v: 1 },
    });

    // Initial mount fires once after the delay
    act(() => vi.advanceTimersByTime(300));
    expect(cb).toHaveBeenCalledTimes(1);

    // Three quick edits — only the last should survive the debounce
    rerender({ v: 2 });
    act(() => vi.advanceTimersByTime(150));
    rerender({ v: 3 });
    act(() => vi.advanceTimersByTime(150));
    rerender({ v: 4 });
    act(() => vi.advanceTimersByTime(300));

    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending save on unmount', () => {
    const cb = vi.fn();
    const { rerender, unmount } = renderHook(({ v }) => useAutoSave(cb, [v], 300), {
      initialProps: { v: 1 },
    });

    act(() => vi.advanceTimersByTime(300));
    expect(cb).toHaveBeenCalledTimes(1);

    rerender({ v: 2 });
    unmount();
    act(() => vi.advanceTimersByTime(600));

    expect(cb).toHaveBeenCalledTimes(1);
  });
});
