'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '@/lib/utils';

interface FireAchievement {
  label: string;
  target: number;
  achievementAge: number | null;
  yearsToAchieve: number | null;
}

interface FIRETargetsSectionProps {
  fireAchievementAges: FireAchievement[];
  currentAge: number;
}

export function FIRETargetsSection({ fireAchievementAges, currentAge }: FIRETargetsSectionProps) {
  const { currencyCode } = useCurrentUser();
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">FIRE Progress</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fireAchievementAges.map((item) => {
          const isAchieved = item.achievementAge !== null && item.achievementAge <= currentAge;
          return (
            <Card key={item.label} className={isAchieved ? 'border-success/50 bg-success/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">Target: {fc(item.target)}</p>
                  </div>
                  {isAchieved && (
                    <Badge
                      variant="default"
                      className="bg-success text-success-foreground text-[10px]"
                    >
                      Achieved
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  {item.achievementAge !== null ? (
                    <div>
                      <p className="text-2xl font-bold">Age {item.achievementAge}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.yearsToAchieve === 0
                          ? 'Already reached'
                          : `In ${item.yearsToAchieve} years`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground text-2xl font-bold">N/A</p>
                      <p className="text-muted-foreground text-xs">Not on current trajectory</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
