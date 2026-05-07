'use client';
import { CurrentUserProvider } from '@/lib/providers/CurrentUserProvider';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <CurrentUserProvider>{children}</CurrentUserProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default Providers;
