'use client';
import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleCardSection({
  title,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleCardSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export default CollapsibleCardSection;
