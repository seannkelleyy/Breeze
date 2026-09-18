'use client';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ListChecks, Loader2, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '@/app/future/providers/PlannerStateProvider';
import useGoalsApi from './hooks/useGoalsApi';
import { Goal, GOAL_CATEGORIES } from './types/goal';
import { computeFooStepCompletion } from './lib/fooCompletion';

const GOALS_QUERY_KEY = ['goals'];

export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pt-16 pb-6 sm:px-6 lg:px-8">
      <GoalsContent />
    </div>
  );
}

function GoalsContent() {
  const { isLoaded: clerkLoaded } = useUser();
  const { userId, isLoaded } = useCurrentUser();
  const { plannerAccounts, plannerSummary } = usePlannerState();
  const queryClient = useQueryClient();
  const api = useGoalsApi();

  const {
    data: goals,
    isLoading,
    isError,
  } = useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: () => api.getGoals(),
    enabled: isLoaded && !!userId,
  });

  const { mutate: createFinancialOrderSteps, isPending: isCreatingSteps } = useMutation({
    mutationFn: () => api.createFinancialOrderSteps(),
    onSuccess: (created) => {
      queryClient.setQueryData<Goal[]>(GOALS_QUERY_KEY, (existing) => {
        const others = (existing ?? []).filter((g) => !g.isFinancialOrderStep);
        return [...others, ...created];
      });
    },
  });

  const footSteps = useMemo(
    () =>
      (goals ?? [])
        .filter((g) => g.isFinancialOrderStep)
        .sort((a, b) => (a.financialOrderStep ?? 0) - (b.financialOrderStep ?? 0)),
    [goals],
  );

  const regularGoals = useMemo(() => (goals ?? []).filter((g) => !g.isFinancialOrderStep), [goals]);

  // Create FOO steps on first visit if none exist.
  useEffect(() => {
    if (isLoaded && userId && !isLoading && goals !== undefined && footSteps.length === 0) {
      createFinancialOrderSteps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId, isLoading, goals]);

  // Auto-check FOO steps based on planner data
  const completionStatus = useMemo(
    () => computeFooStepCompletion(plannerAccounts, plannerSummary),
    [plannerAccounts, plannerSummary],
  );

  const { mutate: autoCheckFooSteps } = useMutation({
    mutationFn: async (stepsToCheck: Goal[]) => {
      for (const step of stepsToCheck) {
        await api.updateGoal({
          id: step.id,
          description: step.description,
          priority: step.priority,
          isCompleted: true,
          connectedAccountIds: step.connectedAccountIds ?? [],
          isFinancialOrderStep: true,
        });
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
  });

  useEffect(() => {
    if (isLoading || footSteps.length === 0) return;

    const stepsToCheck = footSteps.filter((step) => {
      const stepNum = step.financialOrderStep;
      if (stepNum == null) return false;
      const shouldBeComplete = completionStatus.get(stepNum) ?? false;
      return shouldBeComplete && !step.isCompleted;
    });

    if (stepsToCheck.length > 0) {
      autoCheckFooSteps(stepsToCheck);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionStatus, footSteps]);

  if (!clerkLoaded || !isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-info mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isLoading || isCreatingSteps) {
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

function FinancialOrderSection({ steps }: { steps: Goal[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="text-muted-foreground h-4 w-4" />
          <div>
            <CardTitle className="text-lg font-semibold">Financial Order of Operations</CardTitle>
            <CardDescription>Follow these steps in order to build your wealth</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.isCompleted ? (
              <CheckCircle2 className="text-success h-5 w-5 shrink-0" />
            ) : (
              <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
            )}
            <span
              className={
                step.isCompleted ? 'text-muted-foreground text-sm line-through' : 'text-sm'
              }
            >
              {step.description}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GoalsList({ goals }: { goals: Goal[] }) {
  const queryClient = useQueryClient();
  const api = useGoalsApi();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidateGoals = () => void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });

  const { mutate: toggleCompletion } = useMutation({
    mutationFn: (goal: Goal & { isCompleted: boolean }) =>
      api.updateGoal({
        id: goal.id,
        description: goal.description,
        priority: goal.priority,
        isCompleted: goal.isCompleted,
        connectedAccountIds: goal.connectedAccountIds ?? [],
        isFinancialOrderStep: goal.isFinancialOrderStep,
      }),
    onSuccess: invalidateGoals,
  });

  const { mutate: updateGoal } = useMutation({
    mutationFn: (goal: Goal) =>
      api.updateGoal({
        id: goal.id,
        description: goal.description,
        priority: goal.priority,
        isCompleted: goal.isCompleted,
        connectedAccountIds: goal.connectedAccountIds ?? [],
        isFinancialOrderStep: goal.isFinancialOrderStep,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidateGoals();
    },
  });

  const { mutate: deleteGoal } = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: invalidateGoals,
  });

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">My Goals</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" /> Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && <GoalForm onCancel={() => setShowForm(false)} />}
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Target className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No goals yet. Add your first financial goal to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">My Goals</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {showForm && <GoalForm onCancel={() => setShowForm(false)} />}
        {goals.map((goal) =>
          editingId === goal.id ? (
            <div key={goal.id} className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <Checkbox
                checked={goal.isCompleted}
                disabled
                aria-label={`Mark ${goal.description} complete`}
              />
              <div className="flex-1">
                <GoalInlineEdit
                  goal={goal}
                  onSave={(updated: Goal) => updateGoal(updated)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteGoal(goal.id)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div
              key={goal.id}
              className="hover:bg-accent flex items-center gap-3 rounded-md px-2 py-1.5"
            >
              <Checkbox
                checked={goal.isCompleted}
                onCheckedChange={(checked) => toggleCompletion({ ...goal, isCompleted: !!checked })}
                aria-label={`Mark ${goal.description} complete`}
              />
              <div className="flex-1">
                {editingId === goal.id ? (
                  <GoalInlineEdit
                    goal={goal}
                    onSave={(updated) => updateGoal(updated)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <p
                      className={
                        goal.isCompleted
                          ? 'text-muted-foreground cursor-pointer text-sm line-through'
                          : 'cursor-pointer text-sm'
                      }
                      onDoubleClick={() => setEditingId(goal.id)}
                    >
                      {goal.description}
                    </p>
                    {goal.category && (
                      <p className="text-muted-foreground text-xs">{levelLabel(goal.category)}</p>
                    )}
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => deleteGoal(goal.id)}
              >
                Remove
              </Button>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function levelLabel(category: string): string {
  return GOAL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

function GoalInlineEdit({
  goal,
  onSave,
  onCancel,
}: {
  goal: Goal;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(goal.description);

  return (
    <Input
      autoFocus
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      onBlur={() => {
        const trimmed = description.trim();
        if (trimmed && trimmed !== goal.description) {
          onSave({ ...goal, description: trimmed });
        }
        onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
          onCancel();
        }
      }}
    />
  );
}

function GoalForm({ onCancel }: { onCancel: () => void }) {
  const queryClient = useQueryClient();
  const api = useGoalsApi();
  const [description, setDescription] = useState('');

  const { mutate: createGoal, isPending } = useMutation({
    mutationFn: () => api.createGoal({ description, priority: 99 }),
    onSuccess: () => {
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
      onCancel();
    },
  });

  return (
    <div className="bg-accent/50 space-y-3 rounded-md p-3">
      <div className="space-y-1">
        <Label htmlFor="goal-description">Goal</Label>
        <Input
          id="goal-description"
          placeholder="e.g. Save $10k for a down payment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && description.trim()) createGoal();
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!description.trim() || isPending} onClick={() => createGoal()}>
          Save Goal
        </Button>
      </div>
    </div>
  );
}
