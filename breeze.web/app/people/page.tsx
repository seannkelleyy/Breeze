'use client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { usePlannerUiState } from '../future/hooks/usePlannerUiState';

import { PeopleSection } from '../future/components/sections';
import { usePlannerHydration } from '../future/hooks/usePlannerHydration';

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <RequireAuth>
        <PeopleContent />
      </RequireAuth>
    </Suspense>
  );
}

function PeopleContent() {
  // Manage local UI state
  const { collapsedSections } = usePlannerUiState();

  // Load planner data from API on mount and hydrate state
  usePlannerHydration();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pt-16 pb-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">People</h1>
        <p className="text-muted-foreground text-sm">Configure your household members</p>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-6">
        <PeopleSection isCollapsed={collapsedSections['people']} />
      </div>
    </div>
  );
}
