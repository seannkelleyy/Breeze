'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

type RequireAuthProps = {
  children: ReactNode;
};

// Gate for pages that read or write user data: children only mount once the
// signed-in user is resolved; a signed-out visitor is sent to the homepage
// (the sign-in screen) instead of rendering the page.
export function RequireAuth({ children }: RequireAuthProps) {
  const { isLoaded, isSignedIn, userId } = useCurrentUser();
  const router = useRouter();

  const ready = isLoaded && isSignedIn && userId !== '';

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-info mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
