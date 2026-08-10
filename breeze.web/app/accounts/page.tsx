'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '../future/hooks/usePlannerState';
import { usePlaidConnections, useSyncPlaidConnection } from '@/lib/services/hooks/usePlaid';

import { AccountsSection } from '../future/components/sections';
import { usePlannerHydration } from '../future/hooks/usePlannerHydration';

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}

function AccountsContent() {
  const { isLoaded: clerkLoaded } = useUser();
  const { userId, isLoaded } = useCurrentUser();
  const { data: connections } = usePlaidConnections(userId);
  const { mutate: syncConnection } = useSyncPlaidConnection();
  const hasSyncedRef = useRef(false);

  // Auto-sync Plaid connections on page load (once per session)
  useEffect(() => {
    if (!connections || connections.length === 0 || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    for (const conn of connections) {
      syncConnection(conn.id);
    }
  }, [connections, syncConnection]);

  // Manage local UI state
  const { collapsedSections, toggleSection } = usePlannerState();

  // Load planner data from API on mount and hydrate state
  usePlannerHydration();

  // Show loading state while user data loads
  if (!clerkLoaded || !isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="space-y-2 text-center">
          <Loader2 className="text-info mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Accounts</h1>
        <p className="text-muted-foreground text-sm">Configure your financial accounts</p>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-6">
        <AccountsSection
          isCollapsed={collapsedSections['accounts']}
          onToggle={() => toggleSection('accounts')}
        />
      </div>
    </div>
  );
}
