'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AccountsCard, { type AccountsCardProps } from '../AccountsCard';

interface AccountsSectionProps extends Omit<AccountsCardProps, 'collapsed' | 'toggleControl'> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AccountsSection({ isCollapsed, onToggle }: AccountsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Accounts & Assets</CardTitle>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <AccountsCard collapsed={false} toggleControl={null} />
        </CardContent>
      )}
    </Card>
  );
}

export default AccountsSection;
