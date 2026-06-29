'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RetirementInputsCard, type RetirementInputsCardProps } from '../RetirementInputsCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RetirementInputsSectionProps extends Omit<
  RetirementInputsCardProps,
  'collapsed' | 'toggleControl'
> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function RetirementInputsSection({
  isCollapsed,
  onToggle,
  ...cardProps
}: RetirementInputsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Retirement Inputs</CardTitle>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <RetirementInputsCard collapsed={false} toggleControl={null} {...cardProps} />
        </CardContent>
      )}
    </Card>
  );
}

export default RetirementInputsSection;
