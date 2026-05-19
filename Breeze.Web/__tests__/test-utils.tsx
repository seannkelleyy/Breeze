import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for testing
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

function renderWithProviders(
  ui: React.ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
export { renderWithProviders };
