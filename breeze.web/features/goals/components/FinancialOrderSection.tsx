'use client';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Goal } from '../types';

export function FinancialOrderSection({ steps }: { steps: Goal[] }) {
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
