'use client';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AccountsCard, { type AccountsCardProps } from '../AccountsCard';

interface AccountsSectionProps extends Omit<AccountsCardProps, 'collapsed' | 'toggleControl'> {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AccountsSection({ isCollapsed, onToggle }: AccountsSectionProps) {
  const toggleButton = (
    <Button variant="ghost" size="icon" onClick={onToggle}>
      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
    </Button>
  );

  return <AccountsCard collapsed={isCollapsed} toggleControl={toggleButton} />;
}

export default AccountsSection;
