'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useGoalsApi from '../hooks/useGoalsApi';
import { GOALS_QUERY_KEY } from '../hooks/useGoals';

export function GoalForm({ onCancel }: { onCancel: () => void }) {
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
