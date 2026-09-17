'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrencyWithCode } from '../lib/plannerMath';

interface FIREVariantCardProps {
  label: string;
  target: number;
  currentPortfolio: number;
  monthlyNeeded: number;
  yearsToGoal: number | null;
  isSelected: boolean;
  currencyCode: string;
  onClick: () => void;
}

export function FIREVariantCard({
  label,
  target,
  currentPortfolio,
  monthlyNeeded,
  yearsToGoal,
  isSelected,
  currencyCode,
  onClick,
}: FIREVariantCardProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const score = target > 0 ? Math.min(100, (currentPortfolio / target) * 100) : 0;
  const achieved = yearsToGoal === null || yearsToGoal <= 0;

  const scoreColor =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  const progressColor =
    score >= 80
      ? '[&>[data-slot=progress-indicator]]:bg-success'
      : score >= 50
        ? '[&>[data-slot=progress-indicator]]:bg-warning'
        : '[&>[data-slot=progress-indicator]]:bg-destructive';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected ? 'border-primary ring-primary/20 ring-2' : 'hover:border-primary/30',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-1 text-xl font-bold">{fc(target)}</p>
          </div>
          <div className="text-right">
            <p className={cn('text-2xl font-bold', scoreColor)}>{score.toFixed(0)}%</p>
            <p className="text-muted-foreground text-[10px]">Progress</p>
          </div>
        </div>

        <Progress value={score} className={cn('mt-3 h-1.5', progressColor)} />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {fc(monthlyNeeded)}/mo <span className="text-[10px]">({fc(monthlyNeeded * 12)}/yr)</span>
          </span>
          <span className="text-muted-foreground">
            {achieved ? 'Achieved!' : yearsToGoal !== null ? `${yearsToGoal.toFixed(1)} yrs` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
