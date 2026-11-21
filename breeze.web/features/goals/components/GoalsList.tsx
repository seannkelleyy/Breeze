'use client';
import { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '@/features/planning/providers/PlannerStateProvider';
import { isLiabilityAccountType } from '@/features/planning/lib/config';
import { formatCurrencyWithCode } from '@/lib/utils';
import { useGoalMutations } from '../hooks/useGoalMutations';
import { Goal, GOAL_CATEGORIES } from '../types';
import type { PlannerAccount } from '@/features/planning/types/account';
import { GoalForm } from './GoalForm';

function levelLabel(category: string): string {
  return GOAL_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

function GoalProgressRow({ goal, accounts }: { goal: Goal; accounts: PlannerAccount[] }) {
  const { currencyCode } = useCurrentUser();
  const target = Number(goal.targetAmount ?? 0);
  const connected = goal.connectedAccountIds ?? [];
  if (!(target > 0) || connected.length === 0) return null;

  // Only asset balances count toward a goal — a connected liability would
  // otherwise *increase* progress.
  const saved = accounts
    .filter((a) => connected.includes(a.id) && !isLiabilityAccountType(a.accountType))
    .reduce((sum, a) => sum + (a.startingBalance || 0), 0);
  const percent = Math.min(100, (saved / target) * 100);

  return (
    <div className="mt-1 space-y-0.5">
      <Progress value={percent} className="h-1.5" />
      <p className="text-muted-foreground text-[10px]">
        {formatCurrencyWithCode(saved, currencyCode)} of{' '}
        {formatCurrencyWithCode(target, currencyCode)} ({percent.toFixed(0)}%)
      </p>
    </div>
  );
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

export function GoalsList({ goals }: { goals: Goal[] }) {
  const { plannerAccounts } = usePlannerState();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { updateGoal, deleteGoal } = useGoalMutations({
    onUpdateSuccess: () => setEditingId(null),
  });
  const update = (goal: Goal) => updateGoal.mutate(goal);
  const remove = (id: string) => deleteGoal.mutate(id);

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
                <GoalInlineEdit goal={goal} onSave={update} onCancel={() => setEditingId(null)} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove(goal.id)}
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
                onCheckedChange={(checked) => update({ ...goal, isCompleted: !!checked })}
                aria-label={`Mark ${goal.description} complete`}
              />
              <div className="flex-1">
                {editingId === goal.id ? (
                  <GoalInlineEdit goal={goal} onSave={update} onCancel={() => setEditingId(null)} />
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
                    <GoalProgressRow goal={goal} accounts={plannerAccounts} />
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove(goal.id)}
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
