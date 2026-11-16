import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: postMock,
      interceptors: { request: { use: vi.fn() } },
    }),
    isAxiosError: (error: unknown) =>
      Boolean(
        error && typeof error === 'object' && (error as { isAxiosError?: boolean }).isAxiosError,
      ),
  },
}));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: vi.fn() }),
}));

import useGraphql from '@/lib/services/useGraphql';
import { parse } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

const testDocument = <TData = unknown, TVariables = Record<string, unknown>>(
  source: string,
): TypedDocumentNode<TData, TVariables> =>
  parse(source) as unknown as TypedDocumentNode<TData, TVariables>;

describe('useGraphql request', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('posts the query and variables to the query endpoint', async () => {
    postMock.mockResolvedValue({ data: { data: { users: [] } } });
    const { result } = renderHook(() => useGraphql());

    const query = testDocument<unknown, { userId: string }>('query { users { id } }');
    await result.current.request(query, { userId: 'u1' });

    expect(postMock).toHaveBeenCalledWith('query', {
      query: `{\n  users {\n    id\n  }\n}`,
      variables: { userId: 'u1' },
    });
  });

  it('returns the data payload on success', async () => {
    postMock.mockResolvedValue({ data: { data: { users: [{ id: 'u1' }] } } });
    const { result } = renderHook(() => useGraphql());

    const data = await result.current.request(
      testDocument<{ users: { id: string }[] }>('query { users { id } }'),
    );

    expect(data).toEqual({ users: [{ id: 'u1' }] });
  });

  it('joins multiple GraphQL error messages', async () => {
    postMock.mockResolvedValue({
      data: {
        errors: [{ message: 'first failed' }, { message: 'second failed' }],
      },
    });
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request(testDocument('query { users { id } }'))).rejects.toThrow(
      'first failed; second failed',
    );
  });

  it('throws when errors are present even if data is included', async () => {
    postMock.mockResolvedValue({
      data: { data: { users: [] }, errors: [{ message: 'partial failure' }] },
    });
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request(testDocument('query { users { id } }'))).rejects.toThrow(
      'partial failure',
    );
  });

  it('treats an empty errors array as success', async () => {
    postMock.mockResolvedValue({ data: { data: { users: [] }, errors: [] } });
    const { result } = renderHook(() => useGraphql());

    const data = await result.current.request(
      testDocument<{ users: unknown[] }>('query { users { id } }'),
    );

    expect(data).toEqual({ users: [] });
  });

  it('throws when the response has neither errors nor data', async () => {
    postMock.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request(testDocument('query { users { id } }'))).rejects.toThrow(
      'GraphQL response did not include data',
    );
  });

  it('propagates transport errors from the http layer', async () => {
    postMock.mockRejectedValue(Object.assign(new Error('network down'), { isAxiosError: true }));
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request(testDocument('query { users { id } }'))).rejects.toThrow(
      'network down',
    );
  });

  it('wraps non-transport errors', async () => {
    postMock.mockRejectedValue(new Error('something odd'));
    const { result } = renderHook(() => useGraphql());

    await expect(result.current.request(testDocument('query { users { id } }'))).rejects.toThrow(
      'Unexpected error sending GraphQL request',
    );
  });
});
