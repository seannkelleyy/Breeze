'use client';
import AccountsCard from '../AccountsCard';

interface AccountsSectionProps {
  isCollapsed: boolean;
}

export function AccountsSection({ isCollapsed }: AccountsSectionProps) {
  return <AccountsCard collapsed={isCollapsed} />;
}

export default AccountsSection;
