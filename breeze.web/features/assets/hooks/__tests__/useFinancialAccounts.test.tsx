import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

const { requestMock, userState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  userState: { userId: 'user-1' as string | null },
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

import { useAssets, useLiabilities } from '../useFinancialAccounts';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, queryClient };
};

describe('financial account query hooks', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'user-1';
  });

  it('loads assets and liabilities without sending a user id', async () => {
    requestMock.mockImplementation((document) =>
      Promise.resolve(
        print(document).includes('GetAssetsByUser')
          ? { assets: [{ id: 'a1' }] }
          : { liabilities: [{ id: 'l1' }] },
      ),
    );
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => ({ assets: useAssets(), liabilities: useLiabilities() }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.assets.data).toEqual([{ id: 'a1' }]);
      expect(result.current.liabilities.data).toEqual([{ id: 'l1' }]);
    });

    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock).toHaveBeenCalledWith(expect.anything());
    expect(queryClient.getQueryData(['assets', 'user-1'])).toEqual([{ id: 'a1' }]);
    expect(queryClient.getQueryData(['liabilities', 'user-1'])).toEqual([{ id: 'l1' }]);
  });

  it('does not fetch without a resolved user', () => {
    userState.userId = null;
    const { wrapper } = createWrapper();

    renderHook(() => ({ assets: useAssets(), liabilities: useLiabilities() }), { wrapper });

    expect(requestMock).not.toHaveBeenCalled();
  });
});
