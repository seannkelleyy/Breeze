'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoalMutations } from '../hooks/useGoalMutations';

export function GoalForm({ onCancel }: { onCancel: () => void }) {
  const [description, setDescription] = useState('');
  const { createGoal } = useGoalMutations({
    onCreateSuccess: () => {
      setDescription('');
      onCancel();
    },
  });
  const { mutate: create, isPending } = createGoal;
  const submit = () => create({ description, priority: 99 });

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
            if (e.key === 'Enter' && description.trim()) submit();
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!description.trim() || isPending} onClick={submit}>
          Save Goal
        </Button>
      </div>
    </div>
  );
}
