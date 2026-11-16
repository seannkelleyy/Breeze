'use client';
import { Suspense } from 'react';
import { CurrentUserProvider } from '@/lib/providers/CurrentUserProvider';
import { PlannerStateProvider } from '@/features/planning/providers/PlannerStateProvider';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SetupWizard } from '@/components/common/setup/SetupWizard';
import { ConnectionsDialogProvider } from '@/components/common/connections/ConnectionsDialogProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="System">
          <PlannerStateProvider>
            <CurrentUserProvider>
              <ConnectionsDialogProvider>
                {children}
                <Suspense>
                  <SetupWizard />
                </Suspense>
              </ConnectionsDialogProvider>
            </CurrentUserProvider>
          </PlannerStateProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default Providers;
