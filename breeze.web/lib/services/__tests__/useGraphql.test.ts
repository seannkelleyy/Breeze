import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('../useHttp', () => ({
  default: () => ({ post: postMock }),
}));

import useGraphql from '../useGraphql';

describe('useGraphql request', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('posts the query and variables to the query endpoint', async () => {
    postMock.mockResolvedValue({ data: { users: [] } });
    const { result } = renderHook(() => useGraphql());

    await result.current.request('query { users { id } }', { userId: 'u1' });

    expect(postMock).toHaveBeenCalledWith('query', {
      query: 'query { users { id } }',
      variables: { userId: 'u1' },
    });
  });

  it('returns the data payload on success', async () => {
    postMock.mockResolvedValue({ data: { users: [{ id: 'u1' }] } });
    const { result } = renderHook(() => useGraphql());

    const data = await result.current.request<{ users: { id: string }[] }>('query', undefined);

    expect(data).toEqual({ users: [{ id: 'u1' }] });
  });

  it('joins multiple GraphQL error messages', async () => {
    postMock.mockResolvedValue({
      errors: [{ message: 'first failed' }, { message: 'second failed' }],
    });
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request('query')).rejects.toThrow('first failed; second failed');
  });

  it('throws when errors are present even if data is included', async () => {
    postMock.mockResolvedValue({
      data: { users: [] },
      errors: [{ message: 'partial failure' }],
    });
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request('query')).rejects.toThrow('partial failure');
  });

  it('treats an empty errors array as success', async () => {
    postMock.mockResolvedValue({ data: { users: [] }, errors: [] });
    const { result } = renderHook(() => useGraphql());

    const data = await result.current.request<{ users: unknown[] }>('query');

    expect(data).toEqual({ users: [] });
  });

  it('throws when the response has neither errors nor data', async () => {
    postMock.mockResolvedValue({});
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request('query')).rejects.toThrow(
      'GraphQL response did not include data',
    );
  });

  it('propagates transport errors from the http layer', async () => {
    postMock.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request('query')).rejects.toThrow('network down');
  });
});
