'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PeopleCard, { type PeopleCardProps } from '../PeopleCard';

interface PeopleSectionProps extends Omit<PeopleCardProps, 'collapsed' | 'toggleControl'> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function PeopleSection({ isCollapsed, onToggle }: PeopleSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Household</CardTitle>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <PeopleCard collapsed={false} toggleControl={null} />
        </CardContent>
      )}
    </Card>
  );
}

export default PeopleSection;
