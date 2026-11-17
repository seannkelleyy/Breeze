'use client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { useGoals } from '@/features/goals/hooks/useGoals';
import { FinancialOrderSection } from '@/features/goals/components/FinancialOrderSection';
import { GoalsList } from '@/features/goals/components/GoalsList';

export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pt-16 pb-6 sm:px-6 lg:px-8">
      <RequireAuth>
        <GoalsContent />
      </RequireAuth>
    </div>
  );
}

function GoalsContent() {
  const { footSteps, regularGoals, isLoading, isError } = useGoals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load goals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Goals</h1>
        <p className="text-muted-foreground text-sm">
          Plan, prioritize, and track your financial goals
        </p>
      </div>

      <FinancialOrderSection steps={footSteps} />

      <GoalsList goals={regularGoals} />
    </>
  );
}
