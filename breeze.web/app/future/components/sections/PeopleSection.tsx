'use client';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PeopleCard, { type PeopleCardProps } from '../PeopleCard';

interface PeopleSectionProps extends Omit<PeopleCardProps, 'collapsed' | 'toggleControl'> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function PeopleSection({ isCollapsed, onToggle }: PeopleSectionProps) {
  const toggleButton = (
    <Button variant="ghost" size="icon" onClick={onToggle}>
      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
    </Button>
  );

  return <PeopleCard collapsed={isCollapsed} toggleControl={toggleButton} />;
}

export default PeopleSection;